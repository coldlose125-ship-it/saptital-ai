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
    const { text, context, locale } = req.body as {
      text: string;
      context?: string[];
      locale?: string;
    };

    if (!text || typeof text !== "string" || !text.trim()) {
      res.status(400).json({ error: "text is required" });
      return;
    }

    const isEn = locale === "en";
    const hasContext = context && context.length > 0;

    const contextBlock =
      hasContext
        ? isEn
          ? `\n\nPrevious conversation context:\n${context!.slice(-3).map((c, i) => `${i + 1}. ${c}`).join("\n")}`
          : `\n\n이전 대화 맥락:\n${context!.slice(-3).map((c, i) => `${i + 1}. ${c}`).join("\n")}`
        : "";

    const prompt = isEn
      ? `You are a professional medical interpreter AI helping hearing-impaired patients.
Analyze what the doctor said so the patient can understand it clearly.

Doctor speech: "${text}"${contextBlock}

Respond ONLY in this exact JSON format:
{
  "simpleSummary": "Explain in 1-2 simple sentences anyone can understand (fix any speech recognition errors)",
  "medical_terms": [{"term": "difficult medical term", "explanation": "simple one-sentence patient-friendly explanation"}],
  "sentiment": "positive or neutral or negative",
  "suggested_replies": ["Patient reply 1", "Patient reply 2", "Patient reply 3"],
  "topic": "2-5 word medical topic (e.g. Prescription, Test Results, Medication, Side Effects)",
  "tier": "normal or important or critical or urgent",
  "keywords": ["keyword1", "keyword2"],
  "topicChanged": false
}

Rules:
- simpleSummary: fix speech recognition errors, use plain simple language
- medical_terms: only difficult terms, empty array [] if none
- sentiment: positive (reassuring/good news), negative (warning/serious), neutral (general info)
- suggested_replies: exactly 3 short replies from the patient perspective
- tier: urgent (emergency), critical (major treatment decision), important (prescription/schedule), normal (routine info)
- topicChanged: true if topic changed from prior context${!hasContext ? ", false if no prior context" : ""}`
      : `너는 청각장애인 환자를 돕는 전문 의료 통역 AI야.
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

    const enFallback = {
      simpleSummary: text,
      medical_terms: [] as { term: string; explanation: string }[],
      sentiment: "neutral",
      suggested_replies: [
        "Yes, I understand",
        "Could you please explain again",
        "Can I ask for more details",
      ],
      topic: "Consultation",
      tier: "normal",
      keywords: [] as string[],
      topicChanged: false,
    };

    const koFallback = {
      simpleSummary: text,
      medical_terms: [] as { term: string; explanation: string }[],
      sentiment: "neutral",
      suggested_replies: [
        "\ub124, \uc774\ud574\ud588\uc2b5\ub2c8\ub2e4",
        "\ub2e4\uc2dc \ud55c\ubc88 \uc124\uba85\ud574 \uc8fc\uc138\uc694",
        "\ub354 \uc790\uc138\ud788 \uc54c \uc218 \uc788\uc744\uae4c\uc694?",
      ],
      topic: "\uc9c4\ub8cc",
      tier: "\uc77c\ubc18",
      keywords: [] as string[],
      topicChanged: false,
    };

    const fallback = isEn ? enFallback : koFallback;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { maxOutputTokens: 8192, responseMimeType: "application/json" },
    });

    const raw = (response.text ?? "").trim();
    const parsed = safeParseJson(raw, fallback);

    const validTiers = isEn
      ? ["normal", "important", "critical", "urgent"]
      : ["\uc77c\ubc18", "\uc911\uc694", "\ud575\uc2ec", "\uae34\uae09"];

    res.json({
      simpleSummary: (parsed as any).simpleSummary ?? text,
      medical_terms: Array.isArray((parsed as any).medical_terms)
        ? (parsed as any).medical_terms
        : [],
      sentiment: ["positive", "neutral", "negative"].includes(
        (parsed as any).sentiment
      )
        ? (parsed as any).sentiment
        : "neutral",
      suggested_replies: Array.isArray((parsed as any).suggested_replies)
        ? (parsed as any).suggested_replies.slice(0, 3)
        : fallback.suggested_replies,
      topic: (parsed as any).topic ?? fallback.topic,
      tier: validTiers.includes((parsed as any).tier)
        ? (parsed as any).tier
        : fallback.tier,
      keywords: Array.isArray((parsed as any).keywords)
        ? (parsed as any).keywords.slice(0, 4)
        : [],
      topicChanged: Boolean((parsed as any).topicChanged),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[AI analyze]", msg);
    res.status(500).json({ error: "AI analysis failed", detail: msg });
  }
});

router.post("/ai/summarize", async (req, res) => {
  try {
    const { transcripts, locale } = req.body as {
      transcripts: string[];
      locale?: string;
    };

    if (
      !transcripts ||
      !Array.isArray(transcripts) ||
      transcripts.length === 0
    ) {
      res.status(400).json({ error: "transcripts is required" });
      return;
    }

    const isEn = locale === "en";
    const recent = transcripts.slice(-8);

    const prompt = isEn
      ? `You are a professional medical interpreter AI helping hearing-impaired patients.
Below are things the doctor said during the consultation:

${recent.map((t, i) => `${i + 1}. ${t}`).join("\n")}

Respond ONLY in this JSON format:
{"summary":"Summarize today's consultation in 1-2 simple sentences the patient can understand","keywords":["keyword1","keyword2"]}

summary: plain language summary of the key points from today's consultation
keywords: up to 5 key medical words`
      : `너는 청각장애인 환자를 돕는 전문 의료 통역 AI야.
아래는 진료실에서 의사가 말한 내용들이야:

${recent.map((t, i) => `${i + 1}. ${t}`).join("\n")}

다음 JSON 형식으로만 응답해:
{"summary":"\uc624\ub298 \uc9c4\ub8cc \ub0b4\uc6a9\uc744 \ud658\uc790\uac00 \uc774\ud574\ud558\uae30 \uc27d\uac8c 1~2\ubb38\uc7a5\uc73c\ub85c \uc694\uc57d","keywords":["\ud575\uc2ec\ub2e8\uc5b41","\ud575\uc2ec\ub2e8\uc5b42"]}

summary: \ucd08\ub4f1\ud559\uc0dd\ub3c4 \uc774\ud574\ud558\ub294 \uc27d\uc740 \ub9d0\ub85c \uc624\ub298 \uc9c4\ub8cc\uc758 \ud575\uc2ec \ub0b4\uc6a9 \uc694\uc57d
keywords: \ucd5c\ub300 5\uac1c \ud575\uc2ec \uc758\ub8cc \ub2e8\uc5b4`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { maxOutputTokens: 8192, responseMimeType: "application/json" },
    });

    const raw = (response.text ?? "").trim();
    const parsed = safeParseJson(raw, {
      summary: isEn
        ? "Unable to summarize consultation."
        : "\uc9c4\ub8cc \ub0b4\uc6a9\uc744 \uc694\uc57d\ud560 \uc218 \uc5c6\uc2b5\ub2c8\ub2e4.",
      keywords: [] as string[],
    });

    res.json({
      summary:
        (parsed as any).summary ??
        (isEn
          ? "Unable to summarize."
          : "\uc694\uc57d\ud560 \uc218 \uc5c6\uc2b5\ub2c8\ub2e4."),
      keywords: Array.isArray((parsed as any).keywords)
        ? (parsed as any).keywords.slice(0, 5)
        : [],
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[AI summarize]", msg);
    res.status(500).json({ error: "AI summarize failed", detail: msg });
  }
});

export default router;
