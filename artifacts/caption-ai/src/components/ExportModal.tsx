import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Printer, FileText, Check, FlaskConical, Hash } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ProcessedTranscript } from '@/lib/caption-engine';
import { useState } from 'react';

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  transcripts: ProcessedTranscript[];
  globalTerms: { term: string; explanation: string }[];
  globalKeywords: string[];
  sessionStart: Date;
}

function buildTextContent(
  transcripts: ProcessedTranscript[],
  globalTerms: { term: string; explanation: string }[],
  globalKeywords: string[],
  sessionStart: Date
): string {
  const date = format(sessionStart, 'yyyy년 MM월 dd일 (EEE)', { locale: ko });
  const startTime = format(sessionStart, 'HH:mm');
  const endTime = format(new Date(), 'HH:mm');

  const lines: string[] = [
    '════════════════════════════════════════',
    '           Sapital AI — 오늘의 진료 기록',
    '════════════════════════════════════════',
    `📅 날짜: ${date}`,
    `🕐 진료 시간: ${startTime} ~ ${endTime}`,
    `💬 자막 수: ${transcripts.length}건`,
    '',
    '────────────────────────────────────────',
    '[ 의사 발화 자막 기록 ]',
    '────────────────────────────────────────',
  ];

  transcripts.forEach((t, i) => {
    const text = t.displayText ?? t.originalText;
    const time = format(t.timestamp, 'HH:mm:ss');
    lines.push(`${i + 1}. [${time}] ${text}`);
    if (t.aiTopic) lines.push(`   주제: ${t.aiTopic}${t.aiTier && t.aiTier !== '일반' ? ` (${t.aiTier})` : ''}`);
  });

  if (globalTerms.length > 0) {
    lines.push('');
    lines.push('────────────────────────────────────────');
    lines.push('[ 오늘 나온 의학 용어 풀이 ]');
    lines.push('────────────────────────────────────────');
    globalTerms.forEach(({ term, explanation }) => {
      lines.push(`• ${term}`);
      lines.push(`  → ${explanation}`);
    });
  }

  if (globalKeywords.length > 0) {
    lines.push('');
    lines.push('────────────────────────────────────────');
    lines.push('[ 오늘 진료의 핵심 키워드 ]');
    lines.push('────────────────────────────────────────');
    lines.push(globalKeywords.map(k => `#${k}`).join('  '));
  }

  lines.push('');
  lines.push('════════════════════════════════════════');
  lines.push('※ 본 기록은 Sapital AI가 자동 생성한 참고용 자료입니다.');
  lines.push('   의료적 판단은 반드시 담당 의사와 상담하세요.');
  lines.push('════════════════════════════════════════');

  return lines.join('\n');
}

export function ExportModal({ open, onClose, transcripts, globalTerms, globalKeywords, sessionStart }: ExportModalProps) {
  const [copied, setCopied] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const date = format(sessionStart, 'yyyy년 MM월 dd일 (EEEE)', { locale: ko });
  const startTime = format(sessionStart, 'HH:mm');
  const endTime = format(new Date(), 'HH:mm');

  const handleCopy = async () => {
    const text = buildTextContent(transcripts, globalTerms, globalKeywords, sessionStart);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    const content = buildTextContent(transcripts, globalTerms, globalKeywords, sessionStart);
    const win = window.open('', '_blank', 'width=700,height=900');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="utf-8"/>
        <title>Sapital AI 진료 기록 — ${date}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Noto Sans KR', sans-serif; color: #1e293b; background: #fff; padding: 40px; line-height: 1.7; }
          .header { border-bottom: 3px solid #1d6fe8; padding-bottom: 20px; margin-bottom: 28px; display: flex; align-items: center; gap: 14px; }
          .logo-icon { width: 48px; height: 48px; background: #1d6fe8; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
          .logo-icon svg { width: 28px; height: 28px; fill: none; stroke: white; stroke-width: 2; }
          h1 { font-size: 22px; font-weight: 900; color: #0f172a; }
          h1 span { color: #1d6fe8; }
          .subtitle { font-size: 12px; color: #64748b; margin-top: 2px; }
          .meta { background: #f0f7ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 16px 20px; margin-bottom: 28px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
          .meta-item label { font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
          .meta-item p { font-size: 15px; font-weight: 700; color: #0f172a; margin-top: 2px; }
          h2 { font-size: 14px; font-weight: 800; color: #1d6fe8; border-left: 4px solid #1d6fe8; padding-left: 10px; margin: 24px 0 14px; text-transform: uppercase; letter-spacing: 0.05em; }
          .transcript-item { border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 16px; margin-bottom: 10px; background: #fafbfc; }
          .transcript-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
          .transcript-idx { font-size: 11px; font-weight: 800; color: #94a3b8; }
          .transcript-time { font-size: 11px; color: #94a3b8; }
          .transcript-topic { font-size: 11px; font-weight: 700; background: #eff6ff; color: #1d6fe8; border-radius: 20px; padding: 2px 8px; }
          .transcript-tier { font-size: 11px; font-weight: 700; background: #fef3c7; color: #92400e; border-radius: 20px; padding: 2px 8px; }
          .transcript-text { font-size: 15px; font-weight: 500; color: #1e293b; line-height: 1.6; }
          .transcript-original { font-size: 12px; color: #94a3b8; margin-top: 6px; font-style: italic; }
          .term-item { border-left: 3px solid #1d6fe8; padding: 10px 14px; margin-bottom: 10px; background: #f8faff; border-radius: 0 8px 8px 0; }
          .term-name { font-size: 14px; font-weight: 800; color: #1d6fe8; }
          .term-desc { font-size: 13px; color: #475569; margin-top: 3px; }
          .keywords { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px; }
          .keyword { background: #eff6ff; color: #1d6fe8; font-size: 13px; font-weight: 700; padding: 4px 12px; border-radius: 20px; border: 1px solid #bfdbfe; }
          .footer { margin-top: 36px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; line-height: 1.8; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-icon">
            <svg viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>
          </div>
          <div>
            <h1>Sapital <span>AI</span></h1>
            <div class="subtitle">오늘의 진료 기록 — 자동 생성 문서</div>
          </div>
        </div>

        <div class="meta">
          <div class="meta-item"><label>진료 날짜</label><p>${date}</p></div>
          <div class="meta-item"><label>진료 시간</label><p>${startTime} ~ ${endTime}</p></div>
          <div class="meta-item"><label>자막 기록</label><p>${transcripts.length}건</p></div>
        </div>

        <h2>의사 발화 자막 기록</h2>
        ${transcripts.map((t, i) => {
          const text = t.displayText ?? t.originalText;
          const isDiff = t.displayText && t.displayText !== t.originalText;
          return `
            <div class="transcript-item">
              <div class="transcript-meta">
                <span class="transcript-idx">${i + 1}</span>
                <span class="transcript-time">${format(t.timestamp, 'HH:mm:ss')}</span>
                ${t.aiTopic ? `<span class="transcript-topic">${t.aiTopic}</span>` : ''}
                ${t.aiTier && t.aiTier !== '일반' ? `<span class="transcript-tier">${t.aiTier}</span>` : ''}
              </div>
              <div class="transcript-text">${text}</div>
              ${isDiff ? `<div class="transcript-original">원본: ${t.originalText}</div>` : ''}
            </div>`;
        }).join('')}

        ${globalTerms.length > 0 ? `
          <h2>오늘 나온 의학 용어 풀이</h2>
          ${globalTerms.map(({ term, explanation }) => `
            <div class="term-item">
              <div class="term-name">${term}</div>
              <div class="term-desc">${explanation}</div>
            </div>
          `).join('')}
        ` : ''}

        ${globalKeywords.length > 0 ? `
          <h2>오늘 진료의 핵심 키워드</h2>
          <div class="keywords">
            ${globalKeywords.map(k => `<span class="keyword">#${k}</span>`).join('')}
          </div>
        ` : ''}

        <div class="footer">
          ※ 본 기록은 Sapital AI가 음성 인식 및 AI 분석으로 자동 생성한 참고용 자료입니다.<br/>
          의료적 판단은 반드시 담당 의사 선생님과 상담하시기 바랍니다.<br/>
          Sapital AI — 청각장애인 병원 진료 맞춤 소통 서비스
        </div>
      </body>
      </html>
    `);
    win.document.close();
    setTimeout(() => win.print(), 300);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[640px] max-h-[85vh] z-50 flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Modal header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-gradient-to-r from-primary/5 to-transparent shrink-0">
              <div className="bg-primary/10 p-2 rounded-xl">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-extrabold text-foreground text-base">오늘의 진료 기록</h2>
                <p className="text-xs text-muted-foreground">{date} · {startTime} ~ {endTime}</p>
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stats bar */}
            <div className="grid grid-cols-3 gap-0 border-b border-border shrink-0">
              {[
                { label: '자막 기록', value: `${transcripts.length}건` },
                { label: '의학 용어', value: `${globalTerms.length}개` },
                { label: '핵심 키워드', value: `${globalKeywords.length}개` },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col items-center py-3 border-r last:border-r-0 border-border">
                  <span className="text-xl font-extrabold text-primary">{value}</span>
                  <span className="text-[10px] text-muted-foreground font-semibold">{label}</span>
                </div>
              ))}
            </div>

            {/* Scrollable content */}
            <div ref={printRef} className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

              {/* Transcript list */}
              <section>
                <h3 className="flex items-center gap-2 text-xs font-extrabold text-muted-foreground uppercase tracking-widest mb-3">
                  <FileText className="w-3.5 h-3.5" />
                  의사 발화 자막 기록
                </h3>
                {transcripts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">기록된 자막이 없습니다</p>
                ) : (
                  <div className="space-y-2">
                    {transcripts.map((t, i) => {
                      const text = t.displayText ?? t.originalText;
                      const isDiff = t.displayText && t.displayText !== t.originalText;
                      return (
                        <div key={t.id} className="rounded-xl border border-border p-3.5 bg-background">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="text-xs font-bold text-muted-foreground/60">{i + 1}</span>
                            <span className="text-xs text-muted-foreground">{format(t.timestamp, 'HH:mm:ss')}</span>
                            {t.aiTopic && (
                              <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{t.aiTopic}</span>
                            )}
                            {t.aiTier && t.aiTier !== '일반' && (
                              <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">{t.aiTier}</span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-foreground leading-relaxed">{text}</p>
                          {isDiff && (
                            <p className="text-xs text-muted-foreground/60 italic mt-1 pt-1 border-t border-border/50">원본: {t.originalText}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Medical terms */}
              {globalTerms.length > 0 && (
                <section>
                  <h3 className="flex items-center gap-2 text-xs font-extrabold text-muted-foreground uppercase tracking-widest mb-3">
                    <FlaskConical className="w-3.5 h-3.5" />
                    오늘 나온 의학 용어 풀이
                  </h3>
                  <div className="space-y-2">
                    {globalTerms.map(({ term, explanation }) => (
                      <div key={term} className="flex items-start gap-3 rounded-xl border-l-4 border-primary/40 bg-primary/5 px-4 py-3">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-primary">{term}</p>
                          <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{explanation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Keywords */}
              {globalKeywords.length > 0 && (
                <section>
                  <h3 className="flex items-center gap-2 text-xs font-extrabold text-muted-foreground uppercase tracking-widest mb-3">
                    <Hash className="w-3.5 h-3.5" />
                    오늘 진료의 핵심 키워드
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {globalKeywords.map(kw => (
                      <span key={kw} className="bg-primary/10 text-primary text-sm font-bold px-3 py-1.5 rounded-full border border-primary/20">
                        #{kw}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {/* Disclaimer */}
              <div className="text-xs text-muted-foreground/60 leading-relaxed pt-2 border-t border-border/50">
                ※ 본 기록은 Sapital AI가 자동 생성한 참고용 자료입니다. 의료적 판단은 반드시 담당 의사 선생님과 상담하세요.
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 px-6 py-4 border-t border-border bg-background shrink-0">
              <button
                onClick={handleCopy}
                className="flex-1 flex items-center justify-center gap-2 bg-secondary hover:bg-muted text-foreground font-bold text-sm py-3 rounded-xl transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                {copied ? '복사 완료!' : '텍스트 복사'}
              </button>
              <button
                onClick={handlePrint}
                className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold text-sm py-3 rounded-xl transition-colors shadow"
              >
                <Printer className="w-4 h-4" />
                인쇄 / PDF 저장
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
