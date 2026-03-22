import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSpeechRecognition } from '@/hooks/use-speech';
import { useAudioDevices } from '@/hooks/use-audio-devices';
import { processTranscript, ProcessedTranscript } from '@/lib/caption-engine';
import { analyzeText, summarizeTexts } from '@/lib/ai-service';
import { TranscriptItem } from '@/components/TranscriptItem';
import { SummaryPanel } from '@/components/SummaryPanel';
import { Mic, Square, Trash2, AlertCircle, Bug, ChevronDown } from 'lucide-react';

export default function Home() {
  const [transcripts, setTranscripts] = useState<ProcessedTranscript[]>([]);
  const [interimText, setInterimText] = useState<string>('');
  const [globalSummary, setGlobalSummary] = useState({ text: "요약이 없습니다. 마이크를 시작하면 AI가 자동으로 요약해드립니다.", keywords: [] as string[] });
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const debugScrollRef = useRef<HTMLDivElement>(null);
  const summaryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSummarizedCountRef = useRef(0);

  const addDebugLog = useCallback((msg: string) => {
    const time = new Date().toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setDebugLogs(prev => [...prev.slice(-50), `${time} ${msg}`]);
  }, []);

  const { devices, selectedDeviceId, setSelectedDeviceId } = useAudioDevices();

  // Run Gemini analysis on a single transcript and update it in state
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
            aiTopic: result.isSmallTalk ? '잡담' : result.topic,
            aiTier: result.tier,
            aiLoading: false,
            displayText: result.simpleSummary !== text ? result.simpleSummary : undefined,
            aiKeywords: result.keywords,
            isSmallTalk: result.isSmallTalk,
            topicChanged: result.topicChanged,
          }
        : t
    ));
  }, []);

  // Debounced global AI summarization — uses AI-refined text when available
  const scheduleSummary = useCallback((allTranscripts: ProcessedTranscript[]) => {
    if (summaryTimerRef.current) clearTimeout(summaryTimerRef.current);
    if (allTranscripts.length < 2) return;

    summaryTimerRef.current = setTimeout(async () => {
      if (allTranscripts.length === lastSummarizedCountRef.current) return;
      lastSummarizedCountRef.current = allTranscripts.length;
      setSummaryLoading(true);
      // Use AI-refined displayText if available, otherwise fall back to originalText
      const texts = allTranscripts.slice(-8).map(t => t.displayText ?? t.originalText);
      const result = await summarizeTexts(texts);
      setSummaryLoading(false);
      if (result) {
        setGlobalSummary({ text: result.summary, keywords: result.keywords });
      }
    }, 3000);
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
    addDebugLog,
    selectedDeviceId
  );

  // Auto-scroll transcript area (only when no block is selected)
  useEffect(() => {
    if (!selectedId && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcripts, interimText, selectedId]);

  // Auto-scroll debug panel
  useEffect(() => {
    if (debugScrollRef.current) {
      debugScrollRef.current.scrollTop = debugScrollRef.current.scrollHeight;
    }
  }, [debugLogs]);

  const handleClear = () => {
    setTranscripts([]);
    setInterimText('');
    setGlobalSummary({ text: "자막이 초기화되었습니다.", keywords: [] });
    setSelectedId(null);
    lastSummarizedCountRef.current = 0;
    if (summaryTimerRef.current) clearTimeout(summaryTimerRef.current);
  };

  // Derive what the summary panel shows based on selection
  const selectedTranscript = selectedId ? transcripts.find(t => t.id === selectedId) : null;

  const panelSummaryText = selectedTranscript
    ? (selectedTranscript.displayText ?? selectedTranscript.originalText)
    : globalSummary.text;

  const panelKeywords = selectedTranscript
    ? (selectedTranscript.aiKeywords ?? [])
    : globalSummary.keywords;

  const panelIsLoading = selectedTranscript
    ? (selectedTranscript.aiLoading ?? false)
    : summaryLoading;

  const panelTopic = selectedTranscript
    ? selectedTranscript.aiTopic
    : undefined;

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-primary text-primary-foreground p-2 rounded-xl shadow-inner">
            <Mic className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-foreground">CaptionAI</h1>
            <p className="text-xs font-medium text-muted-foreground">청각장애인을 위한 실시간 자막 서비스</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Device selector */}
          <div className="relative flex items-center">
            <Mic className="absolute left-2.5 w-3.5 h-3.5 text-muted-foreground pointer-events-none z-10" />
            <select
              value={selectedDeviceId}
              onChange={e => setSelectedDeviceId(e.target.value)}
              disabled={isListening}
              className="appearance-none pl-7 pr-6 py-2 text-xs font-medium bg-secondary border border-border rounded-lg text-foreground cursor-pointer hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed max-w-[180px]"
              title="음성 입력 장치 선택"
            >
              {devices.length === 0
                ? <option value="default">기본 마이크</option>
                : devices.map(d => (
                    <option key={d.deviceId} value={d.deviceId}>{d.label}</option>
                  ))
              }
            </select>
            <ChevronDown className="absolute right-1.5 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          </div>

          {/* Status indicator */}
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              {isListening && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>}
              <span className={`relative inline-flex rounded-full h-3 w-3 ${isListening ? 'bg-red-500' : 'bg-gray-300'}`}></span>
            </span>
            <span className="text-sm font-semibold text-muted-foreground">{status}</span>
          </div>

          {!supported ? (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-xl text-sm font-semibold">
              <AlertCircle className="w-4 h-4" />
              Chrome 필요
            </div>
          ) : !isListening ? (
            <button
              onClick={startListening}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-xl font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
            >
              <Mic className="w-4 h-4" />
              마이크 시작
            </button>
          ) : (
            <button
              onClick={stopListening}
              className="flex items-center gap-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground px-5 py-2.5 rounded-xl font-bold transition-all shadow-md animate-pulse"
            >
              <Square className="w-4 h-4" />
              녹음 중지
            </button>
          )}

          <button onClick={handleClear} className="p-2.5 bg-secondary hover:bg-muted text-secondary-foreground rounded-xl transition-colors" title="자막 지우기">
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowDebug(v => !v)}
            className={`p-2.5 rounded-xl transition-colors ${showDebug ? 'bg-amber-100 text-amber-700' : 'bg-secondary text-secondary-foreground hover:bg-muted'}`}
            title="디버그 패널"
          >
            <Bug className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Error banner */}
      {errorMsg && (
        <div className="mx-4 mt-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{errorMsg}</p>
        </div>
      )}

      {/* Debug Panel */}
      {showDebug && (
        <div className="mx-4 mt-3 p-3 bg-gray-900 text-green-400 rounded-xl font-mono text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-green-300 font-bold">🔍 음성인식 이벤트 로그</span>
            <button onClick={() => setDebugLogs([])} className="text-gray-500 hover:text-gray-300 text-xs">지우기</button>
          </div>
          <div ref={debugScrollRef} className="h-32 overflow-y-auto space-y-0.5">
            {debugLogs.length === 0 ? (
              <div className="text-gray-500">마이크 시작 버튼을 누르면 이벤트가 표시됩니다.</div>
            ) : (
              debugLogs.map((log, i) => <div key={i} className="leading-5">{log}</div>)
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col md:flex-row max-w-7xl w-full mx-auto">

        {/* Transcript List */}
        <div className="flex-1 relative flex flex-col h-[60vh] md:h-auto border-r border-border/50">
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 scroll-smooth"
          >
            {transcripts.length === 0 && !interimText ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-8 opacity-60">
                <Mic className="w-16 h-16 mb-4 text-border" />
                <p className="text-lg font-bold">자막이 없습니다</p>
                <p className="text-sm mt-2">상단의 '마이크 시작' 버튼을 누르세요.</p>
              </div>
            ) : (
              transcripts.map((t) => (
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
                  timestamp: new Date()
                }}
                isInterim={true}
              />
            )}
          </div>
        </div>

        {/* Summary Sidebar */}
        <div className="w-full md:w-[350px] lg:w-[400px] p-4 md:p-6 bg-background shrink-0">
          <SummaryPanel
            summaryText={panelSummaryText}
            keywords={panelKeywords}
            isLoading={panelIsLoading}
            isBlockSelected={selectedTranscript !== null && selectedTranscript !== undefined}
            selectedTopic={panelTopic}
            onClearSelection={() => setSelectedId(null)}
          />
        </div>
      </main>
    </div>
  );
}
