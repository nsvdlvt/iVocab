import { LearnOption, VocabularyRow, QuestionDirection } from "./question-types";

export function generateDistractors(
  correctWord: VocabularyRow,
  direction: QuestionDirection,
  pool: VocabularyRow[],
  recentAskedIds: string[] = []
): LearnOption[] {
  const correctText = direction === "en-vi" ? correctWord.meaning : correctWord.word;

  // Filter pool candidates
  const candidates = pool.filter((w) => {
    const text = direction === "en-vi" ? w.meaning : w.word;
    return text !== correctText;
  });

  // Score each candidate based on properties
  const scoredCandidates = candidates.map((w) => {
    let score = 0;

    // 1. Same part of speech (safe check)
    if (w.part_of_speech && correctWord.part_of_speech && w.part_of_speech === correctWord.part_of_speech) {
      score += 10;
    }

    // 2. Word length similarity (safe check)
    const text = direction === "en-vi" ? w.meaning : w.word;
    if (text && correctText) {
      const lenDiff = Math.abs(text.length - correctText.length);
      if (lenDiff <= 3) {
        score += 5;
      }
    }

    // 3. Avoid recently asked word ids if possible
    if (recentAskedIds.includes(w.id)) {
      score -= 8;
    }

    return { word: w, text, score };
  });

  // Sort candidates by score descending and mix in some random variance
  const sorted = scoredCandidates.sort((a, b) => (b.score + Math.random() * 5) - (a.score + Math.random() * 5));

  // Extract unique text choices
  const selectedTexts: string[] = [];
  for (const c of sorted) {
    if (selectedTexts.length >= 3) break;
    if (c.text && !selectedTexts.includes(c.text) && c.text !== correctText) {
      selectedTexts.push(c.text);
    }
  }

  // Fallback to random if there aren't enough
  if (selectedTexts.length < 3) {
    const textPool = Array.from(new Set(pool.map((w) => (direction === "en-vi" ? w.meaning : w.word))));
    for (const text of textPool) {
      if (selectedTexts.length >= 3) break;
      if (text && text !== correctText && !selectedTexts.includes(text)) {
        selectedTexts.push(text);
      }
    }
  }

  const rawOptions = [
    { text: correctText, isCorrect: true },
    ...selectedTexts.map((text) => ({ text, isCorrect: false })),
  ];

  // Shuffle options
  const shuffledOptions = rawOptions.sort(() => Math.random() - 0.5);

  return shuffledOptions.map((opt, index) => ({
    id: `opt-${index}-${Math.random().toString(36).substr(2, 9)}`,
    text: opt.text || "",
    isCorrect: opt.isCorrect,
  }));
}
