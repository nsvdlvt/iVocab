// src/lib/ai/sentence-practice.ts
import { request as responsesRequest } from "@/lib/ai/responsesClient";
import { buildSystemPrompt, buildUserPrompt, PromptOptions } from "@/lib/ai/prompts/sentence-practice";
import { LRUCache } from "@/lib/utils/lruCache";
import { sentenceFeedbackSchema, SentenceFeedback } from "@/lib/ai/schemas/sentence-feedback";
import { AIValidationError, AIResponseError, AIAbortError, AINetworkError } from "@/lib/ai/errors";

/**
 * In‑memory LRU cache for recent feedback results.
 * The key is a deterministic string composed of stable primitive values.
 */
const cache = new LRUCache<string, SentenceFeedback>(100);

/**
 * Build a deterministic cache key.
 */
function makeCacheKey(opts: {
  targetWord: string;
  sentence: string;
  language?: string;
  strict?: boolean;
}): string {
  const { targetWord, sentence, language = "Vietnamese", strict = true } = opts;
  // Escape newlines to keep the key single‑line.
  const esc = (str: string) => str.replace(/\n/g, "\\n");
  return `${esc(targetWord)}|${esc(sentence)}|${language}|${strict}`;
}

/**
 * Evaluate a user‑written sentence for the given target vocabulary word.
 *
 * This function is fully UI‑agnostic. It validates the sentence locally,
 * checks the cache, calls the Responses API, validates the JSON response with Zod,
 * retries on validation failure, and returns the parsed feedback object.
 *
 * Errors are thrown as typed classes so the UI layer can handle them
 * appropriately.
 */
export async function evaluateWriting(
  targetWord: string,
  sentence: string,
  options?: {
    meaning?: string;
    partOfSpeech?: string;
    language?: string;
    strict?: boolean;
    abortSignal?: AbortSignal;
  }
): Promise<SentenceFeedback> {
  const { meaning, partOfSpeech, language, strict, abortSignal } = options ?? {};
  console.log(`evaluateWriting: Starting evaluation. Target: "${targetWord}", Sentence: "${sentence}"`);

  // ----- 1. Deterministic cache lookup -----
  const cacheKey = makeCacheKey({ targetWord, sentence, language, strict });
  console.log(`evaluateWriting: [2] Checking cache. Key: "${cacheKey}"`);
  const cached = cache.get(cacheKey);
  if (cached) {
    console.log("evaluateWriting: Cache hit! Returning cached result");
    return cached;
  }
  console.log("evaluateWriting: Cache miss");

  // ----- 3. Build prompts -----
  console.log("evaluateWriting: [3] Building system and user prompts");
  const promptOptions: PromptOptions = {
    targetWord,
    meaning,
    partOfSpeech,
    language,
    strict,
  };
  const systemPrompt = buildSystemPrompt(promptOptions);
  const userPrompt = buildUserPrompt(sentence);
  console.log(`evaluateWriting: System Prompt length: ${systemPrompt.length}, User Prompt length: ${userPrompt.length}`);

  const payload = {
    input: `${systemPrompt}\n\n${userPrompt}`,
  };

  // ----- 4. Call API with retry -----
  const maxAttempts = 3;
  let attempt = 0;
  let lastError: unknown = null;

  while (attempt < maxAttempts) {
    attempt++;
    console.log(`evaluateWriting: [4] OpenAI request attempt ${attempt}/${maxAttempts}`);
    try {
      const rawResponse = await responsesRequest<{ content?: string; [key: string]: unknown }>(payload, abortSignal);
      console.log(`evaluateWriting: Responses API returned response. Type: ${typeof rawResponse}`);

      // Responses API may return the raw string directly or an object with a `content` field.
      const rawContent: string =
        typeof rawResponse === "string"
          ? rawResponse
          : rawResponse.content ?? JSON.stringify(rawResponse);

      console.log(`evaluateWriting: Raw content to validate (first 100 chars): ${rawContent.substring(0, 100)}...`);

      // Parse and validate JSON using the shared Zod schema.
      console.log("evaluateWriting: [5] Parsing and validating raw response with Zod");
      const parsed = sentenceFeedbackSchema.safeParse(JSON.parse(rawContent));
      if (parsed.success) {
        console.log("evaluateWriting: Validation succeeded. Storing to cache.");
        cache.set(cacheKey, parsed.data);
        return parsed.data;
      }
      // Validation failed – prepare to retry.
      console.error("evaluateWriting: Zod validation failed. Error:", JSON.stringify(parsed.error.format()));
      lastError = new AIValidationError(`Response validation failed: ${JSON.stringify(parsed.error.format())}`);
    } catch (err: unknown) {
      console.error(`evaluateWriting: Error in attempt ${attempt}:`, err);
      // Propagate typed errors directly; otherwise wrap.
      if (err instanceof AIResponseError || err instanceof AINetworkError || err instanceof AIAbortError || err instanceof AIValidationError) {
        lastError = err;
        // Abort or network errors should not be retried.
        if (err instanceof AIAbortError || err instanceof AINetworkError) {
          console.warn("evaluateWriting: Aborting retry loop due to abort/network error.");
          break;
        }
      } else {
        const errMsg = err instanceof Error ? err.message : String(err);
        lastError = new AIResponseError(`Unexpected error during evaluation: ${errMsg}`);
      }
    }
  }

  // After exhausting retries, throw the last captured error.
  console.error("evaluateWriting: All attempts exhausted. Throwing error.");
  throw lastError ?? new AIResponseError("Failed to evaluate sentence after multiple attempts");
}
