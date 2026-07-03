import { Database } from "@/types/database";
import { VocabularyRepository } from "./vocabulary.repository";

type VocabularyRow = Database["public"]["Tables"]["vocabularies"]["Row"];

export interface QuizQuestion {
  id: string;
  word: string;
  correctAnswer: string;
  options: string[]; // 4 shuffled choices
  correctIndex: number;
  explanation: string;
}

/** Minimum number of vocabulary items required to generate a quiz. */
export const MIN_QUIZ_WORDS = 4;

/**
 * Fisher-Yates shuffle — mutates the array in place and returns it.
 */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const QuizRepository = {
  /**
   * Builds quiz questions from the user's vocabulary.
   *
   * Each question is of the type:
   *   "Which meaning matches [word]?" with 4 options (correct meaning + 3 distractors).
   *
   * @param userId   The authenticated user's ID.
   * @param count    Number of quiz questions to generate.
   * @returns        Array of QuizQuestion, or empty array if not enough words.
   */
  async generateQuestions(userId: string, count = 10): Promise<QuizQuestion[]> {
    const pool: VocabularyRow[] = await VocabularyRepository.getForQuiz(userId, 80);

    if (pool.length < MIN_QUIZ_WORDS) return [];

    const shuffledPool = shuffle([...pool]);
    const questionWords = shuffledPool.slice(0, count);

    return questionWords.map((vocabItem) => {
      const correctAnswer = vocabItem.meaning;

      // Pick 3 random distractors from the pool (excluding the current word)
      const distractorPool = shuffledPool
        .filter((v) => v.id !== vocabItem.id)
        .slice(0, 20);

      const distractors = shuffle(distractorPool)
        .slice(0, 3)
        .map((v) => v.meaning);

      // Shuffle correct answer + distractors together
      const allOptions = shuffle([correctAnswer, ...distractors]);
      const correctIndex = allOptions.indexOf(correctAnswer);

      return {
        id: vocabItem.id,
        word: vocabItem.word,
        correctAnswer,
        options: allOptions,
        correctIndex,
        explanation: vocabItem.example
          ? `Ví dụ: "${vocabItem.example}"`
          : `Nghĩa: ${correctAnswer}`,
      };
    });
  },
};
