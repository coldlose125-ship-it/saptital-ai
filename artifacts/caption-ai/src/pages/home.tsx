import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpeechRecognition } from '@/hooks/use-speech';
import { useAudioDevices } from '@/hooks/use-audio-devices';
import { processTranscript, ProcessedTranscript } from '@/lib/caption-engine';
import { analyzeText, summarizeTexts, MedicalTerm } from '@/lib/ai-service';
import { TranscriptItem } from '@/components/TranscriptItem';
import { SplashScreen } from '@/components/SplashScreen';
import { AlertBar } from '@/components/AlertBar';
import { MedicalTermsPanel } from '@/components/MedicalTermsPanel';
import { QuickReplyBar } from '@/components/QuickReplyBar';
import { ExportModal } from '@/components/ExportModal';
import {
  Mic, Square, Trash2, AlertCircle, ChevronDown, Stethoscope, Activity, FileText
} from 'lucide-react';

const FONT_SIZES = ['text-3xl md:text-4xl', 'text-4xl md:text-5xl', 'text-5xl md:text-6xl'] as const;
const FONT_LABELS = ['표준', '크게', '매우\n크게'] as const;

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);
  const [transcripts, setTranscripts] = useState<ProcessedTranscript[]>([]);
  const [interimText, setInterimText] = useState<string>('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [globalTerms, setGlobalTerms] = useState<MedicalTerm[]>([]);
  const [globalKeywords, setGlobalKeywords] = useState<string[]>([]);
  const [suggestedReplies, setSuggestedReplies] = useState<string[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [lastSpeaking, setLastSpeaking] = useState<string>('');
  const [fontSizeLevel, setFontSizeLevel] = useState<0 | 1 | 2>(0);
  const [showExport, setShowExport] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const summaryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSummarizedCountRef = useRef(0);
  const sessionStartRef = useRef<Date>(new Date());

  const { devices, selectedDeviceId, setSelectedDeviceId } = useAudioDevices();

  const runAIAnalysis = useCallback(async (id: string, text: string, contextTexts: string[]) => {
    const result = await analyzeText(text, contextTexts);
    if (!result) {
      setTranscripts(prev => prev.map(t => t.id === id ? { ...t, aiLoading: false } : t));
      return;
    }

    setTranscripts(prev => prev.map(t =>
      t.id === id
        ? {
            ...t,
            aiTopic: result.topic,
            aiTier: result.tier,
            aiLoading: false,
            displayText: result.simpleSummary !== text ? result.simpleSummary : t.originalText,
            aiKeywords: result.keywords,
            topicChanged: result.topicChanged,
            medical_terms: result.medical_terms,
            sentiment: result.sentiment,
            suggested_replies: result.suggested_replies,
          }
        : t
    ));

    // Update global panel with latest AI data
    if (result.medical_terms.length > 0) {
      setGlobalTerms(prev => {
        const merged = [...result.medical_terms, ...prev];
        const seen = new Set<string>();
        return merged.filter(t => { if (seen.has(t.term)) return false; seen.add(t.term); return true; }).slice(0, 12);
      });
    }
    if (result.keywords.length > 0) {
      setGlobalKeywords(prev => {
        const merged = [...result.keywords, ...prev];
        return [...new Set(merged)].slice(0, 8);
      });
    }
    setSuggestedReplies(result.suggested_replies);
    setLastSpeaking(result.simpleSummary || text);
  }, []);

  const scheduleSummary = useCallback((allTranscripts: ProcessedTranscript[]) => {
    if (summaryTimerRef.current) clearTimeout(summaryTimerRef.current);
    if (allTranscripts.length < 2) return;

    summaryTimerRef.current = setTimeout(async () => {
      if (allTranscripts.length === lastSummarizedCountRef.current) return;
      lastSummarizedCountRef.current = allTranscripts.length;
      setSummaryLoading(true);
      const texts = allTranscripts.slice(-8).map(t => t.displayText ?? t.originalText);
      await summarizeTexts(texts);
      setSummaryLoading(false);
    }, 4000);
  }, []);

  const { isListening, status, errorMsg, startListening, stopListening } = useSpeechRecognition(
    (text, isFinal) => {
      if (isFinal) {
        const processed: ProcessedTranscript = { ...processTranscript(text), aiLoading: true };
        setTranscripts(prev => {
          const next = [...prev, processed];
          scheduleSummary(next);
          const contextTexts = prev.slice(-4).map(t => t.displayText ?? t.originalText);
          runAIAnalysis(processed.id, text, contextTexts);
          return next;
        });
        setInterimText('');
      } else {
        setInterimText(text);
      }
    },
    () => {},
    selectedDeviceId
  );

  // Auto-scroll only when not selected
  useEffect(() => {
    if (!selectedId && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcripts, interimText, selectedId]);

  const handleClear = () => {
    setTranscripts([]);
    setInterimText('');
    setSelectedId(null);
    setGlobalTerms([]);
    setGlobalKeywords([]);
    setSuggestedReplies([]);
    setLastSpeaking('');
    lastSummarizedCountRef.current = 0;
    sessionStartRef.current = new Date();
    if (summaryTimerRef.current) clearTimeout(summaryTimerRef.current);
  };

  const selectedTranscript = selectedId ? transcripts.find(t => t.id === selectedId) ?? null : null;

  const selectedBlockForPanel = selectedTranscript ? {
    topic: selectedTranscript.aiTopic,
    displayText: selectedTranscript.displayText,
    originalText: selectedTranscript.originalText,
    medical_terms: selectedTranscript.medical_terms,
    keywords: selectedTranscript.aiKeywords,
  } : null;

  return (
    <>
      {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}

      <div className="h-screen bg-background flex flex-col font-sans overflow-hidden">
        {/* Alert bar at top */}
        <AlertBar />

        {/* Header */}
        <header className="bg-white border-b border-border px-5 py-3 flex items-center justify-between sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-3">
            {/* Logo */}
            <div className="bg-primary p-2 rounded-xl shadow-inner">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-foreground leading-none">
                Sapital <span className="text-primary">AI</span>
              </h1>
              <p className="text-[10px] font-medium text-muted-foreground leading-tight mt-0.5">
                청각장애인 병원 진료 맞춤 소통 서비스
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* Device selector */}
            <div className="relative flex items-center">
              <Mic className="absolute left-2.5 w-3.5 h-3.5 text-muted-foreground pointer-events-none z-10" />
              <select
                value={selectedDeviceId}
                onChange={e => setSelectedDeviceId(e.target.value)}
                disabled={isListening}
                className="appearance-none pl-7 pr-6 py-2 text-xs font-medium bg-secondary border border-border rounded-xl text-foreground cursor-pointer hover:bg-muted transition-colors disabled:opacity-50 max-w-[160px]"
              >
                {devices.length === 0
                  ? <option value="default">기본 마이크</option>
                  : devices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label}</option>)
                }
              </select>
              <ChevronDown className="absolute right-1.5 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            </div>

            {/* Recording status */}
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2.5 w-2.5">
                {isListening && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />}
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isListening ? 'bg-red-500' : 'bg-gray-300'}`} />
              </span>
              <span className="text-xs font-semibold text-muted-foreground hidden sm:inline">{status}</span>
            </div>

            {/* ── 글자 크기 조절 ── */}
            <div className="flex items-center gap-0.5 bg-secondary border border-border rounded-xl p-0.5" title="자막 글자 크기">
              {([0, 1, 2] as const).map(level => (
                <button
                  key={level}
                  onClick={() => setFontSizeLevel(level)}
                  className={`px-2 py-1.5 rounded-lg text-xs font-extrabold transition-all leading-none ${
                    fontSizeLevel === level
                      ? 'bg-primary text-white shadow'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                  style={{ fontSize: `${10 + level * 2}px` }}
                >
                  가
                </button>
              ))}
            </div>

            {/* ── 진료 기록 내보내기 ── */}
            {transcripts.length > 0 && (
              <button
                onClick={() => setShowExport(true)}
                className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-2 rounded-xl font-bold text-xs transition-colors"
                title="오늘의 진료 기록 저장"
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">기록 저장</span>
              </button>
            )}

            {!isListening ? (
              <button
                onClick={startListening}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
              >
                <Mic className="w-4 h-4" />
                진료 시작
              </button>
            ) : (
              <button
                onClick={stopListening}
                className="flex items-center gap-2 bg-destructive hover:bg-destructive/90 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow animate-mic-ring"
              >
                <Square className="w-4 h-4" />
                중지
              </button>
            )}

            <button onClick={handleClear} className="p-2.5 bg-secondary hover:bg-muted text-secondary-foreground rounded-xl transition-colors" title="자막 지우기">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Error banner */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mx-4 mt-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{errorMsg}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main — flex-1, row layout */}
        <main className="flex-1 flex flex-col md:flex-row overflow-hidden" style={{ minHeight: 0 }}>

          {/* Left: Transcript history (scrollable) */}
          <div className="flex-1 flex flex-col overflow-hidden border-r border-border/50">
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3 scroll-smooth">
              {transcripts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground py-16 opacity-60">
                  <div className={`rounded-full bg-primary/10 flex items-center justify-center mb-5 transition-all duration-300 ${
                    fontSizeLevel === 0 ? 'w-20 h-20' : fontSizeLevel === 1 ? 'w-28 h-28' : 'w-36 h-36'
                  }`}>
                    <Stethoscope className={`text-primary/40 transition-all duration-300 ${
                      fontSizeLevel === 0 ? 'w-10 h-10' : fontSizeLevel === 1 ? 'w-14 h-14' : 'w-20 h-20'
                    }`} />
                  </div>
                  <p className={`font-bold mb-2 transition-all duration-300 ${
                    fontSizeLevel === 0 ? 'text-base' : fontSizeLevel === 1 ? 'text-xl' : 'text-2xl'
                  }`}>아직 자막이 없습니다</p>
                  <p className={`transition-all duration-300 ${
                    fontSizeLevel === 0 ? 'text-sm' : fontSizeLevel === 1 ? 'text-base' : 'text-lg'
                  }`}>'진료 시작' 버튼을 눌러 의사의 말씀을 자막으로 확인하세요</p>
                </div>
              ) : (
                transcripts.map(t => (
                  <TranscriptItem
                    key={t.id}
                    data={t}
                    isSelected={selectedId === t.id}
                    onClick={() => setSelectedId(prev => prev === t.id ? null : t.id)}
                    fontSizeLevel={fontSizeLevel}
                  />
                ))
              )}

              {summaryLoading && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground py-1 px-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.15s]" />
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.3s]" />
                  <span className="ml-1">AI 분석 중...</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Medical Terms Sidebar */}
          <div className="w-full md:w-[320px] lg:w-[360px] shrink-0 p-4 overflow-y-auto bg-card border-t md:border-t-0 border-border/50">
            <MedicalTermsPanel
              selectedBlock={selectedBlockForPanel}
              globalTerms={globalTerms}
              globalKeywords={globalKeywords}
              onClearSelection={() => setSelectedId(null)}
            />
          </div>
        </main>

        {/* ── 현재 발화 박스 (하단 고정) ───────────────────────── */}
        <div className={`shrink-0 px-5 py-4 border-t-2 transition-colors duration-400 ${
          interimText
            ? 'border-primary bg-primary/5'
            : 'border-border bg-white'
        }`}>
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 mb-2">
              <Activity className={`w-4 h-4 ${interimText ? 'text-primary animate-pulse' : 'text-muted-foreground/30'}`} />
              <span className={`text-xs font-bold tracking-wide uppercase ${interimText ? 'text-primary' : 'text-muted-foreground/50'}`}>
                {interimText ? '실시간 음성 인식 중...' : '최근 발화'}
              </span>
              {interimText && (
                <span className="flex gap-0.5 ml-1">
                  <span className="w-1 h-1 rounded-full bg-primary animate-bounce" />
                  <span className="w-1 h-1 rounded-full bg-primary animate-bounce [animation-delay:0.15s]" />
                  <span className="w-1 h-1 rounded-full bg-primary animate-bounce [animation-delay:0.3s]" />
                </span>
              )}
            </div>
            <p className={`${FONT_SIZES[fontSizeLevel]} font-bold tracking-tight leading-snug min-h-[52px] transition-colors duration-300 ${
              interimText ? 'text-primary' : 'text-foreground/60'
            }`}>
              {interimText || lastSpeaking || (isListening ? '말씀하세요...' : '의사 선생님의 말씀이 여기에 표시됩니다')}
            </p>
          </div>
        </div>

        {/* 추천 답변 버튼 */}
        <QuickReplyBar replies={suggestedReplies} />
      </div>

      {/* 진료 기록 내보내기 모달 */}
      <ExportModal
        open={showExport}
        onClose={() => setShowExport(false)}
        transcripts={transcripts}
        globalTerms={globalTerms}
        globalKeywords={globalKeywords}
        sessionStart={sessionStartRef.current}
      />
    </>
  );
}
