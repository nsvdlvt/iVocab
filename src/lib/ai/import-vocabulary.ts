// src/lib/ai/import-vocabulary.ts

import { request as responsesRequest, InputPart } from '@/lib/ai/responsesClient';
import { z } from 'zod';
import { LRUCache } from '@/lib/utils/lruCache';
import { AIValidationError, AIResponseError, AIAbortError, AINetworkError } from '@/lib/ai/errors';
import { buildImportPrompt } from '@/lib/ai/prompts/import-vocabulary';

/** Core Zod Schemas */
export const importVocabItemSchema = z.object({
  word: z.string().min(1),
  originalWord: z.string().nullish().transform(v => v ?? ''),
  ipa: z.string().nullish().transform(v => v ?? ''),
  partOfSpeech: z.string().nullish().transform(v => v ?? ''),
  meaning: z.string().nullish().transform(v => v ?? ''),
  exampleSentence: z.string().nullish().transform(v => v ?? ''),
  exampleMeaning: z.string().nullish().transform(v => v ?? ''),
  synonym: z.string().nullish().transform(v => v ?? ''),
  antonym: z.string().nullish().transform(v => v ?? ''),
  collocations: z.string().nullish().transform(v => v ?? ''),
  level: z.string().nullish().transform(v => v ?? ''),
  difficulty: z.string().nullish().transform(v => v ?? ''),
  frequency: z.string().nullish().transform(v => v ?? ''),
  topic: z.string().nullish().transform(v => v ?? ''),
  wordFamily: z.array(z.string()).nullish().transform(v => v ?? []),
  phonics: z.string().nullish().transform(v => v ?? ''),
  exampleDifficulty: z.string().nullish().transform(v => v ?? ''),
  note: z.string().nullish().transform(v => v ?? ''),
});

export const importVocabListSchema = z.array(importVocabItemSchema);
export type AIVocabItem = z.infer<typeof importVocabItemSchema>;

// In‑memory cache for the session
const importCache = new LRUCache<string, AIVocabItem[]>(100);

export const MAX_ITEMS_PER_CHUNK = 200; // default chunk size

/** Normalise a word for duplicate detection */
export function normalizeWord(word: string): string {
  return word.toLowerCase().trim().normalize('NFC').replace(/\s+/g, ' ');
}

/** Simple token estimator – 1 token ≈ 4 characters */
function estimatedTokens(input: string): number {
  return Math.ceil(input.length / 4);
}
/** Estimate number of vocabulary items (lines) in the input */
function estimatedItems(input: string): number {
  return input.split(/\r?\n/).filter(l => l.trim().length > 0).length;
}
/** Determine whether chunking is required */
function shouldChunk(input: string): boolean {
  const TOKEN_LIMIT = 6000;
  const CHAR_LIMIT = 20000;
  const ITEM_LIMIT = 300;
  return (
    estimatedTokens(input) > TOKEN_LIMIT ||
    input.length > CHAR_LIMIT ||
    estimatedItems(input) > ITEM_LIMIT
  );
}
/** Enforce hard item limit (1000) */
function enforceHardLimit(input: string): void {
  const HARD_ITEM_LIMIT = 1000;
  if (estimatedItems(input) > HARD_ITEM_LIMIT) {
    throw new AIResponseError('Dữ liệu quá lớn: vui lòng giảm lượng từ vựng (tối đa 1000 mục).');
  }
}

/** 
 * Normalize AI Response fields before Zod validation.
 * Handles arrays for string fields and mixed wordFamily formats.
 */
function normalizeImportVocabularyResponse(data: unknown): unknown {
  if (Array.isArray(data)) {
    return data.map(item => normalizeImportVocabularyResponse(item));
  }
  
  if (data && typeof data === 'object') {
    const obj = { ...data } as Record<string, unknown>;
    
    // Convert array to comma-separated string for specific fields
    const arrayToStringFields = ['synonym', 'antonym', 'collocations'];
    for (const field of arrayToStringFields) {
      if (Array.isArray(obj[field])) {
        obj[field] = obj[field].filter(v => typeof v === 'string').join(', ');
      }
    }

    // Handle wordFamily: can be ["run", "runner"] or [{ word: "run", type: "verb" }]
    if (Array.isArray(obj.wordFamily)) {
      obj.wordFamily = obj.wordFamily.map(wf => {
        if (typeof wf === 'string') return wf;
        if (wf && typeof wf === 'object' && 'word' in wf) return String((wf as Record<string, unknown>).word);
        return String(wf);
      });
    }

    // Ensure nulls become undefined or empty strings so transform can catch them
    for (const key of Object.keys(obj)) {
      if (obj[key] === null) {
        obj[key] = "";
      }
    }
    
    return obj;
  }
  return data;
}

/** Main import function */
export async function importVocabulary(
  input: string,
  imageFileBase64?: string,
  signal?: AbortSignal
): Promise<AIVocabItem[]> {
  const cacheKey = imageFileBase64 ? `img:${imageFileBase64.substring(0, 100)}` : `prompt:${input}`;
  const cached = importCache.get(cacheKey);
  if (cached) {
    console.log('importVocabulary: Session Cache Hit!');
    return cached;
  }

  // Image import – always single vision request, never chunked
  if (imageFileBase64) {
    const systemPrompt = buildImportPrompt(input, true);
    const payload: InputPart[] = [
      { type: 'text', text: systemPrompt },
      { type: 'image_base64', image_base64: imageFileBase64 },
    ];
    const result = await singleRequest(payload, signal);
    importCache.set(cacheKey, result);
    return result;
  }

  // Enforce hard limit for any input
  enforceHardLimit(input);

  // Chunking fallback when any threshold is exceeded
  if (shouldChunk(input)) {
    const chunks = splitInputIntoChunks(input);
    const allResults: AIVocabItem[] = [];
    for (const chunk of chunks) {
      const systemPrompt = buildImportPrompt(chunk, false);
      const chunkResult = await singleRequest(systemPrompt, signal);
      allResults.push(...chunkResult);
    }
    importCache.set(cacheKey, allResults);
    return allResults;
  }

  // Normal single‑request path
  const systemPrompt = buildImportPrompt(input, false);
  const result = await singleRequest(systemPrompt, signal);
  importCache.set(cacheKey, result);
  return result;
}

/** Perform a single API request */
async function singleRequest(
  payloadInput: string | InputPart[],
  signal?: AbortSignal
): Promise<AIVocabItem[]> {
  const maxAttempts = 2; // Retry ONLY once for transient failures
  let attempt = 0;
  
  while (attempt < maxAttempts) {
    attempt++;
    console.log(`importVocabulary: API request attempt ${attempt}/${maxAttempts}`);
    try {
      const response = await responsesRequest<{ content?: string }>({ input: payloadInput }, signal);
      const rawText = typeof response === 'string' ? response : response.content ?? JSON.stringify(response);
      const cleanJsonText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const parsed = JSON.parse(cleanJsonText);
      const normalized = normalizeImportVocabularyResponse(parsed);
      const validated = importVocabListSchema.safeParse(normalized);
      
      if (validated.success) {
        return validated.data;
      }
      
      console.warn('importVocabulary: Zod parsing failed:', validated.error);
      // DO NOT retry on validation failure
      throw new AIValidationError(`Zod Validation Error: ${validated.error.message}`);
    } catch (err) {
      console.error(`importVocabulary: Attempt ${attempt} failed:`, err);
      
      const isTransient = err instanceof AIAbortError || err instanceof AINetworkError || (err instanceof AIResponseError && (err.message.includes('502') || err.message.includes('504')));
      
      if (isTransient && attempt < maxAttempts) {
        console.log(`Transient error detected. Retrying... (${attempt}/${maxAttempts})`);
        continue; // Retry
      }
      
      if (err instanceof AIAbortError) {
        throw new AIResponseError('Máy chủ AI hiện đang bận. Vui lòng thử lại sau.');
      }
      
      // If we exhausted attempts or it's a non-transient error (like validation/JSON error), bubble it up
      throw err instanceof Error ? err : new AIResponseError('Không thể tạo danh sách từ vựng. Vui lòng thử lại hoặc giảm kích thước đầu vào.');
    }
  }
  
  throw new AIResponseError('Máy chủ AI hiện đang bận. Vui lòng thử lại sau.');
}

/** Split oversized input into chunks */
function splitInputIntoChunks(input: string): string[] {
  const lines = input
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);
  if (lines.length <= MAX_ITEMS_PER_CHUNK) {
    return [input];
  }
  const chunks: string[] = [];
  for (let i = 0; i < lines.length; i += MAX_ITEMS_PER_CHUNK) {
    const chunkLines = lines.slice(i, i + MAX_ITEMS_PER_CHUNK);
    chunks.push(chunkLines.join('\n'));
  }
  return chunks;
}

/** Enrich missing fields for a given vocab item */
export async function enrichVocabulary(
  item: AIVocabItem,
  missingFields: string[],
  signal?: AbortSignal
): Promise<Partial<AIVocabItem>> {
  const fieldsPrompt = missingFields.join(', ');
  const prompt = `You are a professional vocabulary builder.
Given the word "${item.word}" (meaning: "${item.meaning}", part of speech: "${item.partOfSpeech || ''}"), generate ONLY the following missing fields: ${fieldsPrompt}.

Rules:
- Do NOT generate or overwrite fields that were not explicitly listed.
- Make sure explanations, notes, topics, synonyms, antonyms, collocations are in Vietnamese.
- Example sentences and IPA must be in English.

Return STRICT JSON complying with this partial schema:
{
  ${missingFields.map(f => `"${f}": "generated value"`).join(',\n  ')}
}
Do not include any other markdown formatting.`;

  const maxAttempts = 2; // Only retry transient errors
  let attempt = 0;
  
  while (attempt < maxAttempts) {
    attempt++;
    try {
      const response = await responsesRequest<{ content?: string }>({ input: prompt }, signal);
      const rawText = typeof response === 'string' ? response : response.content ?? JSON.stringify(response);
      const cleanJsonText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const parsed = JSON.parse(cleanJsonText);
      const normalized = normalizeImportVocabularyResponse(parsed);
      
      const partialSchema = z.object(
        missingFields.reduce((acc, field) => {
          if (field === 'wordFamily') {
            acc[field] = z.array(z.string()).nullish().transform(v => v ?? []);
          } else {
            acc[field] = z.string().nullish().transform(v => v ?? '');
          }
          return acc;
        }, {} as Record<string, unknown>)
      );
      
      const validated = partialSchema.safeParse(normalized);
      if (validated.success) {
        return validated.data as Partial<AIVocabItem>;
      }
      
      throw new AIValidationError('Zod Validation Failed during Enrichment');
    } catch (err) {
      console.error(`enrichVocabulary: Attempt ${attempt} failed:`, err);
      const isTransient = err instanceof AIAbortError || err instanceof AINetworkError || (err instanceof AIResponseError && (err.message.includes('502') || err.message.includes('504')));
      
      if (isTransient && attempt < maxAttempts) {
        continue;
      }
      
      if (err instanceof AIAbortError) {
        throw new AIResponseError('Máy chủ AI hiện đang bận. Vui lòng thử lại sau.');
      }
      
      throw err instanceof Error ? err : new AIResponseError('Không thể làm giàu dữ liệu từ vựng.');
    }
  }
  
  throw new AIResponseError('Máy chủ AI hiện đang bận. Vui lòng thử lại sau.');
}
