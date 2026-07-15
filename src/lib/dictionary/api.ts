export interface DictionaryDefinition {
  definition: string;
  example?: string;
}

export interface DictionaryResult {
  word: string;
  ipa?: string;
  audio?: string;
  partOfSpeech?: string;
  definitions?: DictionaryDefinition[];
  synonyms?: string[];
  vietnameseMeaning?: string;
}

const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "of", "to", "in", "for", "with", 
  "on", "at", "from", "by", "is", "are", "am", "was", "were", "be", "been", 
  "being", "it", "this", "that", "these", "those", "I", "you", "he", "she", 
  "we", "they", "me", "him", "her", "us", "them", "my", "your", "his", "their", 
  "our", "its", "so", "as", "if", "then", "than", "there", "here", "when", 
  "where", "why", "how", "all", "any", "some", "every", "no", "not", "do", "does", "did", "can", "could", "would", "should", "will"
]);

const cache = new Map<string, DictionaryResult | null>();

export function isStopWord(word: string): boolean {
  return STOP_WORDS.has(word.toLowerCase());
}

/**
 * Abstraction for fetching Vietnamese translation.
 * Can be replaced with a different service in the future.
 */
async function translateWord(word: string): Promise<string | undefined> {
  try {
    const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(word)}`);
    if (!res.ok) return undefined;
    const data = await res.json();
    return data[0]?.[0]?.[0] || undefined;
  } catch (error) {
    console.error("Translation API error:", error);
    return undefined;
  }
}

export async function fetchDictionaryData(word: string, pos?: string | null): Promise<DictionaryResult | null> {
  const cleanWord = word.trim().toLowerCase();
  
  if (!cleanWord || isStopWord(cleanWord)) {
    return null;
  }

  const cacheKey = pos ? `${cleanWord}::${pos}` : cleanWord;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey) || null;
  }

  try {
    const dictRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`);
    
    if (!dictRes.ok) {
      // If the dictionary API returns 404, we can still try to return a translation
      const viMeaning = await translateWord(cleanWord);
      if (viMeaning) {
        const result = { word: cleanWord, vietnameseMeaning: viMeaning };
        cache.set(cleanWord, result);
        return result;
      }
      cache.set(cleanWord, null);
      return null;
    }

    const data = await dictRes.json();
    const entry = data[0];
    
    if (!entry) {
      cache.set(cleanWord, null);
      return null;
    }

    let ipa, audio;
    for (const ph of entry.phonetics || []) {
      if (!ipa && ph.text) ipa = ph.text;
      if (!audio && ph.audio) audio = ph.audio;
    }

    let meaning = entry.meanings?.[0];
    let fallback = true;
    if (pos && entry.meanings) {
      const matchedMeaning = entry.meanings.find((m: { partOfSpeech?: string }) => m.partOfSpeech?.toLowerCase() === pos.toLowerCase());
      if (matchedMeaning) {
        meaning = matchedMeaning;
        fallback = false;
      }
    }

    console.log("=== DICTIONARY LOOKUP ===");
    console.log("Dictionary meanings:", entry.meanings?.map((m: { partOfSpeech?: string }) => m.partOfSpeech));
    console.log("Selected:", meaning?.partOfSpeech);
    console.log("Fallback:", fallback);

    const partOfSpeech = meaning?.partOfSpeech;
    const definitions = meaning?.definitions?.map((d: { definition: string, example?: string }) => ({
      definition: d.definition,
      example: d.example
    })) || [];
    
    let synonyms: string[] = [];
    if (meaning?.synonyms?.length > 0) {
      synonyms = meaning.synonyms.slice(0, 3);
    } else if (definitions.length > 0 && meaning?.definitions?.[0]?.synonyms?.length > 0) {
      synonyms = meaning.definitions[0].synonyms.slice(0, 3);
    }

    const vietnameseMeaning = await translateWord(cleanWord);

    const result: DictionaryResult = {
      word: entry.word || cleanWord,
      ipa,
      audio,
      partOfSpeech,
      definitions,
      synonyms,
      vietnameseMeaning
    };

    cache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error("Dictionary lookup failed:", error);
    // Don't cache hard failures so we can retry
    return null;
  }
}
