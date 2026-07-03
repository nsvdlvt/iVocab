export interface ParsedItem {
  id: string;
  word: string;
  meaning: string;
  ipa: string;
  partOfSpeech: string;
  example: string;
  synonyms: string; // Comma separated raw string
  isValid: boolean;
  rawIndex: number;
}

export interface ParseOptions {
  termDelimiter: "tab" | "comma" | "custom";
  customTermDelimiter: string;
  cardDelimiter: "newline" | "semicolon" | "custom";
  customCardDelimiter: string;
}

export function parseQuickImportText(
  text: string,
  options: ParseOptions
): ParsedItem[] {
  if (!text) return [];

  // Determine card separator
  let cardSep: string | RegExp = "\n";
  if (options.cardDelimiter === "semicolon") {
    cardSep = ";";
  } else if (options.cardDelimiter === "custom" && options.customCardDelimiter) {
    cardSep = options.customCardDelimiter;
  }

  // Determine term separator
  let termSep: string | RegExp = "\t";
  if (options.termDelimiter === "comma") {
    termSep = ",";
  } else if (options.termDelimiter === "custom" && options.customTermDelimiter) {
    termSep = options.customTermDelimiter;
  }

  const blocks = text.split(cardSep);
  const results: ParsedItem[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const rawLine = blocks[i];
    const trimmedLine = rawLine.replace(/\r/g, "").trim();
    if (!trimmedLine) {
      continue;
    }

    // Split based on separator
    const parts = trimmedLine.split(termSep).map((p) => p.trim());
    
    // Support formats:
    // parts[0] -> word
    // parts[1] -> meaning
    // parts[2] -> ipa
    // parts[3] -> partOfSpeech
    // parts[4] -> example
    // parts[5] -> synonyms
    const word = parts[0] || "";
    const meaning = parts[1] || "";
    const ipa = parts[2] || "";
    const partOfSpeech = parts[3] || "";
    const example = parts[4] || "";
    const synonyms = parts[5] || "";

    const isValid = word.length > 0 && meaning.length > 0;

    results.push({
      id: `import-row-${i}-${Math.random().toString(36).substr(2, 9)}`,
      word,
      meaning,
      ipa,
      partOfSpeech,
      example,
      synonyms,
      isValid,
      rawIndex: i,
    });
  }

  return results;
}
