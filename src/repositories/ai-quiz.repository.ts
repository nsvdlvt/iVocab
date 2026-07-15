import { ReviewRepository } from "@/repositories/review.repository";
import { generateAiQuiz } from "@/lib/ai/quiz";

type AiQuizItem = {
  id: string;
  word: string;
  meaning: string;
  partOfSpeech: string | null;
  srsLevel: number;
  example?: string | null;
};

export const MIN_AI_QUIZ_WORDS = 8;
const AI_QUIZ_PROMPT_LIMIT = 15;

function levelFromStatus(status: string | null | undefined): number {
  if (status === "lv1") return 1;
  if (status === "lv2") return 2;
  if (status === "lv3") return 3;
  if (status === "lv4") return 4;
  if (status === "lv5") return 5;
  return 0;
}

function rankItem(item: AiQuizItem): number {
  return item.srsLevel * 100 + (item.partOfSpeech ? 0 : 10);
}

export const AiQuizRepository = {
  async buildVocabularyPool(userId: string, setId: string, limit = 30): Promise<AiQuizItem[]> {
    const rows = await ReviewRepository.getBySetId(userId, setId);
    const items = rows.map((row) => ({
      id: row.id,
      word: row.word,
      meaning: row.meaning,
      partOfSpeech: row.part_of_speech,
      srsLevel: levelFromStatus(row.review?.status),
      example: row.example,
    }));

    return items.sort((a, b) => rankItem(a) - rankItem(b)).slice(0, limit);
  },

  async generate(userId: string, setId: string, signal?: AbortSignal) {
    const pool = (await AiQuizRepository.buildVocabularyPool(userId, setId, AI_QUIZ_PROMPT_LIMIT)).slice(0, AI_QUIZ_PROMPT_LIMIT);
    if (pool.length < MIN_AI_QUIZ_WORDS) return null;
    const quiz = await generateAiQuiz(pool, signal);
    console.info("[AI Quiz] generated via provider", {
      userId,
      setId,
      source: "ai",
      questionCount: quiz.questions.length,
    });
    return { ...quiz, source: "ai" as const };
  },
};
