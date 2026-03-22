/**
 * Core logic for evaluating Korean text importance and extracting keywords.
 * All logic is purely frontend-based.
 */

// Define keyword dictionaries with their associated scores
const KEYWORD_DICT = [
  { words: ['긴급', '위험', '경보', '화재', '지진', '대피'], score: 6, tier: '긴급' },
  { words: ['중요', '반드시', '주의', '필수', '절대', '확인', '꼭'], score: 4, tier: '핵심' },
  { words: ['마감', '제출', '시험', '발표', '회의', '내일', '오늘', '일정', '날짜', '시간', '장소', '오전', '오후'], score: 2, tier: '일정' },
  { words: ['변경', '취소', '연기', '수정', '추가'], score: 2, tier: '변경' }
];

export interface ProcessedTranscript {
  id: string;
  originalText: string;
  score: number;
  tier: '일반' | '중요' | '핵심' | '긴급';
  keywordsFound: string[];
  segments: { text: string; isKeyword: boolean; keywordTier?: string }[];
  timestamp: Date;
  // AI-enriched fields (set asynchronously after Gemini analysis)
  aiTopic?: string;
  aiTier?: '일반' | '중요' | '핵심' | '긴급';
  aiLoading?: boolean;
}

export function processTranscript(text: string): ProcessedTranscript {
  // Guard against undefined/empty input
  if (!text || typeof text !== 'string' || !text.trim()) {
    return {
      id: crypto.randomUUID(),
      originalText: '',
      score: 0,
      tier: '일반',
      keywordsFound: [],
      segments: [{ text: '', isKeyword: false }],
      timestamp: new Date(),
    };
  }

  let totalScore = 0;
  const keywordsFound: string[] = [];
  let highestTier = '일반';
  
  // Find all keywords and calculate score
  const matches: { word: string; index: number; length: number; tier: string }[] = [];
  
  KEYWORD_DICT.forEach(category => {
    category.words.forEach(word => {
      let startIndex = 0;
      let index;
      while ((index = text.indexOf(word, startIndex)) > -1) {
        matches.push({ word, index, length: word.length, tier: category.tier });
        keywordsFound.push(word);
        totalScore += category.score;
        startIndex = index + word.length;
      }
    });
  });

  // Determine overall tier
  if (totalScore >= 6) highestTier = '긴급';
  else if (totalScore >= 4) highestTier = '핵심';
  else if (totalScore >= 2) highestTier = '중요';

  // Segment the text for highlighting
  // Sort matches by index to build segments correctly
  matches.sort((a, b) => a.index - b.index);
  
  const segments: ProcessedTranscript['segments'] = [];
  let currentIndex = 0;
  
  // Resolve overlapping matches (e.g. if a word is part of another word, though unlikely in our simple dict)
  const nonOverlappingMatches = matches.reduce((acc, current) => {
    if (acc.length === 0) return [current];
    const prev = acc[acc.length - 1];
    if (current.index >= prev.index + prev.length) {
      acc.push(current);
    }
    return acc;
  }, [] as typeof matches);

  nonOverlappingMatches.forEach(match => {
    if (match.index > currentIndex) {
      segments.push({ text: text.substring(currentIndex, match.index), isKeyword: false });
    }
    segments.push({ text: match.word, isKeyword: true, keywordTier: match.tier });
    currentIndex = match.index + match.length;
  });

  if (currentIndex < text.length) {
    segments.push({ text: text.substring(currentIndex), isKeyword: false });
  }

  // Fallback if no keywords found
  if (segments.length === 0) {
    segments.push({ text, isKeyword: false });
  }

  return {
    id: crypto.randomUUID(),
    originalText: text,
    score: totalScore,
    tier: highestTier as ProcessedTranscript['tier'],
    keywordsFound: Array.from(new Set(keywordsFound)), // deduplicate
    segments,
    timestamp: new Date()
  };
}

export function generateSummary(transcripts: ProcessedTranscript[]): { text: string; keywords: string[] } {
  if (transcripts.length === 0) return { text: "요약이 없습니다. 더 많은 내용이 쌓이면 자동으로 생성됩니다.", keywords: [] };

  // Get transcripts from the last few entries (up to 5)
  const recent = transcripts.slice(-5);
  
  // Aggregate all unique keywords found
  const allKeywords = new Set<string>();
  let hasEmergency = false;
  let hasSchedule = false;

  recent.forEach(t => {
    t.keywordsFound.forEach(kw => allKeywords.add(kw));
    if (t.tier === '긴급') hasEmergency = true;
    if (t.tier === '핵심' || t.tier === '중요') hasSchedule = true;
  });

  const keywordsArray = Array.from(allKeywords);

  if (keywordsArray.length === 0) {
    return {
      text: "일상적인 대화가 진행 중입니다. 특별히 강조된 핵심 키워드는 아직 발견되지 않았습니다.",
      keywords: []
    };
  }

  // Construct a smart-sounding template based on found keyword types
  let text = `최근 내용에서 `;
  if (keywordsArray.length <= 2) {
    text += `'${keywordsArray.join(', ')}'와(과) 관련된 내용이 언급되었습니다. `;
  } else {
    text += `'${keywordsArray[0]}', '${keywordsArray[1]}' 등 주요 사항이 논의되었습니다. `;
  }

  if (hasEmergency) {
    text += "주의가 필요한 긴급/핵심 사항이 포함되어 있습니다.";
  } else if (hasSchedule) {
    text += "일정이나 중요 변동 사항에 유의하시기 바랍니다.";
  } else {
    text += "전반적인 흐름을 확인해주세요.";
  }

  return {
    text,
    keywords: keywordsArray.slice(0, 5) // Return up to 5 keywords
  };
}
