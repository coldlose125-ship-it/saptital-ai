const BASE = '/api';

const AI_TIMEOUT_MS = 15_000;

export interface MedicalTerm {
  term: string;
  explanation: string;
}

export interface AnalyzeResult {
  simpleSummary: string;
  medical_terms: MedicalTerm[];
  sentiment: 'positive' | 'neutral' | 'negative';
  suggested_replies: string[];
  topic: string;
  tier: '일반' | '중요' | '핵심' | '긴급';
  keywords: string[];
  topicChanged: boolean;
}

export interface SummarizeResult {
  summary: string;
  keywords: string[];
}

export async function analyzeText(text: string, context?: string[]): Promise<AnalyzeResult | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE}/ai/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, context }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    clearTimeout(timeout);
    return null;
  }
}

export async function summarizeTexts(transcripts: string[]): Promise<SummarizeResult | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE}/ai/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcripts }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    clearTimeout(timeout);
    return null;
  }
}

let _voicesLoaded = false;

export function speakText(text: string) {
  if (!window.speechSynthesis) return;

  const doSpeak = () => {
    window.speechSynthesis.cancel();
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      utterance.rate = 0.92;
      utterance.pitch = 1.05;
      utterance.volume = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const koVoice =
        voices.find(v => v.lang === 'ko-KR' && v.localService) ??
        voices.find(v => v.lang === 'ko-KR') ??
        voices.find(v => v.lang.startsWith('ko'));
      if (koVoice) utterance.voice = koVoice;

      window.speechSynthesis.speak(utterance);
    }, 80);
  };

  if (_voicesLoaded || window.speechSynthesis.getVoices().length > 0) {
    _voicesLoaded = true;
    doSpeak();
  } else {
    window.speechSynthesis.onvoiceschanged = () => {
      _voicesLoaded = true;
      doSpeak();
      window.speechSynthesis.onvoiceschanged = null;
    };
  }
}
