/**
 * highlight-words.ts
 * Robust, safe text chunking and target word highlighting for English examples
 * and Vietnamese example translations in LearnVocab.
 */

export interface TextChunk {
  text: string;
  isHighlighted: boolean;
}

/**
 * Escapes special regex characters in a string.
 */
export function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Common English irregular verb and adjective inflections
 */
const IRREGULAR_INFLECTIONS: Record<string, string[]> = {
  be: ["is", "am", "are", "was", "were", "been", "being"],
  have: ["has", "had", "having"],
  do: ["does", "did", "done", "doing"],
  go: ["goes", "went", "gone", "going"],
  make: ["makes", "made", "making"],
  take: ["takes", "took", "taken", "taking"],
  come: ["comes", "came", "coming"],
  see: ["sees", "saw", "seen", "seeing"],
  know: ["knows", "knew", "known", "knowing"],
  get: ["gets", "got", "gotten", "getting"],
  give: ["gives", "gave", "given", "giving"],
  find: ["finds", "found", "finding"],
  think: ["thinks", "thought", "thinking"],
  tell: ["tells", "told", "telling"],
  become: ["becomes", "became", "becoming"],
  leave: ["leaves", "left", "leaving"],
  feel: ["feels", "felt", "feeling"],
  put: ["puts", "putting"],
  bring: ["brings", "brought", "bringing"],
  begin: ["begins", "began", "begun", "beginning"],
  keep: ["keeps", "kept", "keeping"],
  hold: ["holds", "held", "holding"],
  write: ["writes", "wrote", "written", "writing"],
  stand: ["stands", "stood", "standing"],
  hear: ["hears", "heard", "hearing"],
  let: ["lets", "letting"],
  mean: ["means", "meant", "meaning"],
  set: ["sets", "setting"],
  meet: ["meets", "met", "meeting"],
  run: ["runs", "ran", "running"],
  pay: ["pays", "paid", "paying"],
  sit: ["sits", "sat", "sitting"],
  speak: ["speaks", "spoke", "spoken", "speaking"],
  lie: ["lies", "lay", "lain", "lying"],
  lead: ["leads", "led", "leading"],
  read: ["reads", "reading"],
  grow: ["grows", "grew", "grown", "growing"],
  lose: ["loses", "lost", "losing"],
  fall: ["falls", "fell", "fallen", "falling"],
  send: ["sends", "sent", "sending"],
  build: ["builds", "built", "building"],
  understand: ["understands", "understood", "understanding"],
  draw: ["draws", "drew", "drawn", "drawing"],
  break: ["breaks", "broke", "broken", "breaking"],
  spend: ["spends", "spent", "spending"],
  cut: ["cuts", "cutting"],
  rise: ["rises", "rose", "risen", "rising"],
  drive: ["drives", "drove", "driven", "driving"],
  buy: ["buys", "bought", "buying"],
  wear: ["wears", "wore", "worn", "wearing"],
  choose: ["chooses", "chose", "chosen", "choosing"],
  seek: ["seeks", "sought", "seeking"],
  reach: ["reaches", "reached", "reaching"],
  achieve: ["achieves", "achieved", "achieving"],
};

/**
 * Generates inflected variants for an English target word or multi-word phrase.
 */
export function getEnglishWordVariants(targetWord: string): string[] {
  const trimmed = targetWord.trim();
  if (!trimmed) return [];

  const variants = new Set<string>();
  variants.add(trimmed);

  // If it's a multi-word phrase (e.g. "take for granted", "look forward to")
  if (trimmed.includes(" ")) {
    const parts = trimmed.split(/\s+/);
    const head = parts[0]?.toLowerCase() || "";
    const tail = parts.slice(1).join(" ");

    // Inflect the head word if known
    const headVariants = getEnglishWordVariants(head);
    for (const hv of headVariants) {
      variants.add(`${hv} ${tail}`);
    }
    return Array.from(variants);
  }

  const lower = trimmed.toLowerCase();

  // 1. Check irregulars
  if (IRREGULAR_INFLECTIONS[lower]) {
    for (const form of IRREGULAR_INFLECTIONS[lower]) {
      variants.add(form);
    }
  }

  // 2. Regular rules
  // Plurals and 3rd person singular -s / -es / -ies
  if (lower.endsWith("y") && lower.length > 2 && !/[aeiou]y$/i.test(lower)) {
    const stem = lower.slice(0, -1);
    variants.add(stem + "ies");
    variants.add(stem + "ied");
  } else if (/(?:s|x|z|ch|sh)$/i.test(lower)) {
    variants.add(lower + "es");
  } else if (lower.endsWith("e")) {
    variants.add(lower + "s");
    variants.add(lower + "d"); // e.g. relate -> related
    variants.add(lower.slice(0, -1) + "ing"); // make -> making
  } else {
    variants.add(lower + "s");
    variants.add(lower + "ed");
    variants.add(lower + "ing");

    // Double consonant rule for short CVC words (e.g. stop -> stopped, run -> running)
    if (
      lower.length >= 3 &&
      /[^aeiou][aeiou][^aeiouwxy]$/i.test(lower)
    ) {
      const lastChar = lower.slice(-1);
      variants.add(lower + lastChar + "ed");
      variants.add(lower + lastChar + "ing");
    }
  }

  // Adverb / adjective derivations
  if (lower.endsWith("ic")) {
    variants.add(lower + "ally"); // e.g. automatic -> automatically
  } else if (lower.endsWith("le")) {
    variants.add(lower.slice(0, -1) + "y"); // e.g. subtle -> subtly
  } else if (lower.endsWith("y")) {
    variants.add(lower.slice(0, -1) + "ily"); // e.g. happy -> happily
    variants.add(lower.slice(0, -1) + "ier");
    variants.add(lower.slice(0, -1) + "iest");
  } else {
    variants.add(lower + "ly"); // e.g. reluctant -> reluctantly
    variants.add(lower + "er");
    variants.add(lower + "est");
  }

  return Array.from(variants);
}

/**
 * Extracts candidate Vietnamese translation phrases from the vocabulary's meaning.
 * E.g., "(adj) miễn cưỡng, không sẵn lòng" -> ["miễn cưỡng", "không sẵn lòng"]
 */
export function getVietnameseMeaningCandidates(meaning: string): string[] {
  if (!meaning || !meaning.trim()) return [];

  // 1. Remove POS tags & parenthetical notes: (n), (v), [adj], (collocation), (formal)...
  const cleaned = meaning
    .replace(/\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\{[^}]*\}/g, " ");

  // 2. Split by standard separators: comma, semicolon, slash, pipe, or conjunctions
  const rawParts = cleaned.split(/[,;\/|•\n]|\b(?:hoặc|hay)\b/gi);

  const candidates = new Set<string>();

  for (const part of rawParts) {
    const trimmed = part
      .replace(/^[\s\-–—:;.]+/, "")
      .replace(/[\s\-–—:;.]+$/, "")
      .trim();

    if (!trimmed || trimmed.length < 2) continue;

    // Filter out obvious labels like "tính từ", "danh từ", "động từ"
    if (/^(tính từ|danh từ|động từ|trạng từ|giới từ|cụm từ)$/i.test(trimmed)) {
      continue;
    }

    candidates.add(trimmed);

    // Also add subphrase without leading Vietnamese markers like "sự", "việc", "tính", "khả năng", "làm cho"
    const prefixMatch = trimmed.match(/^(?:sự|việc|tính|khả năng|làm cho|trở nên)\s+(.+)$/i);
    if (prefixMatch && prefixMatch[1] && prefixMatch[1].trim().length >= 2) {
      candidates.add(prefixMatch[1].trim());
    }
  }

  // Sort candidates by word count descending, then length descending
  return Array.from(candidates).sort((a, b) => {
    const wordsA = a.split(/\s+/).length;
    const wordsB = b.split(/\s+/).length;
    if (wordsB !== wordsA) return wordsB - wordsA;
    return b.length - a.length;
  });
}

/**
 * Chunks a sentence into highlighted and normal segments using regex with Unicode word boundaries.
 * Unicode boundary: (?<![\p{L}\p{M}]) at start, (?![\p{L}\p{M}]) at end.
 */
export function chunkSentenceByPhrases(
  sentence: string,
  targetPhrases: string[]
): TextChunk[] {
  if (!sentence || !sentence.trim() || !targetPhrases || targetPhrases.length === 0) {
    return [{ text: sentence || "", isHighlighted: false }];
  }

  // Filter valid non-empty phrases and sort by length descending
  const validPhrases = Array.from(
    new Set(
      targetPhrases
        .map((p) => p.trim())
        .filter((p) => p.length > 0)
    )
  ).sort((a, b) => b.length - a.length);

  if (validPhrases.length === 0) {
    return [{ text: sentence, isHighlighted: false }];
  }

  // Build regex matching whole words using Unicode property escapes
  const patternParts = validPhrases.map((phrase) => {
    // If phrase starts or ends with non-word character (like punctuation), don't wrap with word boundary
    const startsWithLetter = /^[\p{L}\p{M}\p{N}]/u.test(phrase);
    const endsWithLetter = /[\p{L}\p{M}\p{N}]$/u.test(phrase);

    const leftBoundary = startsWithLetter ? "(?<![\\p{L}\\p{M}\\p{N}])" : "";
    const rightBoundary = endsWithLetter ? "(?![\\p{L}\\p{M}\\p{N}])" : "";

    return `${leftBoundary}${escapeRegExp(phrase)}${rightBoundary}`;
  });

  const regex = new RegExp(`(${patternParts.join("|")})`, "gui");

  const chunks: TextChunk[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(sentence)) !== null) {
    const matchIndex = match.index;
    const matchedText = match[0];

    // Push unhighlighted text before this match
    if (matchIndex > lastIndex) {
      chunks.push({
        text: sentence.substring(lastIndex, matchIndex),
        isHighlighted: false,
      });
    }

    // Push highlighted match
    chunks.push({
      text: matchedText,
      isHighlighted: true,
    });

    lastIndex = matchIndex + matchedText.length;
  }

  // Push trailing unhighlighted text
  if (lastIndex < sentence.length) {
    chunks.push({
      text: sentence.substring(lastIndex),
      isHighlighted: false,
    });
  }

  return chunks.length > 0 ? chunks : [{ text: sentence, isHighlighted: false }];
}

/**
 * Highlights target word (with English inflections) in an English example sentence.
 */
export function highlightEnglishExample(
  example: string,
  targetWord: string
): TextChunk[] {
  if (!example || !targetWord) {
    return [{ text: example || "", isHighlighted: false }];
  }

  const variants = getEnglishWordVariants(targetWord);
  return chunkSentenceByPhrases(example, variants);
}

/**
 * Highlights translated meaning in a Vietnamese example translation sentence.
 * If no matching translated phrase can be reliably identified, returns
 * the sentence untouched without any incorrect highlight.
 */
export function highlightVietnameseTranslation(
  exampleTranslation: string,
  meaning: string
): TextChunk[] {
  if (!exampleTranslation || !meaning) {
    return [{ text: exampleTranslation || "", isHighlighted: false }];
  }

  const candidates = getVietnameseMeaningCandidates(meaning);
  if (candidates.length === 0) {
    return [{ text: exampleTranslation, isHighlighted: false }];
  }

  // Check if any candidate phrase actually appears with boundary in the translation
  const matchedChunks = chunkSentenceByPhrases(exampleTranslation, candidates);
  const hasHighlight = matchedChunks.some((c) => c.isHighlighted);

  // If no candidate was found reliably, return original text unhighlighted
  if (!hasHighlight) {
    return [{ text: exampleTranslation, isHighlighted: false }];
  }

  return matchedChunks;
}
