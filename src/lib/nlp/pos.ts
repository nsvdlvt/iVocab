import nlp from "compromise";

function normalizeKey(str: string) {
  return str.trim().toLowerCase().replace(/\s+/g, " ");
}

export function extractSentence(passage: string, wordGlobalIndex: number): string {
  const doc = nlp(passage);
  const sentences = doc.sentences().out("array") as string[];
  
  let currentIndex = 0;
  for (const sentence of sentences) {
    const idx = passage.indexOf(sentence, currentIndex);
    if (idx !== -1) {
      const sentenceEnd = idx + sentence.length;
      if (wordGlobalIndex >= idx && wordGlobalIndex <= sentenceEnd) {
        return sentence;
      }
      currentIndex = sentenceEnd;
    } else {
      // If indexOf fails due to normalization by compromise, fallback to includes
      // Note: compromise usually returns the exact text slice in .out('array')
      if (sentence.length > 5 && passage.substring(wordGlobalIndex - sentence.length, wordGlobalIndex + sentence.length).includes(sentence)) {
         return sentence;
      }
    }
  }
  
  // Fallback to manual splitting if compromise fails to find the containing sentence
  const start = Math.max(0, passage.lastIndexOf(".", wordGlobalIndex) + 1, passage.lastIndexOf("!", wordGlobalIndex) + 1, passage.lastIndexOf("?", wordGlobalIndex) + 1);
  const end1 = passage.indexOf(".", wordGlobalIndex);
  const end2 = passage.indexOf("!", wordGlobalIndex);
  const end3 = passage.indexOf("?", wordGlobalIndex);
  const validEnds = [end1, end2, end3].filter(e => e !== -1);
  const end = validEnds.length > 0 ? Math.min(...validEnds) : passage.length;
  
  return passage.substring(start, end).trim();
}

export function mapPos(tags: string[]): string | null {
  if (tags.includes("Noun") || tags.includes("ProperNoun") || tags.includes("Pronoun") || tags.includes("Singular") || tags.includes("Plural")) return "noun";
  if (tags.includes("Verb") || tags.includes("Gerund") || tags.includes("PastTense") || tags.includes("Copula") || tags.includes("Infinitive") || tags.includes("Participle") || tags.includes("PresentTense")) return "verb";
  if (tags.includes("Adjective") || tags.includes("Comparative") || tags.includes("Superlative")) return "adjective";
  if (tags.includes("Adverb")) return "adverb";
  if (tags.includes("Preposition")) return "preposition";
  if (tags.includes("Conjunction")) return "conjunction";
  if (tags.includes("Determiner")) return "determiner";
  if (tags.includes("Interjection")) return "interjection";
  return null;
}

function applyPosHeuristics(sentence: string, word: string): string | null {
  const cleanWord = word.toLowerCase().replace(/[^a-z0-9-]/g, "");
  const words = sentence.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/).filter(Boolean);
  
  let targetIndex = -1;
  for (let i = 0; i < words.length; i++) {
    if (words[i] === cleanWord || words[i].replace(/-/g, "") === cleanWord.replace(/-/g, "")) {
      targetIndex = i;
      break; // match the first occurrence for heuristic purposes
    }
  }
  
  if (targetIndex <= 0) return null;

  const prev1 = words[targetIndex - 1];
  const prev2 = targetIndex > 1 ? words[targetIndex - 2] : null;

  const modals = new Set(["will", "would", "shall", "should", "can", "could", "may", "might", "must"]);
  const determiners = new Set([
    "a", "an", "the", "this", "that", "these", "those", "some", "any", 
    "no", "every", "all", "many", "much", "several", "few", "both", 
    "each", "my", "your", "his", "her", "its", "our", "their"
  ]);
  const subjectPronouns = new Set(["i", "you", "he", "she", "we", "they", "it"]);
  const prepositions = new Set(["in", "on", "at", "for", "with", "about", "against", "between", "into", "through", "during", "before", "after", "above", "below", "from", "up", "down", "of"]);

  // 1. Strong Verb indicators immediately preceding
  if (prev1 === "to") return "verb";
  if (modals.has(prev1)) return "verb";
  if (subjectPronouns.has(prev1)) return "verb";
  
  // 2. Strong Noun indicators immediately preceding
  if (determiners.has(prev1)) return "noun";
  if (prepositions.has(prev1)) return "noun";
  
  // 3. Adverb + Verb (e.g. "to quickly address", "will gladly support")
  if (prev1.endsWith("ly") && prev2) {
    if (prev2 === "to") return "verb";
    if (modals.has(prev2)) return "verb";
    if (subjectPronouns.has(prev2)) return "verb";
  }

  // 4. Determiner + Adjective(s) + Noun (e.g. "the large-scale changes", "a very critical issue")
  for (let i = 1; i <= 3; i++) {
    const lookback = targetIndex - i;
    if (lookback >= 0) {
      const w = words[lookback];
      if (w === "to" || modals.has(w) || subjectPronouns.has(w)) {
        break; // stop looking back if we hit a verb indicator
      }
      if (determiners.has(w)) {
        return "noun";
      }
    }
  }

  return null;
}

const posCache = new Map<string, string | null>();

export function detectPartOfSpeech(sentence: string, word: string): string | null {
  if (!sentence || !word) return null;
  const cacheKey = normalizeKey(`${sentence}::${word}`);
  
  if (posCache.has(cacheKey)) {
    return posCache.get(cacheKey)!;
  }

  try {
    let tags: string[] = [];
    
    // First, try lightweight heuristics
    const heuristicPos = applyPosHeuristics(sentence, word);
    let pos = heuristicPos;
    
    // Fallback to compromise if heuristics yield no strong match
    if (!pos) {
      const doc = nlp(sentence);
      const term = doc.match(`[${word}]`).first();
      
      const outTags = term.out("tags");
      if (Array.isArray(outTags) && outTags.length > 0) {
        const firstObj = outTags[0];
        if (firstObj && typeof firstObj === 'object') {
          const vals = Object.values(firstObj);
          if (vals.length > 0 && Array.isArray(vals[0])) {
            tags = vals[0] as string[];
          } else if (firstObj.tags && Array.isArray(firstObj.tags)) {
            tags = firstObj.tags;
          }
        }
      }
      pos = mapPos(tags);
    }

    console.log("=== POS DETECTION ===");
    console.log("Sentence:", sentence);
    console.log("Word:", word);
    console.log("Heuristic Pos:", heuristicPos);
    console.log("Compromise Tags:", tags);
    console.log("Mapped POS:", pos);

    posCache.set(cacheKey, pos);
    return pos;
  } catch (e) {
    console.error("POS detection error:", e);
    posCache.set(cacheKey, null);
    return null;
  }
}
