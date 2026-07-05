// src/lib/ai/prompts/sentence-practice.ts
/**
 * Prompt builder for the Sentence Practice AI service.
 * Provides a system prompt with detailed instructions and a user prompt with the sentence.
 */

export interface PromptOptions {
  targetWord: string;
  meaning?: string;
  partOfSpeech?: string;
  language?: string; // e.g., "Vietnamese"
  strict?: boolean;
}

export function buildSystemPrompt(opts: PromptOptions): string {
  const { targetWord, meaning, partOfSpeech, language = "Vietnamese", strict = true } = opts;
  const metaLines = [] as string[];
  metaLines.push(`Target word: "${targetWord}"`);
  if (meaning) metaLines.push(`Meaning: ${meaning}`);
  if (partOfSpeech) metaLines.push(`Part of speech: ${partOfSpeech}`);
  metaLines.push(`Feedback language: ${language}`);
  metaLines.push(`Strict JSON output: ${strict ? "yes" : "no"}`);

  const metaSection = metaLines.map((l) => `- ${l}`).join("\n");

  return `You are an AI writing coach.

${metaSection}

Your task is to evaluate the user's English sentence. First, check if the user has used the target word "${targetWord}" (or a valid inflected form of it, e.g. plurals, tense inflections, gerunds, etc.) in their sentence.

Return **strict JSON only** that adheres to the following schema:
{
  "usedTargetWord": boolean,
  "message": "string (only if usedTargetWord is false. Set it to 'Bạn chưa sử dụng từ \"${targetWord}\" trong câu của mình. Hãy thử đặt lại câu có chứa từ này.')",
  "feedback": "string (general assessment of the sentence in Vietnamese, only if usedTargetWord is true)",
  "mistakes": [
    { "type": "string", "start": number, "end": number, "confidence": number }
  ],
  "correctedSentence": "string (only if usedTargetWord is true)",
  "alternativeSentences": ["string"] (only if usedTargetWord is true),
  "explanation": "string (detailed analysis in Vietnamese for 5 categories, only if usedTargetWord is true)"
}

Guidelines for JSON Output:
1. If "usedTargetWord" is false:
   - "usedTargetWord" must be false.
   - "message" must be exactly: "Bạn chưa sử dụng từ \"${targetWord}\" trong câu của mình. Hãy thử đặt lại câu có chứa từ này."
   - "feedback", "correctedSentence", "alternativeSentences", "explanation" can be omitted or set to empty string.
   - "mistakes" must be an empty array [].
2. If "usedTargetWord" is true:
   - "usedTargetWord" must be true.
   - "feedback" must contain a general assessment of the sentence in Vietnamese.
   - The "explanation" field must contain a detailed analysis for 5 categories (Grammar, Vocabulary, Naturalness, Context, Richness) in Vietnamese. Structure each category exactly like:
     ### [Category Name]
     - Điểm: [Score]/10
     - Nhận xét: [Detailed explanation]
     - Sửa lỗi: [Correction if needed, otherwise "Không"]
     - Lý do: [Reason / grammar rule]
   - The "mistakes" array lists specific errors. For each mistake, the "type" field must be structured exactly with the "|" delimiter:
     Error Type | Original Text | Correct Version | Why It Is Wrong | How To Avoid | Correct Usage Example
     All parts of this "type" string (except English sentences themselves) must be in Vietnamese.
     Example:
     Tense Error | The storm abate yesterday | The storm abated yesterday | Trạng từ "yesterday" chỉ thời gian quá khứ nên động từ phải chia quá khứ | Dùng thì quá khứ đơn khi có trạng từ chỉ thời gian quá khứ | The storm abated yesterday after hours of rain.
   - Keep all explanation and analysis in Vietnamese. Only the example sentences/original/corrected texts must be in English.
`;
}

export function buildUserPrompt(sentence: string): string {
  return `Sentence: "${sentence}"`;
}
