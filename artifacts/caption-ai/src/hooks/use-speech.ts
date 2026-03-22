import { useState, useEffect, useRef, useCallback } from 'react';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export type SpeechStatus = '대기 중' | '녹음 중' | '처리 중' | '오류 발생' | '지원하지 않음';

const SILENCE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export function useSpeechRecognition(
  onResult: (text: string, isFinal: boolean) => void,
  onDebugLog?: (msg: string) => void,
  deviceId?: string
) {
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState<SpeechStatus>('대기 중');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);

  const recognitionRef = useRef<any>(null);
  const isManuallyStoppedRef = useRef(false);
  const isListeningRef = useRef(false);
  const activeStreamRef = useRef<MediaStream | null>(null);
  const onResultRef = useRef(onResult);
  const onDebugRef = useRef(onDebugLog);
  const deviceIdRef = useRef(deviceId);
  const lastSpeechTimeRef = useRef<number>(Date.now());
  const silenceWatchdogRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => { deviceIdRef.current = deviceId; }, [deviceId]);
  useEffect(() => { onResultRef.current = onResult; }, [onResult]);
  useEffect(() => { onDebugRef.current = onDebugLog; }, [onDebugLog]);

  const log = (msg: string) => {
    console.log('[SpeechRecognition]', msg);
    onDebugRef.current?.(msg);
  };

  // Start / clear the 5-minute silence watchdog
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
    }, 30_000); // check every 30 seconds
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
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'ko-KR';
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
    recognition.onsoundend = () => log('onsoundend: 소리 종료됨');

    recognition.onresult = (event: any) => {
      log(`onresult: resultIndex=${event.resultIndex}, results.length=${event.results.length}`);
      lastSpeechTimeRef.current = Date.now(); // any speech resets the silence timer
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0]?.transcript ?? '';
        const confidence = event.results[i][0]?.confidence ?? 0;
        const isFinal = event.results[i].isFinal;
        log(`  result[${i}]: isFinal=${isFinal}, confidence=${confidence.toFixed(2)}, text="${transcript}"`);

        if (isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript.trim()) {
        log(`최종 결과: "${finalTranscript.trim()}"`);
        setStatus('녹음 중');
        onResultRef.current(finalTranscript.trim(), true);
      } else if (interimTranscript.trim()) {
        log(`중간 결과: "${interimTranscript.trim()}"`);
        setStatus('처리 중');
        onResultRef.current(interimTranscript.trim(), false);
      }
    };

    recognition.onerror = (event: any) => {
      log(`onerror: ${event.error}`);

      if (event.error === 'no-speech') {
        log('no-speech: 무음 타임아웃 — onend에서 재시작 예정');
        return;
      }
      if (event.error === 'audio-capture') {
        log('audio-capture: 오디오 캡처 오류 — onend에서 재시작 예정');
        return;
      }

      isListeningRef.current = false;
      setIsListening(false);
      setStatus('오류 발생');
      isManuallyStoppedRef.current = true;

      if (event.error === 'not-allowed') {
        setErrorMsg('마이크 권한이 없습니다. 브라우저 주소창의 마이크 아이콘을 클릭해 권한을 허용하세요.');
      } else if (event.error === 'network') {
        setErrorMsg('네트워크 오류: 인터넷 연결을 확인해주세요. (Google 음성인식은 인터넷 연결 필요)');
      } else if (event.error === 'aborted') {
        log('aborted: 중단됨 (정상)');
        return;
      } else {
        setErrorMsg(`오류: ${event.error}`);
      }
    };

    recognition.onend = () => {
      log(`onend: manuallyStopped=${isManuallyStoppedRef.current}`);

      if (!isManuallyStoppedRef.current) {
        // Check if 5 minutes of silence has elapsed across all restart cycles
        const silentMs = Date.now() - lastSpeechTimeRef.current;
        if (silentMs >= SILENCE_TIMEOUT_MS) {
          log(`onend: ${Math.round(silentMs / 1000)}s 무음 초과 — 자동 중지`);
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
      try { recognition.stop(); } catch (_) {}
    };
  }, [stopSilenceWatchdog]);

  const startListening = useCallback(async () => {
    setErrorMsg(null);
    if (!recognitionRef.current) {
      log('startListening: recognitionRef 없음');
      return;
    }
    if (isListeningRef.current) {
      log('startListening: 이미 녹음 중');
      return;
    }

    try {
      const dId = deviceIdRef.current;
      const audioConstraint: MediaTrackConstraints = dId && dId !== 'default'
        ? { deviceId: { exact: dId } }
        : true as any;
      log(`getUserMedia 시도: deviceId=${dId ?? 'default'}`);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraint });
      activeStreamRef.current = stream;
      log('getUserMedia 성공 — 음성 인식 시작');
    } catch (e: any) {
      log(`getUserMedia 실패: ${e?.message} — 기본 장치로 시도`);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        activeStreamRef.current = stream;
      } catch (e2: any) {
        setErrorMsg('마이크 권한이 없습니다. 브라우저 주소창에서 마이크 권한을 허용해주세요.');
        log(`getUserMedia 완전 실패: ${e2?.message}`);
        return;
      }
    }

    try {
      isManuallyStoppedRef.current = false;
      lastSpeechTimeRef.current = Date.now(); // reset silence timer on manual start
      startSilenceWatchdog();
      recognitionRef.current.start();
      log('startListening: start() 호출됨');
    } catch (e: any) {
      log(`startListening: 실패 — ${e?.message}`);
    }
  }, [startSilenceWatchdog]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    isManuallyStoppedRef.current = true;
    stopSilenceWatchdog();
    try {
      recognitionRef.current.stop();
    } catch (_) {}
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach(t => t.stop());
      activeStreamRef.current = null;
    }
    isListeningRef.current = false;
    setIsListening(false);
    setStatus('대기 중');
    log('stopListening: 중지됨');
  }, [stopSilenceWatchdog]);

  return { isListening, status, errorMsg, supported, startListening, stopListening };
}
