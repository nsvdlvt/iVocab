import { dictionaryService } from "./dictionary.service";
import type { DictionaryResult as UnifiedDictionaryResult } from "@/types/dictionary";

export interface DictionaryDefinition {
  definition: string;
  example?: string;
  definitionVi?: string;
  exampleVi?: string;
}

export interface DictionaryResult {
  word: string;
  ipa?: string;
  audio?: string;
  audioUk?: string;
  audioUs?: string;
  partOfSpeech?: string;
  definitions?: DictionaryDefinition[];
  synonyms?: string[];
  vietnameseMeaning?: string;
  unified?: UnifiedDictionaryResult;
}

/**
 * Backwards-compatible lookup function routing to the new DictionaryService architecture.
 */
export async function fetchDictionaryData(
  word: string,
  pos?: string | null
): Promise<DictionaryResult | null> {
  const cleanWord = word.trim();
  if (!cleanWord) return null;

  try {
    const unified = await dictionaryService.lookup(cleanWord, {
      pos: pos || undefined,
    });

    if (!unified) return null;

    // Pick best matching or first meaning group
    let group = unified.meanings[0];
    if (pos && unified.meanings.length > 1) {
      const matched = unified.meanings.find(
        (m) => m.partOfSpeech.toLowerCase() === pos.toLowerCase()
      );
      if (matched) group = matched;
    }

    const legacyDefs: DictionaryDefinition[] =
      group?.definitions.map((d) => ({
        definition: d.definitionEn,
        example: d.exampleEn,
        definitionVi: d.definitionVi,
        exampleVi: d.exampleVi,
      })) || [];

    const synonyms = group?.synonyms?.length
      ? group.synonyms
      : group?.definitions[0]?.synonyms || [];

    return {
      word: unified.word,
      ipa: unified.ipa,
      audio: unified.audioUs || unified.audioUk,
      audioUk: unified.audioUk,
      audioUs: unified.audioUs,
      partOfSpeech: group?.partOfSpeech,
      definitions: legacyDefs,
      synonyms: synonyms.slice(0, 5),
      vietnameseMeaning: group?.vietnameseSummary || unified.primaryVietnamese,
      unified,
    };
  } catch (error) {
    console.error("fetchDictionaryData error:", error);
    return null;
  }
}

export function isStopWord(_word: string): boolean {
  void _word;
  // In the rebuilt dictionary, stop-words are no longer arbitrarily blocked
  // so learners can look up modal verbs like "will", "can", "should", "do"
  return false;
}
