export function buildImportPrompt(userContext: string): string {
  return `Return strict JSON only: an array of objects with exactly these fields:
word, ipa, meaning, partOfSpeech, exampleSentence, synonyms, topic.

Rules:
- word: stays in English.
- meaning: BẮT BUỘC PHẢI LÀ NGHĨA TIẾNG VIỆT. Nghĩa ngắn gọn, súc tích, tự nhiên và dễ nhớ khi học flashcard (khoảng 2 - 6 từ, tối đa 10 từ, tuyệt đối không viết thành đoạn giải thích dài dòng như từ điển, TUYỆT ĐỐI KHÔNG DÙNG TIẾNG ANH). Ví dụ cho 'agitated': 'bồn chồn, lo lắng, kích động'.
- exampleSentence: a natural CEFR B1-B2 English sentence for every item.
- Keep each example 8-18 words and vary the sentence pattern.
- Leave exampleSentence empty only if a sentence is genuinely impossible.
- synonyms: 2-5 common English synonyms when possible, otherwise [].
- No markdown, no explanation.

Input:
${userContext}`;
}

