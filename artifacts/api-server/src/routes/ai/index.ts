import { Router } from "express";
import { ai } from "@workspace/integrations-gemini-ai";

const router = Router();

function extractJson(raw: string): string {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    return raw.substring(start, end + 1);
  }
  return raw.trim();
}

function safeParseJson<T>(raw: string, fallback: T): T {
  if (!raw || raw.trim() === "") return fallback;
  const cleaned = extractJson(raw);
  try {
    return JSON.parse(cleaned);
  } catch {
    return fallback;
  }
}

router.post("/ai/analyze", async (req, res) => {
  try {
    const { text, context } = req.body as { text: string; context?: string[] };

    if (!text || typeof text !== "string" || !text.trim()) {
      res.status(400).json({ error: "text is required" });
      return;
    }

    const contextBlock = context && context.length > 0
      ? `\n\n이전 대화 맥락:\n${context.slice(-3).map((c, i) => `${i + 1}. ${c}`).join("\n")}`
      : "";

    const hasContext = context && context.length > 0;

    const prompt = `너는 청각장애인 환자를 돕는 전문 의료 통역 AI야.
병원 진료실에서 의사가 말한 내용을 환자(청각장애인)가 이해할 수 있도록 분석해줘.

의사 발화: "${text}"${contextBlock}

반드시 아래 JSON 형식으로만 응답해:
{
  "simpleSummary": "의사 말을 초등학생도 이해할 수 있는 1~2문장으로 쉽게 풀어쓰기 (음성인식 오류도 수정해서)",
  "medical_terms": [{"term": "어려운 의학/약학 용어", "explanation": "환자가 쉽게 이해할 수 있는 한 문장 설명"}],
  "sentiment": "positive 또는 neutral 또는 negative",
  "suggested_replies": ["환자 예상 답변 1", "환자 예상 답변 2", "환자 예상 답변 3"],
  "topic": "2~5글자 진료 주제 (예: 처방 안내, 검사 결과, 수술 설명, 약 복용, 부작용, 경과 관찰)",
  "tier": "일반 또는 중요 또는 핵심 또는 긴급",
  "keywords": ["핵심단어1", "핵심단어2"],
  "topicChanged": false
}

규칙:
- simpleSummary: 음성인식 오류를 수정하고 쉬운 말로 바꾸기
- medical_terms: 어려운 의학 용어만 포함, 없으면 빈 배열 []
- sentiment: positive(안심/좋은 소식), negative(주의/경고/심각), neutral(일반 설명)
- suggested_replies: 환자 입장에서 할 수 있는 짧은 답변 정확히 3개
- tier: 긴급(응급/심각), 핵심(중요한 치료 결정), 중요(처방/일정), 일반(일상 설명)
- topicChanged: 이전 맥락과 주제가 바뀌었으면 true${!hasContext ? ", 이전 맥락 없으면 반드시 false" : ""}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { maxOutputTokens: 8192, responseMimeType: "application/json" },
    });

    const raw = (response.text ?? "").trim();
    const parsed = safeParseJson(raw, {
      simpleSummary: text,
      medical_terms: [] as { term: string; explanation: string }[],
      sentiment: "neutral",
      suggested_replies: ["네, 이해했습니다", "다시 한번 설명해 주세요", "더 자세히 알 수 있을까요?"],
      topic: "진료",
      tier: "일반",
      keywords: [] as string[],
      topicChanged: false,
    });

    res.json({
      simpleSummary: (parsed as any).simpleSummary ?? text,
      medical_terms: Array.isArray((parsed as any).medical_terms) ? (parsed as any).medical_terms : [],
      sentiment: ["positive", "neutral", "negative"].includes((parsed as any).sentiment)
        ? (parsed as any).sentiment : "neutral",
      suggested_replies: Array.isArray((parsed as any).suggested_replies)
        ? (parsed as any).suggested_replies.slice(0, 3)
        : ["네, 이해했습니다", "다시 한번 설명해 주세요", "더 자세히 알 수 있을까요?"],
      topic: (parsed as any).topic ?? "진료",
      tier: (parsed as any).tier ?? "일반",
      keywords: Array.isArray((parsed as any).keywords) ? (parsed as any).keywords.slice(0, 4) : [],
      topicChanged: Boolean((parsed as any).topicChanged),
    });
  } catch (err: any) {
    console.error("AI analyze error:", err);
    res.status(500).json({ error: "AI 분석 실패" });
  }
});

router.post("/ai/summarize", async (req, res) => {
  try {
    const { transcripts } = req.body as { transcripts: string[] };

    if (!transcripts || !Array.isArray(transcripts) || transcripts.length === 0) {
      res.status(400).json({ error: "transcripts is required" });
      return;
    }

    const recent = transcripts.slice(-8);

    const prompt = `너는 청각장애인 환자를 돕는 전문 의료 통역 AI야.
아래는 진료실에서 의사가 말한 내용들이야:

${recent.map((t, i) => `${i + 1}. ${t}`).join("\n")}

다음 JSON 형식으로만 응답해:
{"summary":"오늘 진료 내용을 환자가 이해하기 쉽게 1~2문장으로 요약","keywords":["핵심단어1","핵심단어2"]}

summary: 초등학생도 이해하는 쉬운 말로 오늘 진료의 핵심 내용 요약
keywords: 최대 5개 핵심 의료 단어`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { maxOutputTokens: 8192, responseMimeType: "application/json" },
    });

    const raw = (response.text ?? "").trim();
    const parsed = safeParseJson(raw, { summary: "진료 내용을 요약할 수 없습니다.", keywords: [] as string[] });

    res.json({
      summary: (parsed as any).summary ?? "진료 내용을 요약할 수 없습니다.",
      keywords: Array.isArray((parsed as any).keywords) ? (parsed as any).keywords.slice(0, 5) : [],
    });
  } catch (err: any) {
    console.error("AI summarize error:", err);
    res.status(500).json({ error: "AI 요약 실패" });
  }
});

export default router;
