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
import {
  Mic, Square, Trash2, AlertCircle, ChevronDown, Stethoscope, Activity
} from 'lucide-react';

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

  const scrollRef = useRef<HTMLDivElement>(null);
  const summaryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSummarizedCountRef = useRef(0);

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

  const { isListening, status, errorMsg, supported, startListening, stopListening } = useSpeechRecognition(
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
    if (summaryTimerRef.current) clearTimeout(summaryTimerRef.current);
  };

  const selectedTranscript = selectedId ? transcripts.find(t => t.id === selectedId) ?? null : null;

  const selectedBlockForPanel = selectedTranscript ? {
    topic: selectedTranscript.aiTopic,
    displayText: selectedTranscript.displayText,
    originalText: selectedTranscript.originalText,
    sentiment: selectedTranscript.sentiment,
    medical_terms: selectedTranscript.medical_terms,
    keywords: selectedTranscript.aiKeywords,
  } : null;

  return (
    <>
      {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}

      <div className="min-h-screen bg-background flex flex-col font-sans overflow-hidden">
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
                Saptital <span className="text-primary">ai</span>
              </h1>
              <p className="text-[10px] font-medium text-muted-foreground leading-tight mt-0.5">
                청각장애인 병원 진료 맞춤 소통 서비스
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap justify-end">
            {/* Device selector */}
            <div className="relative flex items-center">
              <Mic className="absolute left-2.5 w-3.5 h-3.5 text-muted-foreground pointer-events-none z-10" />
              <select
                value={selectedDeviceId}
                onChange={e => setSelectedDeviceId(e.target.value)}
                disabled={isListening}
                className="appearance-none pl-7 pr-6 py-2 text-xs font-medium bg-secondary border border-border rounded-xl text-foreground cursor-pointer hover:bg-muted transition-colors disabled:opacity-50 max-w-[180px]"
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
              <span className="text-xs font-semibold text-muted-foreground">{status}</span>
            </div>

            {!supported ? (
              <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-xs font-semibold">
                <AlertCircle className="w-3.5 h-3.5" />
                Chrome 필요
              </div>
            ) : !isListening ? (
              <button
                onClick={startListening}
                className={`flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow hover:shadow-md hover:-translate-y-0.5 active:translate-y-0`}
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

          {/* Left: Transcript area */}
          <div className="flex-1 flex flex-col overflow-hidden border-r border-border/50">

            {/* Current live display — shows interim or latest big text */}
            <AnimatePresence>
              {(isListening || interimText || lastSpeaking) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="shrink-0 px-5 pt-4 pb-3"
                >
                  <div className={`rounded-2xl border-2 p-5 min-h-[90px] transition-colors duration-500 ${
                    interimText
                      ? 'border-primary/40 bg-primary/5'
                      : 'border-border bg-card'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className={`w-4 h-4 ${interimText ? 'text-primary animate-pulse' : 'text-muted-foreground/40'}`} />
                      <span className="text-xs font-semibold text-muted-foreground">
                        {interimText ? '실시간 음성 인식 중...' : '최근 발화'}
                      </span>
                    </div>
                    <p className={`text-2xl md:text-3xl font-bold tracking-tight leading-snug ${
                      interimText ? 'text-primary' : 'text-foreground/70'
                    }`}>
                      {interimText || lastSpeaking || '의사 선생님의 말씀이 여기에 표시됩니다'}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Scrollable transcript history */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 pb-5 space-y-3 scroll-smooth">
              {transcripts.length === 0 && !interimText ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground py-16 opacity-60">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-5">
                    <Stethoscope className="w-10 h-10 text-primary/40" />
                  </div>
                  <p className="text-base font-bold mb-1">아직 자막이 없습니다</p>
                  <p className="text-sm">'진료 시작' 버튼을 눌러 의사의 말씀을 자막으로 확인하세요</p>
                  <p className="text-xs mt-3 text-muted-foreground/60">Chrome 브라우저에서만 작동합니다</p>
                </div>
              ) : (
                transcripts.map(t => (
                  <TranscriptItem
                    key={t.id}
                    data={t}
                    isSelected={selectedId === t.id}
                    onClick={() => setSelectedId(prev => prev === t.id ? null : t.id)}
                  />
                ))
              )}

              {interimText && (
                <TranscriptItem
                  data={{
                    id: 'interim',
                    originalText: interimText,
                    score: 0,
                    tier: '일반',
                    keywordsFound: [],
                    segments: [{ text: interimText, isKeyword: false }],
                    timestamp: new Date(),
                  }}
                  isInterim
                />
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

        {/* Bottom quick reply bar */}
        <QuickReplyBar replies={suggestedReplies} />
      </div>
    </>
  );
}
