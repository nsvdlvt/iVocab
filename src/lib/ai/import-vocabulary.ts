import { z } from "zod";
import { LRUCache } from "@/lib/utils/lruCache";
import {
  AIValidationError,
  AIResponseError,
  AIAbortError,
  AINetworkError,
} from "@/lib/ai/errors";
import {
  buildImportPrompt,
  ImportPromptOptions,
} from "@/lib/ai/prompts/import-vocabulary";
import { performance } from "perf_hooks";
import {
  extractJsonPayload,
  requestTextResponse,
} from "@/lib/ai/json-response";

export const importVocabItemSchema = z.object({
  word: z.string().min(1),
  ipa: z.string().nullish().transform((v) => v ?? ""),
  meaning: z.string().nullish().transform((v) => v ?? ""),
  partOfSpeech: z.string().nullish().transform((v) => v ?? ""),
  exampleSentence: z.string().nullish().transform((v) => v ?? ""),
  exampleTranslation: z.string().nullish().transform((v) => v ?? ""),
  synonyms: z.array(z.string()).nullish().transform((v) => v ?? []),
  topic: z.string().nullish().transform((v) => v ?? ""),
});

export const importVocabListSchema = z.array(importVocabItemSchema);
export type AIVocabItem = z.infer<typeof importVocabItemSchema>;

export interface ImportVocabularyOptions {
  prompt: string;
  mode?: "topic" | "passage" | "words";
  count?: number;
  level?: string;
  tone?: string;
  signal?: AbortSignal;
}

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
  obj.exampleSentence = normalizeWhitespace(
    String(obj.exampleSentence ?? obj.example ?? "")
  );
  obj.exampleTranslation = normalizeWhitespace(
    String(
      obj.exampleTranslation ??
        obj.example_translation ??
        obj.exampleVi ??
        obj.translation ??
        ""
    )
  );
  obj.synonyms = dedupeStrings(obj.synonyms);
  obj.topic = normalizeWhitespace(String(obj.topic ?? ""));
  return obj;
}

function standardizeList(raw: unknown): unknown {
  if (!Array.isArray(raw)) return raw;
  const seen = new Set<string>();
  return raw
    .map((item) => standardizeItem(item))
    .filter(
      (item): item is Record<string, unknown> =>
        !!item && typeof item === "object"
    )
    .filter((item) => {
      const key = normalizeWord(String(item.word ?? ""));
      if (!key) return false;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

async function singleRequest(
  prompt: string,
  signal?: AbortSignal
): Promise<AIVocabItem[]> {
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
    throw new AIValidationError(
      `Zod Validation Error: ${validated.error.message}`
    );
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

export async function importVocabulary(
  inputOrOptions: string | ImportVocabularyOptions,
  legacyImageFileBase64?: string,
  legacySignal?: AbortSignal
): Promise<AIVocabItem[]> {
  const overallStart = performance.now();

  const isOptions =
    typeof inputOrOptions === "object" && inputOrOptions !== null;
  const promptText = isOptions ? inputOrOptions.prompt : inputOrOptions;
  const signal = isOptions ? inputOrOptions.signal : legacySignal;

  const promptOptions: ImportPromptOptions = isOptions
    ? {
        input: inputOrOptions.prompt,
        mode: inputOrOptions.mode,
        count: inputOrOptions.count,
        level: inputOrOptions.level,
        tone: inputOrOptions.tone,
      }
    : { input: inputOrOptions };

  const cacheKey = `opt:${JSON.stringify(promptOptions)}`;
  const cached = importCache.get(cacheKey);
  if (cached) return cached;

  const promptStart = performance.now();
  const prompt = buildImportPrompt(promptOptions);
  const promptGenerationMs = performance.now() - promptStart;

  const result = await singleRequest(prompt, signal).catch((err) => {
    if (
      err instanceof AIAbortError ||
      err instanceof AINetworkError ||
      err instanceof AIValidationError ||
      err instanceof AIResponseError
    ) {
      throw err;
    }
    const message = err instanceof Error ? err.message : String(err);
    throw new AIResponseError(
      `Không thể tạo danh sách từ vựng từ AI (${message}). Vui lòng thử lại.`
    );
  });

  importCache.set(cacheKey, result);
  if (process.env.NODE_ENV === "development") {
    console.log(
      "[AI Import] Prompt generation",
      Math.round(promptGenerationMs),
      "ms"
    );
    console.log(
      "[AI Import] Total text import",
      Math.round(performance.now() - overallStart),
      "ms"
    );
  }
  return result;
}

export async function enrichVocabulary(
  item: {
    word: string;
    meaning?: string;
    ipa?: string;
    partOfSpeech?: string;
    exampleSentence?: string;
    synonyms?: string[];
  },
  missingFields: string[],
  signal?: AbortSignal
): Promise<Record<string, unknown>> {
  const prompt = `Return strict JSON only.
You are an English-Vietnamese vocabulary expert.
Provide missing vocabulary fields for the English word: "${item.word}".
Current available info:
- Word: ${item.word}
${item.meaning ? `- Current Meaning: ${item.meaning}` : ""}
${item.partOfSpeech ? `- Part of Speech: ${item.partOfSpeech}` : ""}

Missing fields to generate: ${missingFields.join(", ")}.

Requirements:
- "ipa": standard IPA between slashes, e.g. "/.../".
- "meaning": Concise Vietnamese meaning (2-6 words, flashcard-friendly, NEVER English).
- "partOfSpeech": noun, verb, adjective, adverb, or phrasal verb.
- "exampleSentence": natural CEFR B1-B2 English sentence (8-16 words).
- "synonyms": array of 2-4 English synonyms.

Return JSON object containing ONLY the requested missing fields:
{
  ${missingFields.map((f) => `"${f}": ...`).join(",\n  ")}
}`;

  const rawText = await requestTextResponse(prompt, signal);
  const parsed = extractJsonPayload(rawText);
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    return parsed as Record<string, unknown>;
  }
  throw new AIResponseError("Phản hồi làm giàu từ vựng không hợp lệ.");
}
