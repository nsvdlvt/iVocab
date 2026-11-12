import { LearnOption, VocabularyRow, QuestionDirection } from "./question-types";

export function formatCompactMeaning(meaning?: string | null): string {
  if (!meaning) return "";
  const cleaned = meaning
    .replace(/^\s*\((?:n|v|adj|adv|prep|conj|pron|idm|phr v)\)\s*/i, "")
    .trim();
  if (!cleaned) return "";

  // Split multiple meanings by semicolon
  const parts = cleaned.split(/;\s*/).map((p) => p.trim()).filter(Boolean);
  if (parts.length <= 1) return cleaned;

  // Keep first two if compact, otherwise keep first
  if (parts[0].length >= 30) return parts[0];
  const combined = `${parts[0]}; ${parts[1]}`;
  if (combined.length <= 55) return combined;
  return parts[0];
}

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

  // Extract unique choices with full word details
  const selectedCandidates: Array<{ text: string; english: string; meaning: string }> = [];
  for (const c of sorted) {
    if (selectedCandidates.length >= 3) break;
    if (c.text && !selectedCandidates.some((item) => item.text === c.text) && c.text !== correctText) {
      selectedCandidates.push({
        text: c.text,
        english: c.word.word || "",
        meaning: formatCompactMeaning(c.word.meaning),
      });
    }
  }

  // Fallback to random pool items if there aren't enough
  if (selectedCandidates.length < 3) {
    for (const w of pool) {
      if (selectedCandidates.length >= 3) break;
      const text = direction === "en-vi" ? w.meaning : w.word;
      if (text && text !== correctText && !selectedCandidates.some((item) => item.text === text)) {
        selectedCandidates.push({
          text,
          english: w.word || "",
          meaning: formatCompactMeaning(w.meaning),
        });
      }
    }
  }

  const rawOptions = [
    {
      text: correctText,
      english: correctWord.word || "",
      meaning: formatCompactMeaning(correctWord.meaning),
      isCorrect: true,
    },
    ...selectedCandidates.map((c) => ({
      text: c.text,
      english: c.english,
      meaning: c.meaning,
      isCorrect: false,
    })),
  ];

  // Shuffle options
  const shuffledOptions = rawOptions.sort(() => Math.random() - 0.5);

  return shuffledOptions.map((opt, index) => ({
    id: `opt-${index}-${Math.random().toString(36).substr(2, 9)}`,
    text: opt.text || "",
    english: opt.english || "",
    meaning: opt.meaning || "",
    isCorrect: opt.isCorrect,
  }));
}
