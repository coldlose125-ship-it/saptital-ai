const BASE = '/api';

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
  try {
    const res = await fetch(`${BASE}/ai/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, context }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function summarizeTexts(transcripts: string[]): Promise<SummarizeResult | null> {
  try {
    const res = await fetch(`${BASE}/ai/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcripts }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export function speakText(text: string) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ko-KR';
  utterance.rate = 0.9;
  utterance.pitch = 1.0;
  window.speechSynthesis.speak(utterance);
}
