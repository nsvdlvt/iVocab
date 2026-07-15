import { aiQuizSchema, type AiQuizPayload } from "@/lib/ai/schemas/ai-quiz";
import { buildAiQuizPrompt, type AiQuizVocabularyItem } from "@/lib/ai/prompts/ai-quiz";
import { AIResponseError, AIValidationError } from "@/lib/ai/errors";
import { extractJsonPayload, requestTextResponse } from "@/lib/ai/json-response";

export async function generateAiQuiz(items: AiQuizVocabularyItem[], signal?: AbortSignal): Promise<AiQuizPayload> {
  if (items.length === 0) {
    throw new AIResponseError("Không có dữ liệu từ vựng để tạo bài AI Quiz.");
  }

  const prompt = buildAiQuizPrompt(items);
  const maxAttempts = 2;
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const rawText = await requestTextResponse(prompt, signal);
      const parsed = extractJsonPayload(rawText);
      const validated = aiQuizSchema.safeParse(parsed);
      if (!validated.success) {
        throw new AIValidationError(`Invalid AI quiz response: ${validated.error.message}`);
      }
      return validated.data;
    } catch (error) {
      lastError = error;
      if (error instanceof AIResponseError || error instanceof AIValidationError) {
        if (attempt < maxAttempts) continue;
        throw error;
      }
      throw error;
    }
  }

  throw lastError instanceof Error ? lastError : new AIResponseError("Failed to generate AI quiz.");
}
