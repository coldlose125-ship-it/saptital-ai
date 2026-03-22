import { Router } from "express";
import { ai } from "@workspace/integrations-gemini-ai";

const router = Router();

function extractJson(raw: string): string {
  // Find the first '{' and last '}' to extract the JSON object
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
    const result = JSON.parse(cleaned);
    console.log("[AI] parse OK, keys:", Object.keys(result));
    return result;
  } catch (e) {
    console.error("[AI] parse failed. cleaned:", cleaned.slice(0, 200));
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
      ? `\n\n이전 대화 맥락:\n${context.slice(-4).map((c, i) => `${i + 1}. ${c}`).join("\n")}`
      : "";

    const prompt = `당신은 청각장애인과 언어장애인을 위한 자막 분석 AI입니다.
아래 한국어 발화 텍스트를 분석하여 JSON으로만 응답하세요.

발화 텍스트: "${text}"${contextBlock}

다음 JSON 형식으로 정확히 응답하세요 (다른 텍스트 없이 JSON만):
{"topic":"주제라벨","tier":"일반","simpleSummary":"쉬운 요약"}

topic: 2~5글자 짧은 주제 (예: 음식 결정, 수업 공지, 일정 변경, 긴급 상황)
tier: 일반 / 중요 / 핵심 / 긴급 중 하나
simpleSummary: 초등학생도 이해할 수 있는 1~2문장`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { maxOutputTokens: 8192, responseMimeType: "application/json" },
    });

    const raw = (response.text ?? "").trim();

    const parsed = safeParseJson(raw, { topic: "일반", tier: "일반", simpleSummary: text });

    res.json({
      topic: (parsed as any).topic ?? "일반",
      tier: (parsed as any).tier ?? "일반",
      simpleSummary: (parsed as any).simpleSummary ?? text,
    });
  } catch (err: any) {
    console.error("AI analyze error:", err);
    res.status(500).json({ error: "AI 분석 실패", detail: err?.message });
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

    const prompt = `당신은 청각장애인과 언어장애인을 위한 자막 요약 AI입니다.
아래는 실시간으로 인식된 발화 목록입니다:

${recent.map((t, i) => `${i + 1}. ${t}`).join("\n")}

다음 JSON 형식으로만 응답하세요:
{"summary":"쉬운 요약 문장","keywords":["단어1","단어2"]}

summary: 초등학생도 이해하는 1~2문장, 쉬운 단어만
keywords: 최대 5개, 각 1~4글자`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { maxOutputTokens: 8192, responseMimeType: "application/json" },
    });

    const raw = (response.text ?? "").trim();

    const parsed = safeParseJson(raw, { summary: "요약을 생성할 수 없습니다.", keywords: [] as string[] });

    res.json({
      summary: (parsed as any).summary ?? "요약 없음",
      keywords: Array.isArray((parsed as any).keywords) ? (parsed as any).keywords.slice(0, 5) : [],
    });
  } catch (err: any) {
    console.error("AI summarize error:", err);
    res.status(500).json({ error: "AI 요약 실패", detail: err?.message });
  }
});

export default router;
