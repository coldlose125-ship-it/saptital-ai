import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
import { useSettings } from '@/lib/settings-context';
import { translateStatus, translateFontLabel, translateErrorMsg } from '@/lib/i18n';
import { DEMO_SCRIPT } from '@/lib/demo-data';
import {
  Mic, Square, Trash2, AlertCircle, ChevronDown, Stethoscope,
  Activity, FileText, BookOpen, X, RefreshCw, Moon, Sun, Globe, Play
} from 'lucide-react';

const FONT_SIZES = ['text-3xl md:text-4xl', 'text-4xl md:text-5xl', 'text-5xl md:text-6xl'] as const;
const STORAGE_KEY = 'sapital_session_v1';

function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    data.transcripts = (data.transcripts ?? []).map((t: ProcessedTranscript & { timestamp: string }) => ({
      ...t,
      timestamp: new Date(t.timestamp),
      aiLoading: false,
    }));
    data.sessionStart = data.sessionStart ? new Date(data.sessionStart) : new Date();
    return data;
  } catch {
    return null;
  }
}

const _s = loadSession();

export default function Home() {
  const { t, locale, theme, toggleTheme, toggleLocale } = useSettings();

  const [showSplash, setShowSplash] = useState(true);
  const [transcripts, setTranscripts] = useState<ProcessedTranscript[]>(_s?.transcripts ?? []);
  const [interimText, setInterimText] = useState<string>('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [globalTerms, setGlobalTerms] = useState<MedicalTerm[]>(_s?.globalTerms ?? []);
  const [globalKeywords, setGlobalKeywords] = useState<string[]>(_s?.globalKeywords ?? []);
  const [suggestedReplies, setSuggestedReplies] = useState<string[]>(_s?.suggestedReplies ?? []);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [lastSpeaking, setLastSpeaking] = useState<string>(_s?.lastSpeaking ?? '');
  const [fontSizeLevel, setFontSizeLevel] = useState<0 | 1 | 2>(0);
  const [showExport, setShowExport] = useState(false);
  const [showTermsDrawer, setShowTermsDrawer] = useState(false);
  const [errorDismissed, setErrorDismissed] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [storageWarning, setStorageWarning] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoStep, setDemoStep] = useState(-1);
  const [demoWaitingForReply, setDemoWaitingForReply] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const summaryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSummarizedCountRef = useRef(_s?.transcripts?.length ?? 0);
  const sessionStartRef = useRef<Date>(_s?.sessionStart ?? new Date());
  const sessionIdRef = useRef<number>(0);
  const demoTimersRef = useRef<NodeJS.Timeout[]>([]);
  // locale ref: 데모 effect 내에서 항상 최신 locale 참조
  const localeRef = useRef(locale);
  useEffect(() => { localeRef.current = locale; }, [locale]);

  const { devices, selectedDeviceId, setSelectedDeviceId } = useAudioDevices();

  const isAiLoading = useMemo(() => transcripts.some(t => t.aiLoading), [transcripts]);

  const runAIAnalysis = useCallback(async (id: string, text: string, contextTexts: string[], sessionId: number, localeArg: string) => {
    const result = await analyzeText(text, contextTexts, localeArg);

    if (sessionIdRef.current !== sessionId) return;

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

    if (sessionIdRef.current !== sessionId) return;

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
        const currentSessionId = sessionIdRef.current;
        setTranscripts(prev => {
          const next = [...prev, processed];
          scheduleSummary(next);
          const contextTexts = prev.slice(-4).map(t => t.displayText ?? t.originalText);
          runAIAnalysis(processed.id, text, contextTexts, currentSessionId, localeRef.current);
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

  useEffect(() => {
    if (errorMsg) setErrorDismissed(false);
  }, [errorMsg]);

  useEffect(() => {
    return () => {
      if (summaryTimerRef.current) clearTimeout(summaryTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!confirmClear) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setConfirmClear(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [confirmClear]);

  useEffect(() => {
    if (!selectedId && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcripts, interimText, selectedId]);

  const stopDemo = useCallback(() => {
    demoTimersRef.current.forEach(clearTimeout);
    demoTimersRef.current = [];
    setIsDemoMode(false);
    setDemoStep(-1);
    setDemoWaitingForReply(false);
  }, []);

  const startDemo = useCallback(() => {
    demoTimersRef.current.forEach(clearTimeout);
    demoTimersRef.current = [];
    sessionIdRef.current += 1;
    setTranscripts([]);
    setInterimText('');
    setSelectedId(null);
    setGlobalTerms([]);
    setGlobalKeywords([]);
    setSuggestedReplies([]);
    setLastSpeaking('');
    setDemoWaitingForReply(false);
    lastSummarizedCountRef.current = 0;
    sessionStartRef.current = new Date();
    if (summaryTimerRef.current) clearTimeout(summaryTimerRef.current);
    localStorage.removeItem(STORAGE_KEY);
    setIsDemoMode(true);
    setDemoStep(0);
  }, []);

  // 데모 스텝 effect: 각 스텝 진입 시 해당 엔트리를 표시
  useEffect(() => {
    if (!isDemoMode || demoStep < 0) return;
    if (demoStep >= DEMO_SCRIPT.length) {
      const tid = setTimeout(() => {
        setIsDemoMode(false);
        setDemoStep(-1);
      }, 1000);
      demoTimersRef.current.push(tid);
      return;
    }

    const entry = DEMO_SCRIPT[demoStep];
    const currentLocale = localeRef.current;
    const transcript = currentLocale === 'en' && entry.transcriptEn
      ? entry.transcriptEn
      : entry.transcript;
    const terms = currentLocale === 'en' && entry.globalTermsEn
      ? entry.globalTermsEn
      : entry.globalTerms;
    const keywords = currentLocale === 'en' && entry.globalKeywordsEn
      ? entry.globalKeywordsEn
      : entry.globalKeywords;

    const id = `demo-${demoStep}-${Date.now()}`;
    const ts = new Date();
    const full: ProcessedTranscript = { id, timestamp: ts, ...transcript };
    setTranscripts(prev => [...prev, full]);

    if (terms) {
      setGlobalTerms(prev => {
        const merged = [...terms, ...prev];
        const seen = new Set<string>();
        return merged.filter(t => { if (seen.has(t.term)) return false; seen.add(t.term); return true; }).slice(0, 12);
      });
    }
    if (keywords) {
      setGlobalKeywords(prev => [...new Set([...keywords, ...prev])].slice(0, 8));
    }
    if (transcript.displayText) setLastSpeaking(transcript.displayText);

    if (entry.waitForReply) {
      const replies = currentLocale === 'en' && entry.suggestedRepliesEn
        ? entry.suggestedRepliesEn
        : (entry.suggestedReplies ?? []);
      setSuggestedReplies(replies);
      setDemoWaitingForReply(true);
    } else {
      setSuggestedReplies([]);
      const tid = setTimeout(() => {
        setDemoStep(prev => prev + 1);
      }, entry.delay || 1500);
      demoTimersRef.current.push(tid);
    }
  }, [demoStep, isDemoMode]);

  // 환자가 빠른 답변 버튼을 클릭했을 때 다음 스텝으로 진행
  const handleDemoReply = useCallback((_text: string) => {
    if (!isDemoMode || !demoWaitingForReply) return;
    setDemoWaitingForReply(false);
    setSuggestedReplies([]);
    const tid = setTimeout(() => {
      setDemoStep(prev => prev + 1);
    }, 800);
    demoTimersRef.current.push(tid);
  }, [isDemoMode, demoWaitingForReply]);

  const handleClear = () => {
    stopDemo();
    sessionIdRef.current += 1;
    setConfirmClear(false);
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
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleClearClick = () => {
    setConfirmClear(true);
  };

  useEffect(() => {
    if (transcripts.length === 0) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        transcripts,
        globalTerms,
        globalKeywords,
        suggestedReplies,
        lastSpeaking,
        sessionStart: sessionStartRef.current.toISOString(),
      }));
    } catch {
      setStorageWarning(true);
    }
  }, [transcripts, globalTerms, globalKeywords, suggestedReplies, lastSpeaking]);

  const selectedTranscript = selectedId ? transcripts.find(t => t.id === selectedId) ?? null : null;

  const selectedBlockForPanel = selectedTranscript ? {
    topic: selectedTranscript.aiTopic,
    displayText: selectedTranscript.displayText,
    originalText: selectedTranscript.originalText,
    medical_terms: selectedTranscript.medical_terms,
    keywords: selectedTranscript.aiKeywords,
  } : null;

  const isMicError = errorMsg === 'speech.mic.denied' || errorMsg === 'speech.mic.denied2';

  const translatedStatus = translateStatus(status, locale);
  const translatedError = errorMsg ? translateErrorMsg(errorMsg, locale) : null;

  return (
    <>
      {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}

      <div className="h-screen bg-background flex flex-col font-sans overflow-hidden">
        <AlertBar />

        {/* Header */}
        <header role="banner" className="bg-card border-b border-border px-5 py-3 flex items-center justify-between sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-xl shadow-inner" aria-hidden="true">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-foreground leading-none">
                Sapital <span className="text-primary">AI</span>
              </h1>
              <p className="text-[10px] font-medium text-muted-foreground leading-tight mt-0.5">
                {t('app.subtitle')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end">
            {/* Demo button */}
            <button
              onClick={isDemoMode ? stopDemo : startDemo}
              disabled={isListening}
              aria-label={isDemoMode ? t('demo.stop') : t('demo.button')}
              className={`flex items-center gap-1 px-2 sm:px-2.5 py-2 sm:py-2.5 rounded-xl transition-colors text-xs font-bold disabled:opacity-50 ${
                isDemoMode
                  ? 'bg-amber-100 hover:bg-amber-200 text-amber-700 dark:bg-amber-900/30 dark:hover:bg-amber-800/40 dark:text-amber-400'
                  : 'bg-secondary hover:bg-muted text-secondary-foreground'
              }`}
            >
              <Play className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">{isDemoMode ? t('demo.stop') : t('demo.button')}</span>
            </button>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              aria-label={t('settings.theme')}
              className="p-2 sm:p-2.5 bg-secondary hover:bg-muted text-secondary-foreground rounded-xl transition-colors"
            >
              {theme === 'dark'
                ? <Sun className="w-4 h-4" aria-hidden="true" />
                : <Moon className="w-4 h-4" aria-hidden="true" />
              }
            </button>

            {/* Language toggle */}
            <button
              onClick={toggleLocale}
              aria-label={t('settings.lang')}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-2 sm:py-2.5 bg-secondary hover:bg-muted text-secondary-foreground rounded-xl transition-colors text-xs font-bold"
            >
              <Globe className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">{locale === 'ko' ? 'EN' : '한'}</span>
            </button>

            {/* Device selector */}
            <div className="relative items-center hidden sm:flex">
              <Mic className="absolute left-2.5 w-3.5 h-3.5 text-muted-foreground pointer-events-none z-10" aria-hidden="true" />
              <select
                value={selectedDeviceId}
                onChange={e => setSelectedDeviceId(e.target.value)}
                disabled={isListening}
                aria-label={t('mic.select')}
                className="appearance-none pl-7 pr-6 py-2 text-xs font-medium bg-secondary border border-border rounded-xl text-foreground cursor-pointer hover:bg-muted transition-colors disabled:opacity-50 max-w-[160px]"
              >
                {devices.length === 0
                  ? <option value="default">{t('mic.default')}</option>
                  : devices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label}</option>)
                }
              </select>
              <ChevronDown className="absolute right-1.5 w-3.5 h-3.5 text-muted-foreground pointer-events-none" aria-hidden="true" />
            </div>

            {/* Recording status */}
            <div
              role="status"
              aria-live="polite"
              aria-label={`${t('status.label')}: ${translatedStatus}`}
              className="flex items-center gap-1.5"
            >
              <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
                {isListening && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />}
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isListening ? 'bg-red-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
              </span>
              <span className="text-xs font-semibold text-muted-foreground hidden sm:inline">{translatedStatus}</span>
            </div>

            {/* Font size selector */}
            <div
              role="group"
              aria-label={t('font.label')}
              className="hidden sm:flex items-center gap-0.5 bg-secondary border border-border rounded-xl p-0.5"
            >
              {([0, 1, 2] as const).map(level => (
                <button
                  key={level}
                  onClick={() => setFontSizeLevel(level)}
                  aria-label={`${t('font.size')} ${translateFontLabel(level, locale)}`}
                  aria-pressed={fontSizeLevel === level}
                  className={`px-2 py-1.5 rounded-lg text-xs font-extrabold transition-all leading-none ${
                    fontSizeLevel === level
                      ? 'bg-primary text-white shadow'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                  style={{ fontSize: `${10 + level * 2}px` }}
                >
                  {locale === 'ko' ? '가' : 'A'}
                </button>
              ))}
            </div>

            {/* Export button */}
            {transcripts.length > 0 && (
              <button
                onClick={() => setShowExport(true)}
                aria-label={t('export.btn.aria')}
                className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800 px-2.5 sm:px-3 py-2 rounded-xl font-bold text-xs transition-colors"
              >
                <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">{t('export.btn')}</span>
              </button>
            )}

            {!isListening ? (
              <button
                onClick={startListening}
                aria-label={t('btn.start.aria')}
                className="flex items-center gap-1.5 sm:gap-2 bg-primary hover:bg-primary/90 text-white px-3 sm:px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
              >
                <Mic className="w-4 h-4" aria-hidden="true" />
                <span className="hidden xs:inline">{locale === 'ko' ? '진료' : ''}</span> {t('btn.start')}
              </button>
            ) : (
              <button
                onClick={stopListening}
                aria-label={t('btn.stop.aria')}
                className="flex items-center gap-1.5 sm:gap-2 bg-destructive hover:bg-destructive/90 text-white px-3 sm:px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow animate-rec-ring"
              >
                <Square className="w-4 h-4" aria-hidden="true" />
                {t('btn.stop')}
              </button>
            )}

            <button
              onClick={handleClearClick}
              aria-label={t('btn.clear.aria')}
              title={t('btn.clear.title')}
              className="p-2 sm:p-2.5 bg-secondary hover:bg-muted text-secondary-foreground rounded-xl transition-colors"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </header>

        {/* Demo mode banner */}
        <AnimatePresence>
          {isDemoMode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-amber-400/90 dark:bg-amber-600/80 text-amber-900 dark:text-amber-100 text-xs font-semibold text-center py-1.5 px-4 flex items-center justify-center gap-2"
              role="status"
              aria-live="polite"
            >
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-700 opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-800 dark:bg-amber-200" />
              </span>
              {t('demo.banner')}
              <button onClick={stopDemo} className="ml-2 underline underline-offset-2 hover:no-underline" aria-label={t('demo.stop')}>
                {t('demo.stop')}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Storage warning banner */}
        <AnimatePresence>
          {storageWarning && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              role="alert"
              aria-live="polite"
              className="mx-4 mt-3 p-3 bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400 rounded-xl flex items-center gap-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <p className="text-sm font-medium flex-1">{t('warn.storage')}</p>
              <button
                onClick={() => setStorageWarning(false)}
                aria-label={t('warn.close')}
                className="p-1 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors shrink-0"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mic error banner */}
        <AnimatePresence>
          {errorMsg && !errorDismissed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              role="alert"
              aria-live="assertive"
              className="mx-4 mt-3 p-3 bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 rounded-xl flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{translatedError}</p>
                {isMicError && (
                  <p className="text-xs mt-1 text-red-500 dark:text-red-400">
                    {t('err.mic.hint')}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {isMicError && (
                  <button
                    onClick={() => { setErrorDismissed(true); startListening(); }}
                    aria-label={t('err.mic.retry.aria')}
                    className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 px-2.5 py-1.5 rounded-lg transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" aria-hidden="true" />
                    {t('err.mic.retry')}
                  </button>
                )}
                <button
                  onClick={() => setErrorDismissed(true)}
                  aria-label={t('err.close')}
                  className="p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main */}
        <main className="flex-1 flex flex-col md:flex-row overflow-hidden" style={{ minHeight: 0 }}>

          {/* Left: Transcript history */}
          <div className="flex-1 flex flex-col overflow-hidden border-r border-border/50">
            <div
              ref={scrollRef}
              role="log"
              aria-live="polite"
              aria-label={t('caption.log')}
              aria-atomic="false"
              aria-busy={isAiLoading}
              className="flex-1 overflow-y-auto px-5 py-4 space-y-3 scroll-smooth"
            >
              {transcripts.length === 0 ? (
                <div
                  aria-label={t('caption.empty.aria')}
                  className="h-full flex flex-col items-center justify-center text-center text-muted-foreground py-16 opacity-60"
                >
                  <div className={`rounded-full bg-primary/10 flex items-center justify-center mb-5 transition-all duration-300 ${
                    fontSizeLevel === 0 ? 'w-20 h-20' : fontSizeLevel === 1 ? 'w-28 h-28' : 'w-36 h-36'
                  }`}>
                    <Stethoscope className={`text-primary/40 transition-all duration-300 ${
                      fontSizeLevel === 0 ? 'w-10 h-10' : fontSizeLevel === 1 ? 'w-14 h-14' : 'w-20 h-20'
                    }`} aria-hidden="true" />
                  </div>
                  <p className={`font-bold mb-2 transition-all duration-300 ${
                    fontSizeLevel === 0 ? 'text-base' : fontSizeLevel === 1 ? 'text-xl' : 'text-2xl'
                  }`}>{t('caption.empty.title')}</p>
                  <p className={`transition-all duration-300 ${
                    fontSizeLevel === 0 ? 'text-sm' : fontSizeLevel === 1 ? 'text-base' : 'text-lg'
                  }`}>{t('caption.empty.desc')}</p>
                </div>
              ) : (
                transcripts.map(tr => (
                  <TranscriptItem
                    key={tr.id}
                    data={tr}
                    isSelected={selectedId === tr.id}
                    onClick={() => setSelectedId(prev => prev === tr.id ? null : tr.id)}
                    fontSizeLevel={fontSizeLevel}
                  />
                ))
              )}

              {summaryLoading && (
                <div role="status" aria-label={t('ai.analyzing')} className="flex items-center gap-2 text-xs text-muted-foreground py-1 px-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-bounce" aria-hidden="true" />
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.15s]" aria-hidden="true" />
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.3s]" aria-hidden="true" />
                  <span className="ml-1">{t('ai.analyzing')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Medical Terms Sidebar */}
          <div className="hidden md:flex md:flex-col w-[320px] lg:w-[360px] shrink-0 overflow-hidden bg-card">
            <div className="flex-1 min-h-0 p-4">
              <MedicalTermsPanel
                selectedBlock={selectedBlockForPanel}
                globalTerms={globalTerms}
                globalKeywords={globalKeywords}
                onClearSelection={() => setSelectedId(null)}
              />
            </div>
          </div>
        </main>

        {/* Current speech box */}
        <div
          className={`shrink-0 px-5 py-4 border-t-2 transition-colors duration-300 ${
            interimText ? 'border-primary bg-primary/5' : 'border-border bg-card'
          }`}
        >
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 mb-2">
              <Activity
                className={`w-4 h-4 ${interimText ? 'text-primary animate-pulse' : 'text-muted-foreground/30'}`}
                aria-hidden="true"
              />
              <span
                className={`text-xs font-bold tracking-wide uppercase ${interimText ? 'text-primary' : 'text-muted-foreground/50'}`}
                aria-hidden="true"
              >
                {interimText ? t('live.label.active') : t('live.label.idle')}
              </span>
              {interimText && (
                <span className="flex gap-0.5 ml-1" aria-hidden="true">
                  <span className="w-1 h-1 rounded-full bg-primary animate-bounce" />
                  <span className="w-1 h-1 rounded-full bg-primary animate-bounce [animation-delay:0.15s]" />
                  <span className="w-1 h-1 rounded-full bg-primary animate-bounce [animation-delay:0.3s]" />
                </span>
              )}
            </div>
            <div
              className={[
                'overflow-hidden hover:overflow-y-auto scroll-smooth transition-all duration-300',
                fontSizeLevel === 0 ? 'max-h-[96px]' : fontSizeLevel === 1 ? 'max-h-[128px]' : 'max-h-[160px]',
              ].join(' ')}
            >
              <p
                aria-live="assertive"
                aria-atomic="true"
                aria-label={interimText ? `${t('live.recognizing')}: ${interimText}` : `${t('live.last')}: ${lastSpeaking || t('live.none')}`}
                className={`${FONT_SIZES[fontSizeLevel]} font-bold tracking-tight leading-snug transition-colors duration-300 ${
                  interimText ? 'text-primary' : 'text-foreground/60'
                }`}
              >
                {interimText || lastSpeaking || (isListening ? t('live.placeholder.listening') : t('live.placeholder.idle'))}
              </p>
            </div>
          </div>
        </div>

        {/* Mobile FAB bar */}
        <div className="md:hidden shrink-0 flex items-center justify-between px-4 py-2 bg-card border-t border-border/30">
          <div
            role="group"
            aria-label={t('mobile.font.label')}
            className="flex items-center gap-0.5 bg-secondary border border-border rounded-xl p-0.5"
          >
            {([0, 1, 2] as const).map(level => (
              <button
                key={level}
                onClick={() => setFontSizeLevel(level)}
                aria-label={`${t('font.size')} ${translateFontLabel(level, locale)}`}
                aria-pressed={fontSizeLevel === level}
                className={`px-2 py-1.5 rounded-lg text-xs font-extrabold transition-all leading-none ${
                  fontSizeLevel === level
                    ? 'bg-primary text-white shadow'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
                style={{ fontSize: `${10 + level * 2}px` }}
              >
                {locale === 'ko' ? '가' : 'A'}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowTermsDrawer(true)}
            aria-label={t('mobile.terms.open')}
            aria-haspopup="dialog"
            className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors"
          >
            <BookOpen className="w-4 h-4" aria-hidden="true" />
            {t('mobile.terms.btn')}
            {globalTerms.length > 0 && (
              <span className="bg-primary text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full leading-none">
                {globalTerms.length}
              </span>
            )}
          </button>
        </div>

        {/* Quick reply buttons */}
        <QuickReplyBar
          replies={suggestedReplies}
          isLoading={isAiLoading && suggestedReplies.length === 0}
          onReply={isDemoMode ? handleDemoReply : undefined}
        />
      </div>

      {/* Mobile terms drawer */}
      <AnimatePresence>
        {showTermsDrawer && (
          <>
            <motion.div
              key="drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTermsDrawer(false)}
              className="fixed inset-0 bg-black/40 z-40 md:hidden"
              aria-hidden="true"
            />
            <motion.div
              key="drawer-panel"
              role="dialog"
              aria-modal="true"
              aria-label={t('mobile.terms.title')}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl shadow-2xl md:hidden flex flex-col"
              style={{ maxHeight: '70vh' }}
            >
              <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-1 bg-muted-foreground/30 rounded-full absolute left-1/2 -translate-x-1/2 top-3" aria-hidden="true" />
                  <BookOpen className="w-4 h-4 text-primary mt-1" aria-hidden="true" />
                  <h2 className="text-sm font-bold text-foreground mt-1">{t('mobile.terms.title')}</h2>
                </div>
                <button
                  onClick={() => setShowTermsDrawer(false)}
                  aria-label={t('mobile.terms.close')}
                  className="p-2 rounded-xl hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
              <div className="flex-1 min-h-0 p-4 overflow-hidden">
                <MedicalTermsPanel
                  selectedBlock={selectedBlockForPanel}
                  globalTerms={globalTerms}
                  globalKeywords={globalKeywords}
                  onClearSelection={() => { setSelectedId(null); setShowTermsDrawer(false); }}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Export modal */}
      <ExportModal
        open={showExport}
        onClose={() => setShowExport(false)}
        transcripts={transcripts}
        globalTerms={globalTerms}
        globalKeywords={globalKeywords}
        sessionStart={sessionStartRef.current}
      />

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {confirmClear && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm"
            onClick={() => setConfirmClear(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="clear-dialog-title"
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 10 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              onClick={e => e.stopPropagation()}
              className="bg-card rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5 text-red-500" aria-hidden="true" />
                </div>
                <div>
                  <h2 id="clear-dialog-title" className="text-base font-bold text-foreground">{t('clear.title')}</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">{t('clear.desc')}</p>
                </div>
              </div>
              <p className="text-sm text-foreground bg-muted/50 rounded-xl px-4 py-3">
                {t('clear.confirm')}
              </p>
              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => setConfirmClear(false)}
                  className="flex-1 py-3 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors"
                >
                  {t('clear.cancel')}
                </button>
                <button
                  onClick={handleClear}
                  className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors"
                >
                  {t('clear.delete')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
