import type {
  DictionaryResult,
  DictionarySuggestion,
  ContextualTranslationResult,
} from "@/types/dictionary";
import { dictionaryCache, suggestionsCache } from "./cache";
import { FreeDictionaryProvider } from "./providers/free-dictionary.provider";
import { DatamuseProvider } from "./providers/datamuse.provider";
import { AiDictionaryProvider } from "./providers/ai-dictionary.provider";
import { translateToVietnamese } from "./translation.service";
import { normalizeIpa, isArpabet, isReliableIpa } from "./phonetics";

export interface LookupOptions {
  signal?: AbortSignal;
  pos?: string;
  contextSentence?: string;
  skipCache?: boolean;
}

export class DictionaryService {
  private freeDictProvider: FreeDictionaryProvider;
  private datamuseProvider: DatamuseProvider;
  private aiDictProvider: AiDictionaryProvider;

  constructor() {
    this.freeDictProvider = new FreeDictionaryProvider();
    this.datamuseProvider = new DatamuseProvider();
    this.aiDictProvider = new AiDictionaryProvider();
  }

  async lookup(word: string, options?: LookupOptions): Promise<DictionaryResult | null> {
    const rawClean = word.trim().replace(/\s+/g, " ");
    if (!rawClean) return null;

    const normalized = rawClean.toLowerCase();
    const cacheKey = normalized;

    if (!options?.skipCache && dictionaryCache.has(cacheKey)) {
      const cached = dictionaryCache.get(cacheKey);
      if (cached) {
        // Sanitize or invalidate cached entry if it contains malformed ARPAbet or invalid IPA
        if (cached.ipa && (isArpabet(cached.ipa) || !isReliableIpa(cached.ipa))) {
          const fixed = normalizeIpa(cached.ipa);
          if (fixed) {
            cached.ipa = fixed;
            if (!cached.ipaUs) cached.ipaUs = fixed;
          } else {
            dictionaryCache.delete(cacheKey);
            return this.lookup(word, { ...options, skipCache: true });
          }
        }
        return cached;
      }
    }

    let result: DictionaryResult | null = null;
    const isMultiWord = rawClean.includes(" ");

    // Step 1: For idioms and multi-word phrases (e.g. "break the ice", "look forward to"),
    // Free Dictionary does not support multi-word entries, so route directly to AI / translation
    if (isMultiWord) {
      try {
        result = await this.aiDictProvider.lookup(rawClean, {
          signal: options?.signal ?? AbortSignal.timeout(6000),
          pos: options?.pos,
          contextSentence: options?.contextSentence,
        });
      } catch {
        result = null;
      }
    } else {
      // Step 2: Try Free Dictionary API with 2500ms timeout
      try {
        result = await this.freeDictProvider.lookup(rawClean, {
          signal: AbortSignal.timeout(2500),
          pos: options?.pos,
          contextSentence: options?.contextSentence,
        });
      } catch {
        result = null;
      }

      // Step 3: If Free Dictionary failed (e.g. 530 Cloudflare error on "eloquent" or 404),
      // seamlessly fall back to Datamuse Dictionary (returns definitions & IPA in ~250ms)
      if (!result || result.meanings.length === 0) {
        try {
          result = await this.datamuseProvider.lookup(rawClean, {
            signal: AbortSignal.timeout(2500),
          });
        } catch {
          result = null;
        }
      }
    }

    if (!result || result.meanings.length === 0) {
      return null;
    }

    // Step 4: If Free Dictionary had definitions but lacked reliable IPA (e.g. "resilient"),
    // fetch reliable pronunciation from Datamuse (uses &ipa=1 or ARPAbet-to-IPA conversion)
    if (!isMultiWord && (!result.ipa || !isReliableIpa(result.ipa))) {
      try {
        const pron = await this.datamuseProvider.getPronunciation(
          rawClean,
          AbortSignal.timeout(1500)
        );
        if (pron?.ipa) {
          result.ipa = pron.ipa;
          if (!result.ipaUs && pron.ipaUs) result.ipaUs = pron.ipaUs;
          if (!result.phonetics.some((p) => p.text)) {
            result.phonetics.push({ text: pron.ipa, region: "us" });
          }
        }
      } catch {
        // Non-blocking: proceed without failing lookup
      }
    }

    // Step 5: Enrich with Vietnamese translations and collocations (fast and cached)
    await this.enrichDictionaryResult(result);

    // Cache the completed result
    dictionaryCache.set(cacheKey, result);

    return result;
  }

  async getSuggestions(query: string, signal?: AbortSignal): Promise<DictionarySuggestion[]> {
    const clean = query.trim().toLowerCase();
    if (!clean || clean.length < 1) return [];

    if (suggestionsCache.has(clean)) {
      return suggestionsCache.get(clean) || [];
    }

    const suggestions = await this.datamuseProvider.suggest(clean, signal);
    if (suggestions.length > 0) {
      suggestionsCache.set(clean, suggestions);
    }

    return suggestions;
  }

  async translateContext(
    word: string,
    sentence: string,
    signal?: AbortSignal
  ): Promise<ContextualTranslationResult> {
    return this.aiDictProvider.translateContext(word, sentence, signal);
  }

  clearCache(): void {
    dictionaryCache.clear();
    suggestionsCache.clear();
  }

  private async enrichDictionaryResult(result: DictionaryResult): Promise<void> {
    // Standardize IPA fields
    if (result.ipa) result.ipa = normalizeIpa(result.ipa);
    if (result.ipaUk) result.ipaUk = normalizeIpa(result.ipaUk);
    if (result.ipaUs) result.ipaUs = normalizeIpa(result.ipaUs);

    const promises: Promise<void>[] = [];

    // 1. Fetch primary Vietnamese translation if missing
    if (!result.primaryVietnamese) {
      promises.push(
        (async () => {
          try {
            const vi = await translateToVietnamese(result.word);
            if (vi) result.primaryVietnamese = vi;
          } catch {
            // Ignore
          }
        })()
      );
    }

    // 2. Fetch collocations and synonyms from Datamuse if empty (non-blocking 1500ms timeout)
    if (result.collocations.length === 0) {
      promises.push(
        (async () => {
          try {
            const rel = await this.datamuseProvider.getCollocationsAndSynonyms(
              result.word,
              AbortSignal.timeout(1500)
            );
            if (rel.collocations.length > 0) {
              result.collocations = rel.collocations;
            }
          } catch {
            // Ignore
          }
        })()
      );
    }

    // Wait for primary translation first so meaning summaries can use it
    if (promises.length > 0) {
      await Promise.allSettled(promises);
    }

    // 3. Set meaning summaries and translate only primary definitions (max 2 definitions to avoid delay)
    const defPromises: Promise<void>[] = [];

    for (let i = 0; i < result.meanings.length; i++) {
      const meaning = result.meanings[i];
      if (!meaning.vietnameseSummary && result.primaryVietnamese) {
        meaning.vietnameseSummary = result.primaryVietnamese;
      }

      // Only translate the first 2 definitions of the first meaning group
      if (i === 0) {
        const defsToTranslate = meaning.definitions.slice(0, 2);
        for (const def of defsToTranslate) {
          const defEn = def.definitionEn;
          if (!def.definitionVi && defEn) {
            defPromises.push(
              (async () => {
                try {
                  const viDef = await translateToVietnamese(defEn);
                  if (viDef) def.definitionVi = viDef;
                } catch {
                  // Ignore
                }
              })()
            );
          }

          const exampleText = def.exampleEn;
          if (exampleText && !def.exampleVi) {
            defPromises.push(
              (async () => {
                try {
                  const viEx = await translateToVietnamese(exampleText);
                  if (viEx) def.exampleVi = viEx;
                } catch {
                  // Ignore
                }
              })()
            );
          }
        }
      }
    }

    if (defPromises.length > 0) {
      await Promise.allSettled(defPromises);
    }
  }
}

// Export singleton instance
export const dictionaryService = new DictionaryService();
