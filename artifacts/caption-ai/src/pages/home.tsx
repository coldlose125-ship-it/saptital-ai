import React, { useState, useEffect, useRef } from 'react';
import { useSpeechRecognition } from '@/hooks/use-speech';
import { processTranscript, generateSummary, ProcessedTranscript } from '@/lib/caption-engine';
import { TranscriptItem } from '@/components/TranscriptItem';
import { SummaryPanel } from '@/components/SummaryPanel';
import { Mic, Square, Trash2, PlayCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  const [transcripts, setTranscripts] = useState<ProcessedTranscript[]>([]);
  const [interimText, setInterimText] = useState<string>('');
  const [summary, setSummary] = useState({ text: "요약이 없습니다. 마이크를 시작하거나 예시를 눌러보세요.", keywords: [] as string[] });
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const demoIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Speech Recognition
  const { isListening, status, errorMsg, startListening, stopListening } = useSpeechRecognition((text, isFinal) => {
    if (isFinal) {
      const processed = processTranscript(text);
      setTranscripts(prev => [...prev, processed]);
      setInterimText('');
    } else {
      setInterimText(text);
    }
  });

  // Update summary when new transcripts arrive (batching every 3)
  useEffect(() => {
    if (transcripts.length > 0 && transcripts.length % 3 === 0) {
      setSummary(generateSummary(transcripts));
    } else if (transcripts.length > 0 && summary.keywords.length === 0) {
      // Generate initial summary faster
      setSummary(generateSummary(transcripts));
    }
  }, [transcripts]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcripts, interimText]);

  const handleClear = () => {
    setTranscripts([]);
    setInterimText('');
    setSummary({ text: "자막이 초기화되었습니다.", keywords: [] });
    if (demoIntervalRef.current) clearInterval(demoIntervalRef.current);
  };

  // Demo Scenario Injector
  const runDemoScenario = (scenario: number) => {
    if (isListening) stopListening();
    if (demoIntervalRef.current) clearInterval(demoIntervalRef.current);
    
    let texts: string[] = [];
    if (scenario === 1) {
      texts = [
        "안녕하세요. 내일 오전 10시에 중간고사가 있습니다.",
        "장소가 변경되었습니다. 반드시 강의실 201호로 오세요.",
        "시험 범위는 1단원부터 5단원까지입니다.",
        "지각하면 입장이 절대 불가합니다.",
        "마감은 내일 10시 정각입니다."
      ];
    } else if (scenario === 2) {
      texts = [
        "오늘 오후 3시에 긴급 팀 회의가 있습니다.",
        "회의 장소는 3층 대회의실로 변경되었습니다.",
        "중요한 프로젝트 마감 일정을 논의할 예정입니다.",
        "모든 팀원은 반드시 참석해주세요.",
        "지진 대피 훈련도 안내할 예정입니다."
      ];
    } else if (scenario === 3) {
      texts = [
        "기말고사 일정을 안내합니다.",
        "시험은 12월 20일 오전 9시에 시작합니다.",
        "시험 장소는 대강당입니다.",
        "신분증을 반드시 지참하세요.",
        "주의사항을 꼭 확인하세요."
      ];
    }

    let i = 0;
    // Simulate real-time by adding one sentence every 2.5 seconds
    demoIntervalRef.current = setInterval(() => {
      if (i < texts.length) {
        setTranscripts(prev => [...prev, processTranscript(texts[i])]);
        i++;
      } else {
        if (demoIntervalRef.current) clearInterval(demoIntervalRef.current);
      }
    }, 2500);
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

        {/* Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 mr-4">
            <span className="relative flex h-3 w-3">
              {isListening && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>}
              <span className={`relative inline-flex rounded-full h-3 w-3 ${isListening ? 'bg-red-500' : 'bg-gray-300'}`}></span>
            </span>
            <span className="text-sm font-semibold text-muted-foreground">{status}</span>
          </div>

          {!isListening ? (
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
              className="flex items-center gap-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground px-5 py-2.5 rounded-xl font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 animate-pulse"
            >
              <Square className="w-4 h-4" />
              녹음 중지
            </button>
          )}

          <button
            onClick={handleClear}
            className="flex items-center gap-2 bg-secondary hover:bg-secondary-foreground/10 text-secondary-foreground px-4 py-2.5 rounded-xl font-semibold transition-colors"
            title="자막 지우기"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden flex flex-col md:flex-row max-w-7xl w-full mx-auto w-full">
        
        {/* Left: Transcripts List */}
        <div className="flex-1 relative flex flex-col h-[60vh] md:h-auto border-r border-border/50">
          
          {errorMsg && (
            <div className="m-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{errorMsg}</p>
            </div>
          )}

          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 scroll-smooth"
          >
            {transcripts.length === 0 && !interimText && !errorMsg ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-8 opacity-60">
                <Mic className="w-16 h-16 mb-4 text-border" />
                <p className="text-lg font-bold">자막이 없습니다</p>
                <p className="text-sm mt-2">상단의 '마이크 시작' 버튼을 누르거나<br/>하단의 시연용 예시를 클릭하세요.</p>
              </div>
            ) : (
              transcripts.map((t) => (
                <TranscriptItem key={t.id} data={t} />
              ))
            )}
            
            {/* Interim processing text */}
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

        {/* Right: Summary Sidebar */}
        <div className="w-full md:w-[350px] lg:w-[400px] p-4 md:p-6 bg-background shrink-0">
          <SummaryPanel summaryText={summary.text} keywords={summary.keywords} />
        </div>
      </main>

      {/* Footer: Demo Scenarios */}
      <footer className="bg-card border-t border-border p-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-4">
          <span className="text-sm font-bold text-muted-foreground flex items-center gap-1.5">
            <PlayCircle className="w-4 h-4" />
            시연용 예시 버튼:
          </span>
          <div className="flex flex-wrap justify-center gap-2">
            <button 
              onClick={() => runDemoScenario(1)}
              className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-sm font-semibold transition-colors hover-elevate"
            >
              수업 공지
            </button>
            <button 
              onClick={() => runDemoScenario(2)}
              className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-sm font-semibold transition-colors hover-elevate"
            >
              회의 안내
            </button>
            <button 
              onClick={() => runDemoScenario(3)}
              className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-sm font-semibold transition-colors hover-elevate"
            >
              시험 일정
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
