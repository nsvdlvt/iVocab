export interface ParsedItem {
  id: string;
  word: string;
  meaning: string;
  ipa: string;
  partOfSpeech: string;
  example: string;
  example_translation: string;
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

type MarkdownField =
  | "word"
  | "meaning"
  | "ipa"
  | "partOfSpeech"
  | "example"
  | "example_translation"
  | "synonyms"
  | null;

const markdownHeaderMap: Record<string, MarkdownField> = {
  "từ vựng": "word",
  vocabulary: "word",
  word: "word",
  term: "word",
  "nghĩa": "meaning",
  "ý nghĩa": "meaning",
  meaning: "meaning",
  vietnamese: "meaning",
  definition: "meaning",
  ipa: "ipa",
  pronunciation: "ipa",
  "từ loại": "partOfSpeech",
  "part of speech": "partOfSpeech",
  pos: "partOfSpeech",
  "ví dụ": "example",
  example: "example",
  sentence: "example",
  "câu ví dụ": "example",
  "nghĩa của ví dụ": "example_translation",
  "nghĩa ví dụ": "example_translation",
  "dịch ví dụ": "example_translation",
  "dịch câu ví dụ": "example_translation",
  "bản dịch ví dụ": "example_translation",
  "example translation": "example_translation",
  example_translation: "example_translation",
  "sentence translation": "example_translation",
  translation: "example_translation",
  synonyms: "synonyms",
  synonym: "synonyms",
  "đồng nghĩa": "synonyms",
  "từ đồng nghĩa": "synonyms",
};

function normalizeMarkdownCellValue(value: string): string {
  return value
    .replace(/\\\|/g, "|")
    .replace(/<br\s*\/?>/gi, "\n")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .trim();
}

function splitMarkdownRow(row: string): string[] {
  const trimmed = row.trim();
  const withoutEdges = trimmed.replace(/^\|/, "").replace(/\|$/, "");
  const cells: string[] = [];
  let current = "";
  let escaped = false;

  for (const char of withoutEdges) {
    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (char === "|") {
      cells.push(normalizeMarkdownCellValue(current));
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(normalizeMarkdownCellValue(current));
  return cells;
}

function isMarkdownSeparatorRow(row: string): boolean {
  const trimmed = row.trim();
  if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) return false;

  const parts = splitMarkdownRow(trimmed);
  return parts.length > 0 && parts.every((part) => /^:?-{3,}:?$/.test(part.replace(/\s+/g, "")));
}

export function detectMarkdownTable(text: string): boolean {
  const lines = text.replace(/\r/g, "").split("\n").map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) return false;

  const headerIndex = lines.findIndex((line) => line.startsWith("|") && line.endsWith("|"));
  if (headerIndex < 0 || headerIndex + 1 >= lines.length) return false;

  return isMarkdownSeparatorRow(lines[headerIndex + 1]);
}

function mapMarkdownHeader(rawHeader: string): MarkdownField {
  const cleaned = rawHeader
    .toLowerCase()
    .replace(/[*_`]/g, "")
    .trim();

  return markdownHeaderMap[cleaned] ?? null;
}

export function parseMarkdownTable(text: string): ParsedItem[] {
  const lines = text
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const headerIndex = lines.findIndex((line) => line.startsWith("|") && line.endsWith("|"));
  if (headerIndex < 0 || headerIndex + 1 >= lines.length) return [];

  const headerCells = splitMarkdownRow(lines[headerIndex]);
  const separator = lines[headerIndex + 1];
  if (!isMarkdownSeparatorRow(separator)) return [];

  const columnMap = headerCells.map(mapMarkdownHeader);
  const results: ParsedItem[] = [];

  for (let i = headerIndex + 2; i < lines.length; i++) {
    const line = lines[i];
    if (!line || !line.startsWith("|") || !line.endsWith("|") || isMarkdownSeparatorRow(line)) {
      continue;
    }

    const cells = splitMarkdownRow(line);
    if (cells.every((cell) => cell.length === 0)) continue;

    const row: Record<Exclude<MarkdownField, null>, string> = {
      word: "",
      meaning: "",
      ipa: "",
      partOfSpeech: "",
      example: "",
      example_translation: "",
      synonyms: "",
    };

    for (let col = 0; col < columnMap.length; col++) {
      const field = columnMap[col];
      if (!field) continue;
      row[field] = cells[col] || "";
    }

    const word = row.word;
    const meaning = row.meaning;
    const isValid = word.length > 0 && meaning.length > 0;

    results.push({
      id: `import-row-${i}-${Math.random().toString(36).substr(2, 9)}`,
      word,
      meaning,
      ipa: row.ipa,
      partOfSpeech: row.partOfSpeech,
      example: row.example,
      example_translation: row.example_translation,
      synonyms: row.synonyms,
      isValid,
      rawIndex: i,
    });
  }

  return results;
}

export function parseQuickImportText(
  text: string,
  options: ParseOptions
): ParsedItem[] {
  if (!text) return [];

  if (detectMarkdownTable(text)) {
    return parseMarkdownTable(text);
  }

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
    // 2 parts: word, meaning
    // 3 parts: word, meaning, example
    // 4 parts: word, meaning, ipa, example
    // 5 parts: word, meaning, ipa, partOfSpeech, example
    // 6 parts: word, meaning, ipa, partOfSpeech, example, example_translation (or synonyms)
    // 7 parts: word, meaning, ipa, partOfSpeech, example, example_translation, synonyms
    const word = parts[0] || "";
    const meaning = parts[1] || "";
    let ipa = "";
    let partOfSpeech = "";
    let example = "";
    let example_translation = "";
    let synonyms = "";

    if (parts.length === 3) {
      example = parts[2] || "";
    } else if (parts.length === 4) {
      ipa = parts[2] || "";
      example = parts[3] || "";
    } else if (parts.length === 5) {
      ipa = parts[2] || "";
      partOfSpeech = parts[3] || "";
      example = parts[4] || "";
    } else if (parts.length === 6) {
      ipa = parts[2] || "";
      partOfSpeech = parts[3] || "";
      example = parts[4] || "";
      // Check if parts[5] is likely an example translation or synonyms
      example_translation = parts[5] || "";
    } else if (parts.length >= 7) {
      ipa = parts[2] || "";
      partOfSpeech = parts[3] || "";
      example = parts[4] || "";
      example_translation = parts[5] || "";
      synonyms = parts[6] || "";
    }

    const isValid = word.length > 0 && meaning.length > 0;

    results.push({
      id: `import-row-${i}-${Math.random().toString(36).substr(2, 9)}`,
      word,
      meaning,
      ipa,
      partOfSpeech,
      example,
      example_translation,
      synonyms,
      isValid,
      rawIndex: i,
    });
  }

  return results;
}
