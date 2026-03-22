import { useState, useEffect, useRef, useCallback } from 'react';

// Extend Window type for Web Speech API
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

    recognition.onstart = () => {
      setIsListening(true);
      setStatus('녹음 중');
      setErrorMsg(null);
      isManuallyStoppedRef.current = false;
    };

    recognition.onresult = (event: any) => {
      setStatus('처리 중');
      
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        onResult(finalTranscript.trim(), true);
      } else if (interimTranscript) {
        // We only pass interim to give UI feedback, but maybe handle it carefully
        onResult(interimTranscript.trim(), false);
      }
      
      // Reset back to listening after a small delay
      setTimeout(() => {
        if (recognitionRef.current && isListening) setStatus('녹음 중');
      }, 500);
    };

    recognition.onerror = (event: any) => {
      // 'no-speech' and 'audio-capture' are non-fatal — they just mean silence or a brief glitch.
      // Let onend handle the restart automatically.
      if (event.error === 'no-speech' || event.error === 'audio-capture') {
        return;
      }

      console.error('Speech recognition error', event.error);
      setIsListening(false);
      setStatus('오류 발생');
      isManuallyStoppedRef.current = true; // prevent auto-restart on fatal errors

      if (event.error === 'not-allowed') {
        setErrorMsg('마이크 권한이 필요합니다. 브라우저 설정에서 권한을 허용해주세요.');
      } else if (event.error === 'network') {
        setErrorMsg('네트워크 오류가 발생했습니다. 다시 시도해주세요.');
      } else {
        setErrorMsg(`음성인식 오류: ${event.error}`);
      }
    };

    recognition.onend = () => {
      // Automatically restart unless the user manually stopped or a fatal error occurred
      if (!isManuallyStoppedRef.current) {
        try {
          recognition.start();
        } catch (e) {
          setIsListening(false);
          setStatus('대기 중');
        }
      } else {
        setIsListening(false);
        setStatus('대기 중');
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        isManuallyStoppedRef.current = true;
        recognitionRef.current.stop();
      }
    };
  }, [onResult]);

  const startListening = useCallback(() => {
    setErrorMsg(null);
    if (recognitionRef.current && !isListening) {
      try {
        isManuallyStoppedRef.current = false;
        recognitionRef.current.start();
      } catch (e) {
        console.error("Failed to start recognition", e);
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      isManuallyStoppedRef.current = true;
      recognitionRef.current.stop();
      setIsListening(false);
      setStatus('대기 중');
    }
  }, [isListening]);

  return {
    isListening,
    status,
    errorMsg,
    startListening,
    stopListening
  };
}
