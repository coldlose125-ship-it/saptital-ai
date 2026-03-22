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

/**
 * 한국어 고품질 음성 우선순위 목록
 * 위에 있을수록 더 자연스러운 음성
 */
const KO_VOICE_PRIORITY = [
  'Google 한국의',      // Chrome 데스크톱 — 가장 자연스러운 신경망 음성
  'Yuna',               // macOS / iOS Apple 고품질
  'Sora',               // macOS Ventura 이후 신규 Apple 음성
  'Nari',               // macOS 일부 버전
  'Google 한국어',      // Chrome 일부 버전
  'Microsoft Heami',   // Windows 한국어
  'Microsoft Sora',    // Windows 11 신규
];

/** 음성 목록 Promise 캐시 — 모듈 로드 즉시 준비 시작 */
let _voicesPromise: Promise<SpeechSynthesisVoice[]> | null = null;

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (_voicesPromise) return _voicesPromise;

  _voicesPromise = new Promise(resolve => {
    const immediate = window.speechSynthesis.getVoices();
    if (immediate.length > 0) {
      resolve(immediate);
      return;
    }
    // 비동기 로딩 대기 (최대 3초 타임아웃)
    const timeout = setTimeout(() => resolve([]), 3000);
    window.speechSynthesis.onvoiceschanged = () => {
      clearTimeout(timeout);
      resolve(window.speechSynthesis.getVoices());
    };
  });

  return _voicesPromise;
}

/**
 * 우선순위 목록에서 가장 자연스러운 한국어 음성을 선택
 */
function pickKoreanVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const ko = voices.filter(v => v.lang === 'ko-KR' || v.lang.startsWith('ko'));
  if (ko.length === 0) return null;

  for (const name of KO_VOICE_PRIORITY) {
    const match = ko.find(v => v.name.includes(name));
    if (match) return match;
  }
  // 우선순위 목록에 없으면: 로컬(고품질) 우선 → 그 다음 아무 ko 음성
  return ko.find(v => v.localService) ?? ko[0];
}

export async function speakText(text: string): Promise<void> {
  if (!window.speechSynthesis) return;

  const voices = await loadVoices();

  window.speechSynthesis.cancel();

  // cancel() 직후 바로 speak() 하면 일부 브라우저에서 무시됨 — 80ms 대기
  await new Promise(r => setTimeout(r, 80));

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang    = 'ko-KR';
  utterance.rate    = 0.90;   // 살짝 느리게 — 청각장애인 대상 서비스 특성상 명확히
  utterance.pitch   = 1.0;
  utterance.volume  = 1.0;

  const voice = pickKoreanVoice(voices);
  if (voice) utterance.voice = voice;

  return new Promise<void>(resolve => {
    utterance.onend   = () => resolve();
    utterance.onerror = () => resolve();
    window.speechSynthesis.speak(utterance);
  });
}

// 페이지 로드 즉시 음성 목록 프리로드 (첫 버튼 클릭 시 지연 없음)
if (typeof window !== 'undefined' && window.speechSynthesis) {
  loadVoices();
}
