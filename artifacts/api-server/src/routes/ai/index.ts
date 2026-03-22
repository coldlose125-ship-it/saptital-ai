import { Router } from "express";
import { ai } from "@workspace/integrations-gemini-ai";

const router = Router();

router.post("/api/ai/analyze", async (req, res) => {
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
{
  "topic": "짧은 주제 라벨 (2~5글자, 예: 음식 결정, 수업 공지, 일정 변경, 긴급 상황)",
  "tier": "일반 또는 중요 또는 핵심 또는 긴급 중 하나",
  "simpleSummary": "장애가 있는 분들이 쉽게 이해할 수 있도록 아주 짧고 간단한 1~2문장. 핵심만 담아 쉬운 단어로 작성."
}

tier 선택 기준:
- 긴급: 위험, 화재, 대피, 응급 등
- 핵심: 반드시 알아야 할 중요 정보
- 중요: 일정, 변경사항, 주의사항
- 일반: 일상적인 대화`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { maxOutputTokens: 512, responseMimeType: "application/json" },
    });

    const raw = response.text ?? "{}";
    let parsed: { topic: string; tier: string; simpleSummary: string };
    try {
      parsed = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : { topic: "일반", tier: "일반", simpleSummary: text };
    }

    res.json({
      topic: parsed.topic ?? "일반",
      tier: parsed.tier ?? "일반",
      simpleSummary: parsed.simpleSummary ?? text,
    });
  } catch (err: any) {
    console.error("AI analyze error:", err);
    res.status(500).json({ error: "AI 분석 실패", detail: err?.message });
  }
});

router.post("/api/ai/summarize", async (req, res) => {
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

다음 JSON 형식으로 정확히 응답하세요 (다른 텍스트 없이 JSON만):
{
  "summary": "전체 내용을 초등학생도 이해할 수 있는 아주 쉬운 한두 문장으로 요약. 어려운 단어 금지.",
  "keywords": ["핵심단어1", "핵심단어2", "핵심단어3"]
}

요약 원칙:
- 짧고 명확하게
- 쉬운 단어만 사용
- 가장 중요한 정보 중심
- keywords는 최대 5개, 각 1~4글자`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { maxOutputTokens: 512, responseMimeType: "application/json" },
    });

    const raw = response.text ?? "{}";
    let parsed: { summary: string; keywords: string[] };
    try {
      parsed = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : { summary: "요약을 생성할 수 없습니다.", keywords: [] };
    }

    res.json({
      summary: parsed.summary ?? "요약 없음",
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 5) : [],
    });
  } catch (err: any) {
    console.error("AI summarize error:", err);
    res.status(500).json({ error: "AI 요약 실패", detail: err?.message });
  }
});

export default router;
