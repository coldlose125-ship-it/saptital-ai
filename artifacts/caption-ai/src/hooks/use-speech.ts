import { useState, useEffect, useRef, useCallback } from 'react';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export type SpeechStatus = '대기 중' | '녹음 중' | '처리 중' | '오류 발생' | '지원하지 않음';

export function useSpeechRecognition(onResult: (text: string, isFinal: boolean) => void) {
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState<SpeechStatus>('대기 중');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const isManuallyStoppedRef = useRef(false);
  const isListeningRef = useRef(false);

  // Keep the callback in a ref so the recognition instance is only created ONCE.
  // Without this, every state update triggers a re-render, which creates a new
  // callback reference, which restarts the recognition — breaking speech capture.
  const onResultRef = useRef(onResult);
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setStatus('지원하지 않음');
      setErrorMsg('이 브라우저는 음성인식을 지원하지 않습니다. Chrome을 권장합니다.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'ko-KR';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      isListeningRef.current = true;
      setIsListening(true);
      setStatus('녹음 중');
      setErrorMsg(null);
      isManuallyStoppedRef.current = false;
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0]?.transcript;
        if (!transcript) continue;

        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript.trim()) {
        setStatus('녹음 중');
        onResultRef.current(finalTranscript.trim(), true);
      } else if (interimTranscript.trim()) {
        setStatus('처리 중');
        onResultRef.current(interimTranscript.trim(), false);
      }
    };

    recognition.onerror = (event: any) => {
      // no-speech = silence timeout, audio-capture = brief glitch → both are non-fatal
      if (event.error === 'no-speech' || event.error === 'audio-capture') {
        return;
      }

      console.error('Speech recognition error', event.error);
      isListeningRef.current = false;
      setIsListening(false);
      setStatus('오류 발생');
      isManuallyStoppedRef.current = true;

      if (event.error === 'not-allowed') {
        setErrorMsg('마이크 권한이 필요합니다. 브라우저 설정에서 마이크 권한을 허용해주세요.');
      } else if (event.error === 'network') {
        setErrorMsg('네트워크 오류가 발생했습니다. 다시 시도해주세요.');
      } else {
        setErrorMsg(`음성인식 오류: ${event.error}`);
      }
    };

    recognition.onend = () => {
      // Auto-restart unless manually stopped or a fatal error occurred
      if (!isManuallyStoppedRef.current) {
        try {
          recognition.start();
        } catch (e) {
          isListeningRef.current = false;
          setIsListening(false);
          setStatus('대기 중');
        }
      } else {
        isListeningRef.current = false;
        setIsListening(false);
        setStatus('대기 중');
      }
    };

    recognitionRef.current = recognition;

    // Cleanup: stop recognition when component unmounts
    return () => {
      isManuallyStoppedRef.current = true;
      try {
        recognition.stop();
      } catch (e) {}
    };
  }, []); // Empty deps — create recognition only ONCE

  const startListening = useCallback(() => {
    setErrorMsg(null);
    if (recognitionRef.current && !isListeningRef.current) {
      try {
        isManuallyStoppedRef.current = false;
        recognitionRef.current.start();
      } catch (e) {
        console.error('Failed to start recognition', e);
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListeningRef.current) {
      isManuallyStoppedRef.current = true;
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      isListeningRef.current = false;
      setIsListening(false);
      setStatus('대기 중');
    }
  }, []);

  return { isListening, status, errorMsg, startListening, stopListening };
}
