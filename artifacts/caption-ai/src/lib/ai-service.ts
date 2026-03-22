const BASE = '/api';

export interface AnalyzeResult {
  topic: string;
  tier: '일반' | '중요' | '핵심' | '긴급';
  simpleSummary: string;
  keywords: string[];
  isSmallTalk: boolean;
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
