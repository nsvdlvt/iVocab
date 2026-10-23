export interface ImportPromptOptions {
  input: string;
  mode?: "topic" | "passage" | "words";
  count?: number;
  level?: string;
  tone?: string;
}

export function buildImportPrompt(
  inputOrOptions: string | ImportPromptOptions
): string {
  const options: ImportPromptOptions =
    typeof inputOrOptions === "string"
      ? { input: inputOrOptions }
      : inputOrOptions;

  const mode = options.mode || "topic";
  const count = options.count && options.count > 0 ? options.count : 10;
  const level = options.level && options.level !== "all" ? options.level : "B1-B2";
  const tone = options.tone || "general";

  let modeInstruction = "";
  if (mode === "passage") {
    modeInstruction = `Task: Analyze the provided English text/passage. Extract exactly ${count} of the most useful, high-impact vocabulary words/phrases for language learners (CEFR ${level}). Use the sentence from the text as exampleSentence or adapt it to be concise (8-20 words), and provide its natural Vietnamese translation (exampleTranslation).`;
  } else if (mode === "words") {
    modeInstruction = `Task: Process and standardize the provided vocabulary input. For every English word or item provided in the input, provide/complete: standard IPA pronunciation, accurate concise Vietnamese meaning (2-6 words), part of speech, a natural CEFR ${level} English example sentence (8-18 words), accurate natural Vietnamese translation of the example sentence (exampleTranslation), and 2-4 English synonyms. If translations or partial details are present in the input, use and refine them.`;
  } else {
    modeInstruction = `Task: Generate exactly ${count} practical, high-value English vocabulary words/phrases related to the topic: "${options.input}". Target CEFR level: ${level}. Context tone: ${tone}.`;
  }

  return `You are an expert English-Vietnamese lexicographer and language tutor.
${modeInstruction}

Output format:
Return a strict JSON array of objects. Do NOT wrap in any extra explanation. Each object must have exactly these keys:
- "word": string, English word or short phrasal verb/idiom (lowercase unless proper noun).
- "ipa": string, standard IPA phonetic transcription between slashes, e.g. "/rɪˈzɪl.i.ənt/".
- "meaning": string, BẮT BUỘC LÀ NGHĨA TIẾNG VIỆT NGẮN GỌN (2 - 6 từ, tối đa 8 từ, súc tích, tự nhiên, dễ nhớ khi học flashcard, tuyệt đối KHÔNG giải thích dài dòng, KHÔNG dùng tiếng Anh). Ví dụ cho 'agitated': 'bồn chồn, kích động'.
- "partOfSpeech": string, standard part of speech abbreviation: "noun", "verb", "adjective", "adverb", "phrasal verb", "idiom", or "phrase".
- "exampleSentence": string, a natural, modern CEFR ${level} English example sentence (8-18 words) demonstrating correct grammatical usage.
- "exampleTranslation": string, bản dịch tiếng Việt chuẩn xác, tự nhiên của câu ví dụ tiếng Anh trên (chứa từ/cụm từ tương ứng với nghĩa từ vựng).
- "synonyms": array of strings, 2-4 common English synonyms (e.g. ["tough", "hardy"]). If none exist, [].
- "topic": string, brief category or topic label in Vietnamese or English (e.g. "Environment", "Công nghệ").

Rules:
1. ONLY return the raw JSON array starting with [ and ending with ].
2. No Markdown formatting, no code fences, no introductory or trailing text.
3. Every item MUST have all 8 fields filled.
4. Vietnamese meanings and example translations must be accurate, natural, and flashcard-friendly.

Input:
${options.input}`;
}
