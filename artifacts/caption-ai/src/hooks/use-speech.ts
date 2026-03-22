import { useState, useEffect, useRef, useCallback } from 'react';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export type SpeechStatus = '대기 중' | '녹음 중' | '처리 중' | '오류 발생' | '지원하지 않음';

const SILENCE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

// ── Sentence boundary detection ──────────────────────────────
// Flush the buffer when the accumulated text ends with a Korean
// sentence-final ending OR reaches a length limit.
const SENTENCE_END_RE = /[다요죠까음][.!?]?\s*$|[.!?。]\s*$/;
const SENTENCE_FORCE_LEN = 160; // force flush after this many chars
const SENTENCE_IDLE_MS  = 3500; // flush if no new speech for this long

function isSentenceEnd(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  return SENTENCE_END_RE.test(t) || t.length >= SENTENCE_FORCE_LEN;
}
// ─────────────────────────────────────────────────────────────

export function useSpeechRecognition(
  onResult: (text: string, isFinal: boolean) => void,
  onDebugLog?: (msg: string) => void,
  deviceId?: string
) {
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState<SpeechStatus>('대기 중');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);

  const recognitionRef      = useRef<any>(null);
  const isManuallyStoppedRef = useRef(false);
  const isListeningRef      = useRef(false);
  const activeStreamRef     = useRef<MediaStream | null>(null);
  const onResultRef         = useRef(onResult);
  const onDebugRef          = useRef(onDebugLog);
  const deviceIdRef         = useRef(deviceId);
  const lastSpeechTimeRef   = useRef<number>(Date.now());
  const silenceWatchdogRef  = useRef<NodeJS.Timeout | null>(null);

  // Sentence-buffer refs
  const sentenceBufferRef   = useRef<string>('');
  const idleFlushTimerRef   = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => { deviceIdRef.current = deviceId; }, [deviceId]);
  useEffect(() => { onResultRef.current = onResult; }, [onResult]);
  useEffect(() => { onDebugRef.current = onDebugLog; }, [onDebugLog]);

  const log = (msg: string) => {
    console.log('[SpeechRecognition]', msg);
    onDebugRef.current?.(msg);
  };

  // ── Flush accumulated sentence buffer ──────────────────────
  const flushBuffer = useCallback((force = false) => {
    if (idleFlushTimerRef.current) {
      clearTimeout(idleFlushTimerRef.current);
      idleFlushTimerRef.current = null;
    }
    const buf = sentenceBufferRef.current.trim();
    if (!buf) return;
    if (force || isSentenceEnd(buf)) {
      sentenceBufferRef.current = '';
      log(`문장 완성 flush: "${buf}"`);
      onResultRef.current(buf, true);
    }
  }, []);

  // Schedule idle flush (fires if no new speech arrives soon)
  const scheduleIdleFlush = useCallback(() => {
    if (idleFlushTimerRef.current) clearTimeout(idleFlushTimerRef.current);
    idleFlushTimerRef.current = setTimeout(() => {
      const buf = sentenceBufferRef.current.trim();
      if (buf) {
        sentenceBufferRef.current = '';
        log(`idle flush: "${buf}"`);
        onResultRef.current(buf, true);
      }
    }, SENTENCE_IDLE_MS);
  }, []);
  // ──────────────────────────────────────────────────────────

  const startSilenceWatchdog = useCallback(() => {
    if (silenceWatchdogRef.current) clearInterval(silenceWatchdogRef.current);
    lastSpeechTimeRef.current = Date.now();
    silenceWatchdogRef.current = setInterval(() => {
      const silentMs = Date.now() - lastSpeechTimeRef.current;
      if (silentMs >= SILENCE_TIMEOUT_MS && isListeningRef.current) {
        log(`silence watchdog: ${Math.round(silentMs / 1000)}s 무음 — 자동 중지`);
        isManuallyStoppedRef.current = true;
        try { recognitionRef.current?.stop(); } catch (_) {}
        if (activeStreamRef.current) {
          activeStreamRef.current.getTracks().forEach(t => t.stop());
          activeStreamRef.current = null;
        }
        isListeningRef.current = false;
        setIsListening(false);
        setStatus('대기 중');
        if (silenceWatchdogRef.current) {
          clearInterval(silenceWatchdogRef.current);
          silenceWatchdogRef.current = null;
        }
      }
    }, 30_000);
  }, []);

  const stopSilenceWatchdog = useCallback(() => {
    if (silenceWatchdogRef.current) {
      clearInterval(silenceWatchdogRef.current);
      silenceWatchdogRef.current = null;
    }
  }, []);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      setStatus('지원하지 않음');
      setErrorMsg('이 브라우저는 음성인식을 지원하지 않습니다. Chrome 브라우저를 사용해주세요.');
      log('지원하지 않음: SpeechRecognition API 없음');
      return;
    }

    log('SpeechRecognition API 감지됨');

    const recognition = new SpeechRecognition();
    recognition.continuous     = true;
    recognition.interimResults = true;
    recognition.lang           = 'ko-KR';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      log('onstart: 인식 시작됨');
      isListeningRef.current = true;
      setIsListening(true);
      setStatus('녹음 중');
      setErrorMsg(null);
    };

    recognition.onsoundstart = () => log('onsoundstart: 소리 감지됨');
    recognition.onspeechstart = () => {
      log('onspeechstart: 음성 감지됨');
      lastSpeechTimeRef.current = Date.now();
    };
    recognition.onspeechend = () => log('onspeechend: 음성 종료됨');
    recognition.onsoundend  = () => log('onsoundend: 소리 종료됨');

    recognition.onresult = (event: any) => {
      lastSpeechTimeRef.current = Date.now();

      let interimTranscript = '';
      let finalTranscript   = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0]?.transcript ?? '';
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript.trim()) {
        // Accumulate into sentence buffer
        sentenceBufferRef.current =
          (sentenceBufferRef.current + ' ' + finalTranscript.trim()).trim();

        log(`버퍼 누적: "${sentenceBufferRef.current}"`);

        if (isSentenceEnd(sentenceBufferRef.current)) {
          // Sentence complete — emit as final and clear buffer
          flushBuffer(true);
          setStatus('녹음 중');
        } else {
          // Not yet a full sentence — show as interim and wait
          onResultRef.current(sentenceBufferRef.current, false);
          scheduleIdleFlush();
          setStatus('처리 중');
        }
      } else if (interimTranscript.trim()) {
        // Merge buffer prefix with current interim for display
        const display = sentenceBufferRef.current
          ? sentenceBufferRef.current + ' ' + interimTranscript.trim()
          : interimTranscript.trim();
        setStatus('처리 중');
        onResultRef.current(display.trim(), false);
      }
    };

    recognition.onerror = (event: any) => {
      log(`onerror: ${event.error}`);
      if (event.error === 'no-speech' || event.error === 'audio-capture') return;
      if (event.error === 'aborted') { log('aborted (정상)'); return; }

      isListeningRef.current = false;
      setIsListening(false);
      setStatus('오류 발생');
      isManuallyStoppedRef.current = true;

      if (event.error === 'not-allowed') {
        setErrorMsg('마이크 권한이 없습니다. 브라우저 주소창의 마이크 아이콘을 클릭해 권한을 허용하세요.');
      } else if (event.error === 'network') {
        setErrorMsg('네트워크 오류: 인터넷 연결을 확인해주세요.');
      } else {
        setErrorMsg(`오류: ${event.error}`);
      }
    };

    recognition.onend = () => {
      log(`onend: manuallyStopped=${isManuallyStoppedRef.current}`);

      if (!isManuallyStoppedRef.current) {
        const silentMs = Date.now() - lastSpeechTimeRef.current;
        if (silentMs >= SILENCE_TIMEOUT_MS) {
          log(`onend: ${Math.round(silentMs / 1000)}s 무음 초과 — 자동 중지`);
          flushBuffer(true); // flush any partial sentence
          isListeningRef.current = false;
          setIsListening(false);
          setStatus('대기 중');
          stopSilenceWatchdog();
          if (activeStreamRef.current) {
            activeStreamRef.current.getTracks().forEach(t => t.stop());
            activeStreamRef.current = null;
          }
          return;
        }

        log('onend: 자동 재시작 시도...');
        setTimeout(() => {
          try {
            recognition.start();
            log('onend: 재시작 성공');
          } catch (e: any) {
            log(`onend: 재시작 실패 — ${e?.message}`);
            isListeningRef.current = false;
            setIsListening(false);
            setStatus('대기 중');
          }
        }, 300);
      } else {
        flushBuffer(true); // flush remaining partial sentence on manual stop
        isListeningRef.current = false;
        setIsListening(false);
        setStatus('대기 중');
        stopSilenceWatchdog();
        log('onend: 사용자가 중지함');
      }
    };

    recognitionRef.current = recognition;
    log('인식기 초기화 완료');

    return () => {
      log('cleanup: 인식기 정리');
      isManuallyStoppedRef.current = true;
      stopSilenceWatchdog();
      if (idleFlushTimerRef.current) clearTimeout(idleFlushTimerRef.current);
      try { recognition.stop(); } catch (_) {}
    };
  }, [stopSilenceWatchdog, flushBuffer, scheduleIdleFlush]);

  const startListening = useCallback(async () => {
    setErrorMsg(null);
    sentenceBufferRef.current = ''; // reset buffer on new session
    if (!recognitionRef.current) return;
    if (isListeningRef.current) return;

    try {
      const dId = deviceIdRef.current;
      const audioConstraint: MediaTrackConstraints = dId && dId !== 'default'
        ? { deviceId: { exact: dId } }
        : true as any;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraint });
      activeStreamRef.current = stream;
    } catch {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        activeStreamRef.current = stream;
      } catch (e2: any) {
        setErrorMsg('마이크 권한이 없습니다. 브라우저 주소창에서 마이크 권한을 허용해주세요.');
        return;
      }
    }

    try {
      isManuallyStoppedRef.current = false;
      lastSpeechTimeRef.current = Date.now();
      startSilenceWatchdog();
      recognitionRef.current.start();
    } catch (e: any) {
      log(`startListening: 실패 — ${e?.message}`);
    }
  }, [startSilenceWatchdog]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    isManuallyStoppedRef.current = true;
    stopSilenceWatchdog();
    if (idleFlushTimerRef.current) clearTimeout(idleFlushTimerRef.current);
    try { recognitionRef.current.stop(); } catch (_) {}
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach(t => t.stop());
      activeStreamRef.current = null;
    }
    isListeningRef.current = false;
    setIsListening(false);
    setStatus('대기 중');
  }, [stopSilenceWatchdog]);

  return { isListening, status, errorMsg, supported, startListening, stopListening };
}
