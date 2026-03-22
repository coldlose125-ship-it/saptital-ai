import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSpeechRecognition } from '@/hooks/use-speech';
import { processTranscript, generateSummary, ProcessedTranscript } from '@/lib/caption-engine';
import { TranscriptItem } from '@/components/TranscriptItem';
import { SummaryPanel } from '@/components/SummaryPanel';
import { Mic, Square, Trash2, PlayCircle, AlertCircle, Bug } from 'lucide-react';

export default function Home() {
  const [transcripts, setTranscripts] = useState<ProcessedTranscript[]>([]);
  const [interimText, setInterimText] = useState<string>('');
  const [summary, setSummary] = useState({ text: "요약이 없습니다. 마이크를 시작하거나 예시를 눌러보세요.", keywords: [] as string[] });
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const debugScrollRef = useRef<HTMLDivElement>(null);
  const demoIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const addDebugLog = useCallback((msg: string) => {
    const time = new Date().toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setDebugLogs(prev => [...prev.slice(-50), `${time} ${msg}`]);
  }, []);

  const { isListening, status, errorMsg, supported, startListening, stopListening } = useSpeechRecognition(
    (text, isFinal) => {
      if (isFinal) {
        const processed = processTranscript(text);
        setTranscripts(prev => [...prev, processed]);
        setInterimText('');
      } else {
        setInterimText(text);
      }
    },
    addDebugLog
  );

  // Update summary when transcripts grow
  useEffect(() => {
    if (transcripts.length > 0) {
      setSummary(generateSummary(transcripts));
    }
  }, [transcripts]);

  // Auto-scroll transcript area
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcripts, interimText]);

  // Auto-scroll debug panel
  useEffect(() => {
    if (debugScrollRef.current) {
      debugScrollRef.current.scrollTop = debugScrollRef.current.scrollHeight;
    }
  }, [debugLogs]);

  const handleClear = () => {
    setTranscripts([]);
    setInterimText('');
    setSummary({ text: "자막이 초기화되었습니다.", keywords: [] });
    if (demoIntervalRef.current) clearInterval(demoIntervalRef.current);
  };

  const runDemoScenario = (scenario: number) => {
    if (isListening) stopListening();
    if (demoIntervalRef.current) clearInterval(demoIntervalRef.current);

    const scenarios: Record<number, string[]> = {
      1: [
        "안녕하세요. 내일 오전 10시에 중간고사가 있습니다.",
        "장소가 변경되었습니다. 반드시 강의실 201호로 오세요.",
        "시험 범위는 1단원부터 5단원까지입니다.",
        "지각하면 입장이 절대 불가합니다.",
        "마감은 내일 10시 정각입니다."
      ],
      2: [
        "오늘 오후 3시에 긴급 팀 회의가 있습니다.",
        "회의 장소는 3층 대회의실로 변경되었습니다.",
        "중요한 프로젝트 마감 일정을 논의할 예정입니다.",
        "모든 팀원은 반드시 참석해주세요.",
        "지진 대피 훈련도 안내할 예정입니다."
      ],
      3: [
        "기말고사 일정을 안내합니다.",
        "시험은 12월 20일 오전 9시에 시작합니다.",
        "시험 장소는 대강당입니다.",
        "신분증을 반드시 지참하세요.",
        "주의사항을 꼭 확인하세요."
      ],
    };

    const texts = scenarios[scenario] ?? [];
    let i = 0;
    demoIntervalRef.current = setInterval(() => {
      if (i < texts.length) {
        setTranscripts(prev => [...prev, processTranscript(texts[i])]);
        i++;
      } else {
        if (demoIntervalRef.current) clearInterval(demoIntervalRef.current);
      }
    }, 2000);
  };

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
                <p className="text-sm mt-2">상단의 '마이크 시작' 버튼을 누르거나<br />하단의 시연용 예시를 클릭하세요.</p>
              </div>
            ) : (
              transcripts.map((t) => <TranscriptItem key={t.id} data={t} />)
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
          <SummaryPanel summaryText={summary.text} keywords={summary.keywords} />
        </div>
      </main>

      {/* Footer: Demo Buttons */}
      <footer className="bg-card border-t border-border p-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-4">
          <span className="text-sm font-bold text-muted-foreground flex items-center gap-1.5">
            <PlayCircle className="w-4 h-4" />
            시연용 예시 버튼:
          </span>
          <div className="flex flex-wrap justify-center gap-2">
            <button onClick={() => runDemoScenario(1)} className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-sm font-semibold transition-colors">
              수업 공지
            </button>
            <button onClick={() => runDemoScenario(2)} className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-sm font-semibold transition-colors">
              회의 안내
            </button>
            <button onClick={() => runDemoScenario(3)} className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-sm font-semibold transition-colors">
              시험 일정
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
