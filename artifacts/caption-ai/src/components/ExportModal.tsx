import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Copy, Printer, FileText, Check, FlaskConical, Hash, CheckCircle2, Download
} from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ProcessedTranscript } from '@/lib/caption-engine';
import { useSettings } from '@/lib/settings-context';
import { Locale, t as rawT } from '@/lib/i18n';

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  transcripts: ProcessedTranscript[];
  globalTerms: { term: string; explanation: string }[];
  globalKeywords: string[];
  sessionStart: Date;
}

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildPrintHtml(
  transcripts: ProcessedTranscript[],
  globalTerms: { term: string; explanation: string }[],
  sessionStart: Date,
  mode: 'save' | 'print' = 'print',
  locale: Locale = 'ko'
): string {
  const isKo = locale === 'ko';
  const dateStr = isKo
    ? format(sessionStart, 'yyyy년 MM월 dd일 (EEEE)', { locale: ko })
    : format(sessionStart, 'MMMM d, yyyy (EEEE)');
  const startTime = format(sessionStart, 'HH:mm');
  const endTime = format(new Date(), 'HH:mm');

  const transcriptRows = transcripts.map((t, i) => {
    const text = t.displayText ?? t.originalText;
    const timeStr = format(t.timestamp, 'HH:mm:ss');
    const topicTag = t.aiTopic
      ? `<span class="tag topic">${esc(t.aiTopic)}</span>`
      : '';
    const tierTag = t.aiTier && t.aiTier !== '일반'
      ? `<span class="tag tier">${esc(t.aiTier)}</span>`
      : '';
    const isDiff = t.displayText && t.displayText !== t.originalText;
    return `
      <tr>
        <td class="idx">${i + 1}</td>
        <td class="time">${timeStr}</td>
        <td class="content">
          ${esc(text)}
          ${topicTag}${tierTag}
          ${isDiff ? `<br/><span class="original">${rawT('transcript.original', locale)}: ${esc(t.originalText)}</span>` : ''}
        </td>
      </tr>`;
  }).join('');

  const termRows = globalTerms.map(({ term, explanation }) => `
    <tr>
      <td class="term-name">${esc(term)}</td>
      <td class="term-desc">${esc(explanation)}</td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Sapital AI ${rawT('export.report.title', locale)} — ${dateStr}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif;
      color: #1e293b;
      background: #f1f5f9;
      font-size: 14px;
      line-height: 1.7;
    }
    .page-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px 20px 60px;
    }
    .a4-page {
      width: 210mm;
      min-height: 297mm;
      background: #fff;
      box-shadow: 0 4px 40px rgba(0,0,0,.18);
      border-radius: 4px;
      padding: 20mm 22mm;
    }
    .print-actions {
      margin-top: 24px;
      display: flex;
      gap: 12px;
    }
    .btn {
      padding: 12px 28px;
      border: none;
      border-radius: 10px;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: inherit;
    }
    .btn-save  { background: #059669; color: #fff; }
    .btn-print { background: #1d6fe8; color: #fff; }
    .btn-close { background: #f1f5f9; color: #475569; }
    .btn:hover { opacity: .88; }
    .report-header {
      border-bottom: 3px solid #1d6fe8;
      padding-bottom: 14px;
      margin-bottom: 20px;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
    }
    .brand { display: flex; align-items: center; gap: 12px; }
    .brand-icon {
      width: 48px; height: 48px;
      background: #1d6fe8;
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
    }
    .brand-icon svg { width: 28px; height: 28px; stroke: #fff; fill: none; stroke-width: 2; }
    .brand-title { font-size: 22px; font-weight: 900; color: #0f172a; }
    .brand-title span { color: #1d6fe8; }
    .brand-sub { font-size: 11px; color: #64748b; margin-top: 2px; }
    .report-label {
      text-align: right;
      font-size: 11px;
      color: #94a3b8;
      line-height: 1.6;
      white-space: nowrap;
    }
    .report-label strong { color: #1e293b; font-size: 13px; display: block; }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      overflow: hidden;
      margin-bottom: 28px;
      background: #f8faff;
    }
    .meta-cell {
      padding: 12px 16px;
      border-right: 1px solid #e2e8f0;
    }
    .meta-cell:last-child { border-right: none; }
    .meta-cell label { font-size: 10px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; }
    .meta-cell p { font-size: 15px; font-weight: 800; color: #0f172a; margin-top: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    h2 {
      font-size: 13px;
      font-weight: 800;
      color: #1d6fe8;
      text-transform: uppercase;
      letter-spacing: .06em;
      border-left: 4px solid #1d6fe8;
      padding-left: 10px;
      margin: 24px 0 12px;
    }
    table.transcript {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    table.transcript thead th {
      background: #eff6ff;
      color: #1d6fe8;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: .05em;
      padding: 8px 10px;
      text-align: left;
      border-bottom: 2px solid #bfdbfe;
    }
    table.transcript tbody tr { border-bottom: 1px solid #f1f5f9; }
    table.transcript tbody tr:last-child { border-bottom: none; }
    table.transcript td { padding: 9px 10px; vertical-align: top; }
    td.idx  { width: 28px; color: #94a3b8; font-size: 11px; font-weight: 800; }
    td.time { width: 70px; color: #64748b; font-size: 11px; white-space: nowrap; }
    td.content { color: #1e293b; font-size: 13px; line-height: 1.6; }
    .original { font-size: 11px; color: #94a3b8; font-style: italic; margin-top: 3px; display: inline-block; }
    .tag {
      display: inline-block;
      font-size: 10px;
      font-weight: 700;
      border-radius: 20px;
      padding: 1px 7px;
      margin-left: 6px;
      vertical-align: middle;
    }
    .tag.topic { background: #eff6ff; color: #1d6fe8; }
    .tag.tier  { background: #fef3c7; color: #92400e; }
    table.terms {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    table.terms thead th {
      background: #eff6ff;
      color: #1d6fe8;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: .05em;
      padding: 8px 12px;
      text-align: left;
      border-bottom: 2px solid #bfdbfe;
    }
    table.terms tbody tr { border-bottom: 1px solid #f1f5f9; }
    table.terms tbody tr:last-child { border-bottom: none; }
    table.terms td { padding: 10px 12px; vertical-align: top; }
    td.term-name {
      width: 28%;
      font-size: 13px;
      font-weight: 800;
      color: #1d6fe8;
      white-space: nowrap;
    }
    td.term-desc { color: #475569; font-size: 13px; line-height: 1.6; }
    .disclaimer {
      margin-top: 28px;
      padding-top: 14px;
      border-top: 1px solid #e2e8f0;
      font-size: 10px;
      color: #94a3b8;
      line-height: 1.8;
      text-align: center;
    }
    @media print {
      @page {
        size: A4;
        margin: 18mm 20mm;
      }
      body {
        background: #fff !important;
        font-size: 12px;
      }
      .no-print { display: none !important; }
      .page-wrap {
        display: block;
        padding: 0;
        background: #fff;
      }
      .a4-page {
        width: 100%;
        min-height: auto;
        box-shadow: none;
        border-radius: 0;
        padding: 0;
      }
      table { page-break-inside: auto; }
      tr     { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="page-wrap">
    <div class="no-print" style="display:flex;flex-direction:column;align-items:center;gap:0;margin-top:32px;margin-bottom:40px;">
      ${mode === 'save' ? `
        <div class="print-actions">
          <button class="btn btn-save" onclick="window.print()">${rawT('export.report.save.pdf', locale)}</button>
          <button class="btn btn-close" onclick="window.close()">${rawT('export.report.close', locale)}</button>
        </div>
      ` : `
        <div class="print-actions">
          <button class="btn btn-print" onclick="window.print()">${rawT('export.report.reprint', locale)}</button>
          <button class="btn btn-close" onclick="window.close()">${rawT('export.report.close', locale)}</button>
        </div>
      `}
    </div>

    ${mode === 'print' ? `<script>window.addEventListener('load', function(){ setTimeout(function(){ window.print(); }, 400); });<\/script>` : ''}

    <div class="a4-page">
      <div class="report-header">
        <div class="brand">
          <div class="brand-icon">
            <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
            </svg>
          </div>
          <div>
            <div class="brand-title">Sapital <span>AI</span></div>
            <div class="brand-sub">${rawT('app.subtitle', locale)}</div>
          </div>
        </div>
        <div class="report-label">
          <strong>${rawT('export.report.title', locale)}</strong>
          ${dateStr} · ${startTime} ~ ${endTime}
        </div>
      </div>

      <div class="meta-grid">
        <div class="meta-cell"><label>${rawT('export.report.date', locale)}</label><p>${dateStr}</p></div>
        <div class="meta-cell"><label>${rawT('export.report.time', locale)}</label><p>${startTime} ~ ${endTime}</p></div>
        <div class="meta-cell"><label>${rawT('export.report.count', locale)}</label><p>${transcripts.length}${isKo ? '건' : ''}</p></div>
      </div>

      <h2>${rawT('export.report.transcript.header', locale)}</h2>
      ${transcripts.length === 0
        ? `<p style="color:#94a3b8;font-size:13px;">${rawT('export.report.no.captions', locale)}</p>`
        : `<table class="transcript">
            <thead>
              <tr>
                <th style="width:28px">${rawT('export.report.col.num', locale)}</th>
                <th style="width:70px">${rawT('export.report.col.time', locale)}</th>
                <th>${rawT('export.report.col.content', locale)}</th>
              </tr>
            </thead>
            <tbody>${transcriptRows}</tbody>
          </table>`}

      ${globalTerms.length > 0 ? `
        <h2>${rawT('export.report.term.header', locale)}</h2>
        <table class="terms">
          <thead>
            <tr>
              <th>${rawT('export.report.col.term', locale)}</th>
              <th>${rawT('export.report.col.desc', locale)}</th>
            </tr>
          </thead>
          <tbody>${termRows}</tbody>
        </table>
      ` : ''}

      <div class="disclaimer">
        ${rawT('export.disclaimer', locale).replace('\n', '<br/>')}
      </div>
    </div>
  </div>
</body>
</html>`;
}

function buildCopyText(
  transcripts: ProcessedTranscript[],
  globalTerms: { term: string; explanation: string }[],
  sessionStart: Date,
  locale: Locale = 'ko'
): string {
  const isKo = locale === 'ko';
  const dateStr = isKo
    ? format(sessionStart, 'yyyy-MM-dd', { locale: ko })
    : format(sessionStart, 'yyyy-MM-dd');
  const timeStr = format(sessionStart, 'HH:mm');

  const recent = transcripts.slice(-5);
  const mainContent = recent.length > 0
    ? recent.map(t => `  · ${t.displayText ?? t.originalText}`).join('\n')
    : `  ${rawT('export.copy.empty', locale)}`;

  const termsContent = globalTerms.length > 0
    ? globalTerms.slice(0, 5).map(({ term, explanation }) => `  · ${term}: ${explanation}`).join('\n')
    : `  ${rawT('export.copy.none', locale)}`;

  return `[${rawT('export.copy.title', locale)}]

${rawT('export.copy.date', locale)}: ${dateStr} ${timeStr}

${rawT('export.copy.main', locale)}:
${mainContent}

${rawT('export.copy.terms', locale)}:
${termsContent}

─────────────────────
${rawT('export.copy.footer', locale)}`;
}

function Toast({ visible, locale }: { visible: boolean; locale: Locale }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[999] flex items-center gap-3 bg-gray-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl pointer-events-none"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <p className="font-bold text-sm">{rawT('export.copied', locale)}</p>
            <p className="text-xs text-white/60">{rawT('export.copied.hint', locale)}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ExportModal({
  open, onClose, transcripts, globalTerms, globalKeywords, sessionStart
}: ExportModalProps) {
  const [toast, setToast] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { t, locale } = useSettings();

  useEffect(() => {
    return () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); };
  }, []);

  const isKo = locale === 'ko';
  const dateStr = isKo
    ? format(sessionStart, 'yyyy년 MM월 dd일 (EEEE)', { locale: ko })
    : format(sessionStart, 'MMMM d, yyyy (EEEE)');
  const startTime = format(sessionStart, 'HH:mm');
  const endTime = format(new Date(), 'HH:mm');

  const handleCopy = async () => {
    const text = buildCopyText(transcripts, globalTerms, sessionStart, locale);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setToast(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(false), 3000);
  };

  const openWindow = (mode: 'save' | 'print') => {
    const html = buildPrintHtml(transcripts, globalTerms, sessionStart, mode, locale);
    const win = window.open('', '_blank', 'width=900,height=1100,scrollbars=yes');
    if (!win) {
      alert(t('export.popup.blocked'));
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
  };

  const handleSave = async () => {
    const html = buildPrintHtml(transcripts, globalTerms, sessionStart, 'save', locale);
    const blob = new Blob([html], { type: 'text/html; charset=utf-8' });
    const fileName = `Sapital-AI-${format(sessionStart, 'yyyy-MM-dd')}.html`;

    if ('showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: fileName,
          types: [{ description: 'HTML 파일', accept: { 'text/html': ['.html'] } }],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return;
      } catch (e: any) {
        if (e?.name === 'AbortError') return;
      }
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => openWindow('print');

  return (
    <>
      <Toast visible={toast} locale={locale} />

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[620px] max-h-[86vh] z-50 flex flex-col bg-card rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-gradient-to-r from-primary/5 to-transparent shrink-0">
                <div className="bg-primary/10 p-2 rounded-xl">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-extrabold text-foreground text-base">{t('export.title')}</h2>
                  <p className="text-xs text-muted-foreground">{dateStr} · {startTime} ~ {endTime}</p>
                </div>
                <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-0 border-b border-border shrink-0">
                {[
                  { label: t('export.captions'), value: `${transcripts.length}${isKo ? '건' : ''}` },
                  { label: t('export.terms'), value: `${globalTerms.length}${isKo ? '개' : ''}` },
                  { label: t('export.keywords'), value: `${globalKeywords.length}${isKo ? '개' : ''}` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex flex-col items-center py-3 border-r last:border-r-0 border-border">
                    <span className="text-xl font-extrabold text-primary">{value}</span>
                    <span className="text-[10px] text-muted-foreground font-semibold">{label}</span>
                  </div>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                <section>
                  <h3 className="flex items-center gap-2 text-xs font-extrabold text-muted-foreground uppercase tracking-widest mb-3">
                    <FileText className="w-3.5 h-3.5" />
                    {t('export.section.captions')}
                  </h3>
                  {transcripts.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">{t('export.empty')}</p>
                  ) : (
                    <div className="space-y-2">
                      {transcripts.map((tr, i) => {
                        const text = tr.displayText ?? tr.originalText;
                        const isDiff = tr.displayText && tr.displayText !== tr.originalText;
                        return (
                          <div key={tr.id} className="rounded-xl border border-border p-3.5 bg-background">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <span className="text-xs font-bold text-muted-foreground/50">{i + 1}</span>
                              <span className="text-xs text-muted-foreground">{format(tr.timestamp, 'HH:mm:ss')}</span>
                              {tr.aiTopic && (
                                <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{tr.aiTopic}</span>
                              )}
                              {tr.aiTier && tr.aiTier !== '일반' && (
                                <span className="text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full">{tr.aiTier}</span>
                              )}
                            </div>
                            <p className="text-sm font-medium text-foreground leading-relaxed">{text}</p>
                            {isDiff && (
                              <p className="text-xs text-muted-foreground/50 italic mt-1 pt-1 border-t border-border/50">{rawT('transcript.original', locale)}: {tr.originalText}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                {globalTerms.length > 0 && (
                  <section>
                    <h3 className="flex items-center gap-2 text-xs font-extrabold text-muted-foreground uppercase tracking-widest mb-3">
                      <FlaskConical className="w-3.5 h-3.5" />
                      {t('export.section.terms')}
                    </h3>
                    <div className="space-y-2">
                      {globalTerms.map(({ term, explanation }) => (
                        <div key={term} className="rounded-xl border border-border p-3.5 bg-background">
                          <p className="text-sm font-bold text-primary">{term}</p>
                          <p className="text-xs text-muted-foreground leading-relaxed mt-1">{explanation}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {globalKeywords.length > 0 && (
                  <section>
                    <h3 className="flex items-center gap-2 text-xs font-extrabold text-muted-foreground uppercase tracking-widest mb-3">
                      <Hash className="w-3.5 h-3.5" />
                      {t('export.keywords')}
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {globalKeywords.map(kw => (
                        <span key={kw} className="bg-primary/10 text-primary text-xs font-semibold px-2.5 py-1 rounded-full">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              <div className="border-t border-border px-6 py-4 flex gap-2 shrink-0 bg-card">
                <button
                  onClick={handleCopy}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-secondary hover:bg-muted text-foreground font-semibold text-sm transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  {t('export.copy')}
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors"
                >
                  <Download className="w-4 h-4" />
                  {t('export.save')}
                </button>
                <button
                  onClick={handlePrint}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-sm transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  {t('export.print')}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
