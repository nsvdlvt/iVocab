import type {
  DictionaryResult,
  DictionarySuggestion,
  ContextualTranslationResult,
} from "@/types/dictionary";
import { dictionaryCache, suggestionsCache } from "./cache";
import { FreeDictionaryProvider } from "./providers/free-dictionary.provider";
import { DatamuseProvider } from "./providers/datamuse.provider";
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

  constructor() {
    this.freeDictProvider = new FreeDictionaryProvider();
    this.datamuseProvider = new DatamuseProvider();
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

    // Step 1: Try Free Dictionary API with 2500ms timeout
    try {
      result = await this.freeDictProvider.lookup(rawClean, {
        signal: options?.signal ?? AbortSignal.timeout(2500),
        pos: options?.pos,
        contextSentence: options?.contextSentence,
      });
    } catch {
      result = null;
    }

    // Step 2: If Free Dictionary returned no result (or 404/530 error), seamlessly query Datamuse Provider
    if (!result || result.meanings.length === 0) {
      try {
        result = await this.datamuseProvider.lookup(rawClean, {
          signal: options?.signal ?? AbortSignal.timeout(2500),
        });
      } catch {
        result = null;
      }
    }

    // Step 3: For multi-word phrases (idioms/phrases like "break the ice") not indexed by dictionary APIs,
    // gracefully translate via Google Translate (strictly non-AI)
    if (isMultiWord && (!result || result.meanings.length === 0)) {
      result = await this.fallbackTranslateLookup(rawClean, options?.signal);
    }

    // If word is not found in real dictionary providers, return null.
    // Absolutely NO AI models or providers are used to invent or synthesize definitions.
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

    // Step 5: Enrich with Vietnamese translations and collocations (fast and cached via Google Translate)
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
    const cleanWord = word.trim();
    const cleanSentence = sentence.trim();

    if (!cleanWord || !cleanSentence) {
      throw new Error("Từ và câu ngữ cảnh không được để trống.");
    }

    // Translate word and sentence using non-AI translation service (Google Translate)
    const [wordVi, sentenceVi] = await Promise.all([
      translateToVietnamese(cleanWord, signal),
      translateToVietnamese(cleanSentence, signal),
    ]);

    return {
      word: cleanWord,
      sentence: cleanSentence,
      selectedMeaningVi: wordVi || cleanWord,
      explanationVi: sentenceVi ? `Bản dịch của cả câu: "${sentenceVi}"` : undefined,
      highlightPhrase: cleanWord,
    };
  }

  clearCache(): void {
    dictionaryCache.clear();
    suggestionsCache.clear();
  }

  private async fallbackTranslateLookup(
    clean: string,
    signal?: AbortSignal
  ): Promise<DictionaryResult | null> {
    const viMeaning = await translateToVietnamese(clean, signal);
    if (!viMeaning || viMeaning.trim().toLowerCase() === clean.toLowerCase()) return null;

    return {
      word: clean,
      normalizedWord: clean.toLowerCase(),
      primaryVietnamese: viMeaning,
      phonetics: [],
      meanings: [
        {
          partOfSpeech: "phrase",
          vietnameseSummary: viMeaning,
          definitions: [
            {
              id: `${clean.toLowerCase()}-phrase-1`,
              definitionEn: `Meaning of "${clean}" in English`,
              definitionVi: viMeaning,
              synonyms: [],
              antonyms: [],
            },
          ],
          synonyms: [],
          antonyms: [],
        },
      ],
      collocations: [],
      wordForms: [],
      source: "fallback",
      timestamp: Date.now(),
    };
  }

  private async enrichDictionaryResult(result: DictionaryResult): Promise<void> {
    // Standardize IPA fields
    if (result.ipa) result.ipa = normalizeIpa(result.ipa);
    if (result.ipaUk) result.ipaUk = normalizeIpa(result.ipaUk);
    if (result.ipaUs) result.ipaUs = normalizeIpa(result.ipaUs);

    const promises: Promise<void>[] = [];

    // 1. Fetch primary Vietnamese translation if missing (via Google Translate)
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
