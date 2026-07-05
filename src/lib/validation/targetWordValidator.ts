/**
 * Target word validation utility for the Sentence Practice mode.
 *
 * Returns one of three explicit states:
 *   - "present"   – the target word appears in the sentence (case‑insensitive, punctuation ignored).
 *   - "missing"   – the target word is definitely not present.
 *   - "uncertain" – the validator cannot confidently decide.
 */

export type TargetWordValidation = "present" | "missing" | "uncertain";

function tokenize(sentence: string): string[] {
  return sentence
    .replace(/[^a-zA-Z0-9\u00C0-\u024F]+/g, " ")
    .trim()
    .toLocaleLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Checks if a token matches the target base word or any common English inflections.
 */
function isInflectionOf(token: string, target: string): boolean {
  if (token === target) return true;

  // 1. Plural / Third-person -s or -es
  if (token.endsWith("s")) {
    if (token.slice(0, -1) === target) return true;
    if (token.endsWith("es") && token.slice(0, -2) === target) return true;
  }

  // 2. Past tense / Participle -ed
  if (token.endsWith("ed")) {
    // e.g. abandoned -> abandon
    if (token.slice(0, -2) === target) return true;
    // e.g. abated -> abate (target ends with e, token ends with d)
    if (target.endsWith("e") && token.slice(0, -1) === target) return true;
    // e.g. abated -> abate (stripping ed, adding e)
    if (target.endsWith("e") && token.slice(0, -2) + "e" === target) return true;
    
    // Consonant doubling: e.g. stopped -> stop
    const stem = token.slice(0, -2);
    if (stem.length > 2 && stem[stem.length - 1] === stem[stem.length - 2]) {
      if (stem.slice(0, -1) === target) return true;
    }
  }

  // 3. Gerund / Continuous -ing
  if (token.endsWith("ing")) {
    // e.g. abandoning -> abandon
    if (token.slice(0, -3) === target) return true;
    // e.g. abating -> abate (stripping ing, adding e)
    if (target.endsWith("e") && token.slice(0, -3) + "e" === target) return true;

    // Consonant doubling: e.g. running -> run
    const stem = token.slice(0, -3);
    if (stem.length > 2 && stem[stem.length - 1] === stem[stem.length - 2]) {
      if (stem.slice(0, -1) === target) return true;
    }
  }

  // 4. Fallback check: prefix matching for regular inflections of at least 4 letters
  if (target.length >= 4 && token.startsWith(target.slice(0, -2))) {
    return true;
  }

  return false;
}

export function validateTargetWord(
  sentence: string,
  targetWord: string
): TargetWordValidation {
  const tokens = tokenize(sentence);
  if (tokens.length === 0) {
    return "uncertain";
  }

  const normalizedTarget = targetWord.trim().toLocaleLowerCase();
  
  // Check if any token matches the target base word or its inflections
  const hasMatch = tokens.some((token) => isInflectionOf(token, normalizedTarget));
  if (hasMatch) {
    return "present";
  }

  return "missing";
}
