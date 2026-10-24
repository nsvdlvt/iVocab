import type {
  DictionaryResult,
  DictionarySuggestion,
  DictionaryMeaningGroup,
  DictionarySenseDefinition,
} from "@/types/dictionary";
import type { IDictionaryProvider, ISuggestionProvider, DictionaryLookupOptions } from "./interface";
import { normalizeIpa, arpabetToIpa } from "../phonetics";

interface DatamuseSugItem {
  word: string;
  score?: number;
}

interface DatamuseWordItem {
  word: string;
  score?: number;
  tags?: string[];
  defs?: string[];
}

export class DatamuseProvider implements ISuggestionProvider, IDictionaryProvider {
  readonly name = "datamuse";

  async lookup(word: string, options?: DictionaryLookupOptions): Promise<DictionaryResult | null> {
    const clean = word.trim().toLowerCase();
    if (!clean) return null;

    try {
      const signal = options?.signal ?? AbortSignal.timeout(2500);
      const url = `https://api.datamuse.com/words?sp=${encodeURIComponent(clean)}&md=dpfr&ipa=1&max=1`;
      const res = await fetch(url, { signal });
      if (!res.ok) return null;

      const data = (await res.json()) as DatamuseWordItem[];
      if (!Array.isArray(data) || data.length === 0) return null;

      const item = data[0];
      if (item.word.toLowerCase() !== clean || !Array.isArray(item.defs) || item.defs.length === 0) {
        return null;
      }

      const posMap: Record<string, string> = {
        n: "noun",
        v: "verb",
        adj: "adjective",
        adv: "adverb",
        u: "general",
      };

      const groups = new Map<string, DictionarySenseDefinition[]>();

      item.defs.forEach((raw, idx) => {
        const parts = raw.split("\t");
        const rawPos = parts[0]?.trim().toLowerCase() || "u";
        const defText = parts.slice(1).join("\t").trim();
        const pos = posMap[rawPos] || rawPos || "general";

        if (!groups.has(pos)) {
          groups.set(pos, []);
        }
        groups.get(pos)!.push({
          id: `${clean}-${pos}-${idx + 1}`,
          definition: defText,
          definitionEn: defText,
          synonyms: [],
          antonyms: [],
        });
      });

      const meaningGroups: DictionaryMeaningGroup[] = Array.from(groups.entries()).map(
        ([partOfSpeech, definitions]) => ({
          partOfSpeech,
          definitions,
          synonyms: [],
          antonyms: [],
        })
      );

      let ipa: string | undefined;
      if (Array.isArray(item.tags)) {
        const ipaTag = item.tags.find((t) => t.startsWith("ipa_pron:"));
        if (ipaTag) {
          ipa = normalizeIpa(ipaTag);
        } else {
          const pronTag = item.tags.find((t) => t.startsWith("pron:"));
          if (pronTag) {
            ipa = arpabetToIpa(pronTag) || normalizeIpa(pronTag);
          }
        }
      }

      return {
        word: clean,
        normalizedWord: clean,
        ipa,
        ipaUs: ipa,
        phonetics: ipa ? [{ text: ipa, region: "us" }] : [],
        audioUk: `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(clean)}&type=1`,
        audioUs: `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(clean)}&type=2`,
        meanings: meaningGroups,
        collocations: [],
        wordForms: [],
        source: "datamuse",
        timestamp: Date.now(),
      };
    } catch {
      return null;
    }
  }

  async suggest(query: string, signal?: AbortSignal): Promise<DictionarySuggestion[]> {
    const clean = query.trim().toLowerCase();
    if (!clean) return [];

    try {
      const abortSignal = signal ?? AbortSignal.timeout(2000);
      const url = `https://api.datamuse.com/sug?s=${encodeURIComponent(clean)}&max=8`;
      const res = await fetch(url, { signal: abortSignal });
      if (!res.ok) return [];

      const data = (await res.json()) as DatamuseSugItem[];
      if (!Array.isArray(data)) return [];

      return data.map((item) => ({
        word: item.word,
        score: item.score,
      }));
    } catch {
      return [];
    }
  }

  async getCollocationsAndSynonyms(
    word: string,
    signal?: AbortSignal
  ): Promise<{ collocations: string[]; synonyms: string[]; antonyms: string[] }> {
    const clean = word.trim().toLowerCase();
    if (!clean) return { collocations: [], synonyms: [], antonyms: [] };

    try {
      const abortSignal = signal ?? AbortSignal.timeout(2000);
      const [collocRes, synRes, antRes] = await Promise.allSettled([
        fetch(`https://api.datamuse.com/words?rel_trg=${encodeURIComponent(clean)}&max=6`, {
          signal: abortSignal,
        }),
        fetch(`https://api.datamuse.com/words?rel_syn=${encodeURIComponent(clean)}&max=6`, {
          signal: abortSignal,
        }),
        fetch(`https://api.datamuse.com/words?rel_ant=${encodeURIComponent(clean)}&max=6`, {
          signal: abortSignal,
        }),
      ]);

      let collocations: string[] = [];
      let synonyms: string[] = [];
      let antonyms: string[] = [];

      if (collocRes.status === "fulfilled" && collocRes.value.ok) {
        const data = (await collocRes.value.json()) as DatamuseWordItem[];
        if (Array.isArray(data)) {
          collocations = data.map((d) => d.word);
        }
      }

      if (synRes.status === "fulfilled" && synRes.value.ok) {
        const data = (await synRes.value.json()) as DatamuseWordItem[];
        if (Array.isArray(data)) {
          synonyms = data.map((d) => d.word);
        }
      }

      if (antRes.status === "fulfilled" && antRes.value.ok) {
        const data = (await antRes.value.json()) as DatamuseWordItem[];
        if (Array.isArray(data)) {
          antonyms = data.map((d) => d.word);
        }
      }

      return { collocations, synonyms, antonyms };
    } catch {
      return { collocations: [], synonyms: [], antonyms: [] };
    }
  }

  async getPronunciation(
    word: string,
    signal?: AbortSignal
  ): Promise<{ ipa?: string; ipaUs?: string } | null> {
    const clean = word.trim().toLowerCase();
    if (!clean) return null;

    try {
      const abortSignal = signal ?? AbortSignal.timeout(2000);
      const url = `https://api.datamuse.com/words?sp=${encodeURIComponent(clean)}&md=r&ipa=1&max=1`;
      const res = await fetch(url, { signal: abortSignal });
      if (!res.ok) return null;

      const data = (await res.json()) as DatamuseWordItem[];
      if (!Array.isArray(data) || data.length === 0) return null;

      const item = data[0];
      if (item.word.toLowerCase() !== clean || !Array.isArray(item.tags)) return null;

      const ipaTag = item.tags.find((t) => t.startsWith("ipa_pron:"));
      let ipa: string | undefined;
      if (ipaTag) {
        ipa = normalizeIpa(ipaTag);
      } else {
        const pronTag = item.tags.find((t) => t.startsWith("pron:"));
        if (pronTag) {
          ipa = arpabetToIpa(pronTag) || normalizeIpa(pronTag);
        }
      }

      if (!ipa) return null;
      return { ipa, ipaUs: ipa };
    } catch {
      return null;
    }
  }
}
