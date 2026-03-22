import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Copy, Printer, FileText, Check, FlaskConical, Hash, CheckCircle2, Download
} from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ProcessedTranscript } from '@/lib/caption-engine';

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  transcripts: ProcessedTranscript[];
  globalTerms: { term: string; explanation: string }[];
  globalKeywords: string[];
  sessionStart: Date;
}

/* ────────────────────────────────────────────────────────────
   PRINT DOCUMENT — A4, @media print, 브랜드 헤더 포함
──────────────────────────────────────────────────────────── */
function buildPrintHtml(
  transcripts: ProcessedTranscript[],
  globalTerms: { term: string; explanation: string }[],
  sessionStart: Date,
  mode: 'save' | 'print' = 'print'
): string {
  const dateStr = format(sessionStart, 'yyyy년 MM월 dd일 (EEEE)', { locale: ko });
  const startTime = format(sessionStart, 'HH:mm');
  const endTime = format(new Date(), 'HH:mm');

  const transcriptRows = transcripts.map((t, i) => {
    const text = t.displayText ?? t.originalText;
    const timeStr = format(t.timestamp, 'HH:mm:ss');
    const topicTag = t.aiTopic
      ? `<span class="tag topic">${t.aiTopic}</span>`
      : '';
    const tierTag = t.aiTier && t.aiTier !== '일반'
      ? `<span class="tag tier">${t.aiTier}</span>`
      : '';
    const isDiff = t.displayText && t.displayText !== t.originalText;
    return `
      <tr>
        <td class="idx">${i + 1}</td>
        <td class="time">${timeStr}</td>
        <td class="content">
          ${text}
          ${topicTag}${tierTag}
          ${isDiff ? `<br/><span class="original">원본: ${t.originalText}</span>` : ''}
        </td>
      </tr>`;
  }).join('');

  const termRows = globalTerms.map(({ term, explanation }) => `
    <tr>
      <td class="term-name">${term}</td>
      <td class="term-desc">${explanation}</td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Sapital AI 진료 요약 리포트 — ${dateStr}</title>
  <style>
    /* ── 공통 ── */
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif;
      color: #1e293b;
      background: #f1f5f9;
      font-size: 14px;
      line-height: 1.7;
    }

    /* ── 화면 미리보기 래퍼 ── */
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
    .save-guide {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      background: #ecfdf5;
      border: 1px solid #6ee7b7;
      border-radius: 10px;
      padding: 14px 18px;
      font-size: 13px;
      color: #065f46;
      line-height: 1.6;
      max-width: 600px;
    }
    .save-guide strong { font-weight: 800; display: block; margin-bottom: 2px; }

    /* ── 리포트 내부 ── */
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

    /* 메타 그리드 */
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
    .meta-cell p { font-size: 15px; font-weight: 800; color: #0f172a; margin-top: 3px; }

    /* 섹션 헤더 */
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

    /* 자막 테이블 */
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

    /* 의학 용어 테이블 */
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

    /* 면책 */
    .disclaimer {
      margin-top: 28px;
      padding-top: 14px;
      border-top: 1px solid #e2e8f0;
      font-size: 10px;
      color: #94a3b8;
      line-height: 1.8;
      text-align: center;
    }

    /* ────────────────────────────────────────────────────────
       @media print  — 화면 요소 숨기고 A4 리포트만 출력
    ──────────────────────────────────────────────────────── */
    @media print {
      @page {
        size: A4;
        margin: 18mm 20mm;
      }
      body {
        background: #fff !important;
        font-size: 12px;
      }
      /* 화면 전용 요소 숨기기 */
      .no-print { display: none !important; }
      /* 인쇄 래퍼 제거 — 페이지를 직접 출력 */
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
      /* 테이블이 페이지 경계에서 잘리지 않도록 */
      table { page-break-inside: auto; }
      tr     { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="page-wrap">
    <!-- 화면에서만 보이는 액션 영역 -->
    <div class="no-print" style="display:flex;flex-direction:column;align-items:center;gap:16px;margin-top:24px;">
      ${mode === 'save' ? `
        <div class="save-guide">
          <span style="font-size:22px;line-height:1">💾</span>
          <div>
            <strong>PDF로 저장하는 방법</strong>
            아래 버튼을 클릭한 후 열리는 대화상자에서<br/>
            <b>'대상(목적지)'</b>을 <b>'PDF로 저장'</b>으로 선택하면 PDF 파일로 저장됩니다.
          </div>
        </div>
        <div class="print-actions">
          <button class="btn btn-save" onclick="window.print()">💾 PDF로 저장</button>
          <button class="btn btn-close" onclick="window.close()">닫기</button>
        </div>
      ` : `
        <div class="print-actions">
          <button class="btn btn-print" onclick="window.print()">🖨️ 다시 인쇄</button>
          <button class="btn btn-close" onclick="window.close()">닫기</button>
        </div>
      `}
    </div>

    ${mode === 'print' ? `<script>window.addEventListener('load', function(){ setTimeout(function(){ window.print(); }, 400); });<\/script>` : ''}

    <!-- A4 리포트 영역 (인쇄 시 이것만 출력됨) -->
    <div class="a4-page">

      <!-- 헤더: 로고 + 날짜 -->
      <div class="report-header">
        <div class="brand">
          <div class="brand-icon">
            <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
            </svg>
          </div>
          <div>
            <div class="brand-title">Sapital <span>AI</span></div>
            <div class="brand-sub">청각장애인 병원 진료 맞춤 소통 서비스</div>
          </div>
        </div>
        <div class="report-label">
          <strong>진료 요약 리포트</strong>
          ${dateStr}<br/>
          진료 시간: ${startTime} ~ ${endTime}
        </div>
      </div>

      <!-- 메타 -->
      <div class="meta-grid">
        <div class="meta-cell"><label>진료 날짜</label><p>${dateStr}</p></div>
        <div class="meta-cell"><label>진료 시간</label><p>${startTime} ~ ${endTime}</p></div>
        <div class="meta-cell"><label>자막 기록</label><p>${transcripts.length}건</p></div>
      </div>

      <!-- 자막 기록 -->
      <h2>의사 발화 자막 기록</h2>
      ${transcripts.length === 0
        ? '<p style="color:#94a3b8;font-size:13px;">기록된 자막이 없습니다.</p>'
        : `<table class="transcript">
            <thead>
              <tr>
                <th style="width:28px">#</th>
                <th style="width:70px">시각</th>
                <th>발화 내용</th>
              </tr>
            </thead>
            <tbody>${transcriptRows}</tbody>
          </table>`}

      <!-- 의학 용어 사전 -->
      ${globalTerms.length > 0 ? `
        <h2>의학 용어 풀이</h2>
        <table class="terms">
          <thead>
            <tr>
              <th>용어</th>
              <th>쉬운 설명</th>
            </tr>
          </thead>
          <tbody>${termRows}</tbody>
        </table>
      ` : ''}

      <!-- 면책 -->
      <div class="disclaimer">
        ※ 본 리포트는 Sapital AI가 음성 인식 및 AI 분석을 통해 자동 생성한 참고용 자료입니다.<br/>
        의료적 판단 및 처방은 반드시 담당 의사 선생님과 직접 상담하시기 바랍니다.
      </div>
    </div><!-- /a4-page -->
  </div><!-- /page-wrap -->
</body>
</html>`;
}

/* ────────────────────────────────────────────────────────────
   COPY TEXT — 메시지 공유용 이모지 포맷
──────────────────────────────────────────────────────────── */
function buildCopyText(
  transcripts: ProcessedTranscript[],
  globalTerms: { term: string; explanation: string }[],
  sessionStart: Date
): string {
  const dateStr = format(sessionStart, 'yyyy-MM-dd', { locale: ko });
  const timeStr = format(sessionStart, 'HH:mm', { locale: ko });

  // 최근 주요 발화 (최대 5건)
  const recent = transcripts.slice(-5);
  const mainContent = recent.length > 0
    ? recent.map(t => `  · ${t.displayText ?? t.originalText}`).join('\n')
    : '  기록된 내용이 없습니다.';

  // 의학 용어
  const termsContent = globalTerms.length > 0
    ? globalTerms.slice(0, 5).map(({ term, explanation }) => `  · ${term}: ${explanation}`).join('\n')
    : '  없음';

  return `[Sapital AI 진료 요약]

📅 진료 일시: ${dateStr} ${timeStr}

🩺 주요 내용:
${mainContent}

💡 알아둘 용어:
${termsContent}

─────────────────────
※ Sapital AI — 청각장애인 병원 진료 맞춤 소통 서비스가 자동 생성한 요약입니다.`;
}

/* ────────────────────────────────────────────────────────────
   TOAST — 복사 완료 알림
──────────────────────────────────────────────────────────── */
function Toast({ visible }: { visible: boolean }) {
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
            <p className="font-bold text-sm">클립보드에 복사되었습니다</p>
            <p className="text-xs text-white/60">메시지, 문자 등에 바로 붙여넣기 하세요</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ────────────────────────────────────────────────────────────
   MAIN EXPORT MODAL
──────────────────────────────────────────────────────────── */
export function ExportModal({
  open, onClose, transcripts, globalTerms, globalKeywords, sessionStart
}: ExportModalProps) {
  const [toast, setToast] = useState(false);

  const dateStr = format(sessionStart, 'yyyy년 MM월 dd일 (EEEE)', { locale: ko });
  const startTime = format(sessionStart, 'HH:mm');
  const endTime = format(new Date(), 'HH:mm');

  /* 복사 */
  const handleCopy = async () => {
    const text = buildCopyText(transcripts, globalTerms, sessionStart);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // 일부 환경 fallback
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setToast(true);
    setTimeout(() => setToast(false), 3000);
  };

  /* 인쇄 창 열기 공통 함수 */
  const openWindow = (mode: 'save' | 'print') => {
    const html = buildPrintHtml(transcripts, globalTerms, sessionStart, mode);
    const win = window.open('', '_blank', 'width=900,height=1100,scrollbars=yes');
    if (!win) {
      alert('팝업이 차단되었습니다. 팝업을 허용한 뒤 다시 시도해 주세요.');
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
  };

  const handleSave  = () => openWindow('save');
  const handlePrint = () => openWindow('print');

  return (
    <>
      <Toast visible={toast} />

      <AnimatePresence>
        {open && (
          <>
            {/* 배경 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            />

            {/* 모달 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[620px] max-h-[86vh] z-50 flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* 모달 헤더 */}
              <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-gradient-to-r from-primary/5 to-transparent shrink-0">
                <div className="bg-primary/10 p-2 rounded-xl">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-extrabold text-foreground text-base">오늘의 진료 기록</h2>
                  <p className="text-xs text-muted-foreground">{dateStr} · {startTime} ~ {endTime}</p>
                </div>
                <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 통계 바 */}
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

              {/* 내용 미리보기 (스크롤) */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

                {/* 자막 기록 */}
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
                              <span className="text-xs font-bold text-muted-foreground/50">{i + 1}</span>
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
                              <p className="text-xs text-muted-foreground/50 italic mt-1 pt-1 border-t border-border/50">원본: {t.originalText}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                {/* 의학 용어 */}
                {globalTerms.length > 0 && (
                  <section>
                    <h3 className="flex items-center gap-2 text-xs font-extrabold text-muted-foreground uppercase tracking-widest mb-3">
                      <FlaskConical className="w-3.5 h-3.5" />
                      의학 용어 풀이
                    </h3>
                    <div className="rounded-xl border border-border overflow-hidden">
                      {globalTerms.map(({ term, explanation }, i) => (
                        <div
                          key={term}
                          className={`flex items-start gap-4 px-4 py-3 ${i !== globalTerms.length - 1 ? 'border-b border-border' : ''}`}
                        >
                          <span className="text-sm font-extrabold text-primary shrink-0 w-24">{term}</span>
                          <span className="text-xs text-muted-foreground leading-relaxed">{explanation}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* 키워드 */}
                {globalKeywords.length > 0 && (
                  <section>
                    <h3 className="flex items-center gap-2 text-xs font-extrabold text-muted-foreground uppercase tracking-widest mb-3">
                      <Hash className="w-3.5 h-3.5" />
                      핵심 키워드
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

                {/* 복사 미리보기 */}
                <section>
                  <h3 className="flex items-center gap-2 text-xs font-extrabold text-muted-foreground uppercase tracking-widest mb-3">
                    <Copy className="w-3.5 h-3.5" />
                    메시지 공유 미리보기
                  </h3>
                  <pre className="bg-muted/60 border border-border rounded-xl px-4 py-3 text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap font-sans">
                    {buildCopyText(transcripts, globalTerms, sessionStart)}
                  </pre>
                </section>

                <p className="text-xs text-muted-foreground/60 leading-relaxed">
                  ※ 본 기록은 Sapital AI가 자동 생성한 참고용 자료입니다. 의료적 판단은 반드시 담당 의사 선생님과 상담하세요.
                </p>
              </div>

              {/* 액션 버튼 */}
              <div className="flex flex-col gap-2 px-6 py-4 border-t border-border bg-background shrink-0">
                {/* 복사 */}
                <button
                  onClick={handleCopy}
                  className="w-full flex items-center justify-center gap-2 bg-secondary hover:bg-muted text-foreground font-bold text-sm py-3 rounded-xl transition-colors border border-border"
                >
                  <Copy className="w-4 h-4" />
                  텍스트 복사
                  <span className="text-[10px] font-normal text-muted-foreground">(메시지 공유)</span>
                </button>

                {/* 저장 / 인쇄 나란히 */}
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-3.5 rounded-xl transition-colors shadow-md"
                  >
                    <Download className="w-4 h-4" />
                    PDF 저장
                  </button>
                  <button
                    onClick={handlePrint}
                    className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold text-sm py-3.5 rounded-xl transition-colors shadow-md"
                  >
                    <Printer className="w-4 h-4" />
                    인쇄
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
