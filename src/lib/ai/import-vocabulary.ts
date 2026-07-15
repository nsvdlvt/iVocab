import { z } from "zod";
import { LRUCache } from "@/lib/utils/lruCache";
import { AIValidationError, AIResponseError, AIAbortError, AINetworkError } from "@/lib/ai/errors";
import { buildImportPrompt } from "@/lib/ai/prompts/import-vocabulary";
import { performance } from "perf_hooks";
import { extractJsonPayload, requestTextResponse } from "@/lib/ai/json-response";

export const importVocabItemSchema = z.object({
  word: z.string().min(1),
  ipa: z.string().nullish().transform((v) => v ?? ""),
  meaning: z.string().nullish().transform((v) => v ?? ""),
  partOfSpeech: z.string().nullish().transform((v) => v ?? ""),
  exampleSentence: z.string().nullish().transform((v) => v ?? ""),
  synonyms: z.array(z.string()).nullish().transform((v) => v ?? []),
  topic: z.string().nullish().transform((v) => v ?? ""),
});

export const importVocabListSchema = z.array(importVocabItemSchema);
export type AIVocabItem = z.infer<typeof importVocabItemSchema>;

const importCache = new LRUCache<string, AIVocabItem[]>(100);

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeWord(word: string): string {
  return normalizeWhitespace(word).toLowerCase().normalize("NFC");
}

function dedupeStrings(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  const seen = new Set<string>();
  return values
    .map((value) => normalizeWhitespace(String(value ?? "")))
    .filter(Boolean)
    .filter((value) => {
      const key = normalizeWord(value);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function standardizeItem(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const obj = { ...(raw as Record<string, unknown>) };
  obj.word = normalizeWhitespace(String(obj.word ?? ""));
  obj.ipa = normalizeWhitespace(String(obj.ipa ?? ""));
  obj.meaning = normalizeWhitespace(String(obj.meaning ?? ""));
  obj.partOfSpeech = normalizeWhitespace(String(obj.partOfSpeech ?? ""));
  obj.exampleSentence = normalizeWhitespace(String(obj.exampleSentence ?? ""));
  obj.synonyms = dedupeStrings(obj.synonyms);
  obj.topic = normalizeWhitespace(String(obj.topic ?? ""));
  return obj;
}

function standardizeList(raw: unknown): unknown {
  if (!Array.isArray(raw)) return raw;
  const seen = new Set<string>();
  return raw
    .map((item) => standardizeItem(item))
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .filter((item) => {
      const key = normalizeWord(String(item.word ?? ""));
      if (!key) return false;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

async function singleRequest(prompt: string, signal?: AbortSignal): Promise<AIVocabItem[]> {
  const requestStart = performance.now();
  const rawText = await requestTextResponse(prompt, signal);
  const aiRequestMs = performance.now() - requestStart;

  const parsingStart = performance.now();
  const parsed = extractJsonPayload(rawText);
  const parsingMs = performance.now() - parsingStart;

  const validationStart = performance.now();
  const standardized = standardizeList(parsed);
  const validated = importVocabListSchema.safeParse(standardized);
  const validationMs = performance.now() - validationStart;

  if (!validated.success) {
    throw new AIValidationError(`Zod Validation Error: ${validated.error.message}`);
  }

  if (process.env.NODE_ENV === "development") {
    console.log("[AI Import] Text timings", {
      aiRequestMs: Math.round(aiRequestMs),
      parsingMs: Math.round(parsingMs),
      validationMs: Math.round(validationMs),
    });
  }

  return validated.data;
}

export async function importVocabulary(input: string, imageFileBase64?: string, signal?: AbortSignal): Promise<AIVocabItem[]> {
  const overallStart = performance.now();
  const cacheKey = imageFileBase64 ? `img:${imageFileBase64.substring(0, 100)}` : `prompt:${input}`;
  const cached = importCache.get(cacheKey);
  if (cached) return cached;

  if (imageFileBase64) {
    throw new AIResponseError("Current provider does not support image import.");
  }

  const promptStart = performance.now();
  const prompt = buildImportPrompt(input);
  const promptGenerationMs = performance.now() - promptStart;

  const result = await singleRequest(prompt, signal).catch((err) => {
    if (err instanceof AIAbortError || err instanceof AINetworkError || err instanceof AIValidationError || err instanceof AIResponseError) {
      throw err;
    }
    throw new AIResponseError("KhÃƒÂ´ng thÃ¡Â»Æ’ tÃ¡ÂºÂ¡o danh sÃƒÂ¡ch tÃ¡Â»Â« vÃ¡Â»Â±ng. Vui lÃƒÂ²ng thÃ¡Â»Â­ lÃ¡ÂºÂ¡i.");
  });

  importCache.set(cacheKey, result);
  if (process.env.NODE_ENV === "development") {
    console.log("[AI Import] Prompt generation", Math.round(promptGenerationMs), "ms");
    console.log("[AI Import] Total text import", Math.round(performance.now() - overallStart), "ms");
  }
  return result;
}

export async function enrichVocabulary(...args: unknown[]): Promise<never> {
  void args;
  throw new AIResponseError("KhÃƒÂ´ng hÃ¡Â»â€” trÃ¡Â»Â£ lÃƒÂ m giÃƒÂ u dÃ¡Â»Â¯ liÃ¡Â»â€¡u trong chÃ¡ÂºÂ¿ Ã„â€˜Ã¡Â»â„¢ rÃƒÂºt gÃ¡Â»Ân nÃƒÂ y.");
}
