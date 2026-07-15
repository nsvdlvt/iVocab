export interface AiQuizVocabularyItem {
  id: string;
  word: string;
  meaning: string;
  partOfSpeech: string | null;
  srsLevel: number;
  example?: string | null;
}

export function buildAiQuizPrompt(items: AiQuizVocabularyItem[]): string {
  const vocabLines = items
    .map((item, index) => {
      const meta = [
        `word: ${item.word}`,
        `meaning: ${item.meaning}`,
        `part_of_speech: ${item.partOfSpeech ?? "unknown"}`,
        `srs_level: Lv${item.srsLevel}`,
        item.example ? `example: ${item.example}` : null,
      ]
        .filter(Boolean)
        .join(" | ");

      return `${index + 1}. ${meta}`;
    })
    .join("\n");

  return `You are generating a premium TOEIC/IELTS-style AI Quiz cloze test for an English vocabulary learning app.

Goal:
- Write ONE coherent reading passage of about 300-500 words.
- Insert 10-15 blanks when possible, but adapt to the vocabulary available.
- Each blank must replace exactly one vocabulary word from the list.
- The passage must read naturally and sound like authentic exam material.
- The purpose is contextual vocabulary application, not simple memorization.

Vocabulary priority:
- Use as many words from the provided list as possible.
- Prefer lower SRS levels first: Lv0-Lv2, then Lv3, and finally Lv4.
- Lv5 words should appear rarely unless they are essential for coherence.

Distractors:
- For each question, provide 3 distractors from the same topic, similar meaning, same part of speech, or commonly confused vocabulary.
- Do not use random unrelated English words.
- Distractors must force contextual understanding.

Output rules:
- Return strict JSON only.
- The JSON must match this shape:
{
  "title": "string",
  "passage": "string with __1__, __2__ placeholders inline",
  "questions": [
    {
      "id": 1,
      "word": "target word",
      "blank": "__1__",
      "options": ["correct", "distractor", "distractor", "distractor"],
      "correctAnswer": 0,
      "explanation": "short explanation in Vietnamese",
      "meaning": "meaning of the target word in Vietnamese"
    }
  ]
}

Rules for the passage:
- Keep blanks in order and make sure every blank appears exactly once in the passage.
- The passage must remain grammatical with the blanks inserted.
- Avoid giving away answers via grammar patterns or obvious clues.
- Use the provided vocabulary metadata as the source of truth.

Provided vocabulary:
${vocabLines}`;
}
