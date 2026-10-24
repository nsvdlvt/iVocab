import type {
  DictionaryResult,
  DictionaryMeaningGroup,
  DictionarySenseDefinition,
} from "@/types/dictionary";
import type { IDictionaryProvider, DictionaryLookupOptions } from "./interface";
import { extractPhoneticsInfo } from "../phonetics";

interface RawPhonetic {
  text?: string;
  audio?: string;
  sourceUrl?: string;
}

interface RawDefinition {
  definition: string;
  synonyms?: string[];
  antonyms?: string[];
  example?: string;
}

interface RawMeaning {
  partOfSpeech: string;
  definitions: RawDefinition[];
  synonyms?: string[];
  antonyms?: string[];
}

interface RawEntry {
  word: string;
  phonetic?: string;
  phonetics?: RawPhonetic[];
  meanings?: RawMeaning[];
}

export class FreeDictionaryProvider implements IDictionaryProvider {
  readonly name = "free-dict";

  async lookup(word: string, options?: DictionaryLookupOptions): Promise<DictionaryResult | null> {
    const clean = word.trim().toLowerCase();
    if (!clean || clean.includes(" ")) return null;

    const signal = options?.signal ?? AbortSignal.timeout(2500);

    try {
      const response = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(clean)}`,
        {
          headers: {
            Accept: "application/json",
          },
          signal,
          next: { revalidate: 86400 },
        }
      );

      if (!response.ok) {
        return null;
      }

      const data = (await response.json()) as unknown;
      if (!Array.isArray(data) || data.length === 0) {
        return null;
      }

      const entry = data[0] as RawEntry;
      if (!entry || !entry.word) {
        return null;
      }

      // Process phonetics & audio
      const extracted = extractPhoneticsInfo(entry.phonetics, entry.phonetic);
      let audioUk = extracted.audioUk;
      let audioUs = extracted.audioUs;

      // Fallback reliable audio pronunciations if missing
      if (!audioUk) {
        audioUk = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(clean)}&type=1`;
      }
      if (!audioUs) {
        audioUs = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(clean)}&type=2`;
      }

      // Process meanings & definitions
      const meaningGroups: DictionaryMeaningGroup[] = [];

      if (Array.isArray(entry.meanings)) {
        for (let i = 0; i < entry.meanings.length; i++) {
          const m = entry.meanings[i];
          const pos = m.partOfSpeech?.toLowerCase() || "other";

          const defs: DictionarySenseDefinition[] = [];
          if (Array.isArray(m.definitions)) {
            for (let j = 0; j < m.definitions.length; j++) {
              const d = m.definitions[j];
              if (!d.definition) continue;

              defs.push({
                id: `${clean}-${pos}-${j + 1}`,
                definition: d.definition,
                definitionEn: d.definition,
                example: d.example,
                exampleEn: d.example,
                synonyms: Array.isArray(d.synonyms) ? d.synonyms.slice(0, 5) : [],
                antonyms: Array.isArray(d.antonyms) ? d.antonyms.slice(0, 5) : [],
              });
            }
          }

          if (defs.length > 0) {
            const groupSynonyms = Array.isArray(m.synonyms) ? m.synonyms.slice(0, 5) : [];
            const groupAntonyms = Array.isArray(m.antonyms) ? m.antonyms.slice(0, 5) : [];

            meaningGroups.push({
              partOfSpeech: pos,
              definitions: defs,
              synonyms: groupSynonyms,
              antonyms: groupAntonyms,
            });
          }
        }
      }

      const result: DictionaryResult = {
        word: entry.word,
        normalizedWord: clean,
        ipa: extracted.ipa,
        ipaUk: extracted.ipaUk,
        ipaUs: extracted.ipaUs,
        phonetics: extracted.phonetics,
        audioUk,
        audioUs,
        meanings: meaningGroups,
        collocations: [],
        wordForms: [],
        source: "free-dict",
        timestamp: Date.now(),
      };

      return result;
    } catch {
      return null;
    }
  }
}
