export function buildImportPrompt(userContext: string): string {
  return `Return strict JSON only: an array of objects with exactly these fields:
word, ipa, meaning, partOfSpeech, exampleSentence, synonyms, topic.

Rules:
- word stays in English.
- exampleSentence is a natural CEFR B1-B2 English sentence for every item.
- Keep each example 8-18 words and vary the sentence pattern.
- Leave exampleSentence empty only if a sentence is genuinely impossible.
- synonyms is 2-5 common English synonyms when possible, otherwise [].
- No markdown, no explanation.

Input:
${userContext}`;
}
