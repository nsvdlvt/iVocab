import type {
  ContextualMcqQuestion,
  ClientAdaptiveQuestion,
  AdaptiveAnswerSubmissionResult,
  AdaptiveSessionSummary,
} from "@/lib/ai/schemas/contextual-mcq";
import type { Database } from "@/types/database";

type VocabularyRow = Database["public"]["Tables"]["vocabularies"]["Row"];
type ReviewRow = Database["public"]["Tables"]["reviews"]["Row"];

export interface WordStudyItem {
  id: string;
  word: string;
  meaning: string;
  ipa?: string | null;
  part_of_speech?: string | null;
  example?: string | null;
  example_translation?: string | null;
  synonyms?: string[] | null;
  note?: string | null;
  review?: ReviewRow | null;
}

export interface AdaptiveWordState {
  id: string;
  word: string;
  meaning: string;
  ipa: string | null;
  partOfSpeech: string | null;
  example: string | null;
  example_translation?: string | null;
  synonyms: string[] | null;
  initialSrsLevel: number;
  currentSrsLevel: number;
  consecutiveCorrect: number;
  wrongCount: number;
  totalAttempts: number;
  isMasteredInSession: boolean;
  lastTestedAt?: number;
}

export interface AdaptiveSessionState {
  sessionId: string;
  userId: string;
  setId: string;
  startedAt: number;
  stage: "flashcards" | "practice" | "results";
  selectedWordIds: string[];
  currentCardIndex: number;
  reviewedCardIds: string[];
  words: Map<string, AdaptiveWordState>;
  questionBank: Map<string, ContextualMcqQuestion>;
  askedQuestionIds: string[];
  currentQuestionId?: string | null;
  recentWordIds: string[];
  answersHistory: Array<{
    questionId: string;
    vocabularyId: string;
    isCorrect: boolean;
    selectedOptionIndex?: number;
    timestamp: number;
  }>;
  score: number;
  streak: number;
  highestStreak: number;
}

export class AdaptiveFlowEngine {
  /**
   * Initializes word states from the vocabulary set with SRS mastery.
   */
  static initWordStates(items: WordStudyItem[]): Map<string, AdaptiveWordState> {
    const map = new Map<string, AdaptiveWordState>();

    for (const item of items) {
      let srsLevel = 0;
      const status = item.review?.status;
      if (status === "lv1") srsLevel = 1;
      else if (status === "lv2") srsLevel = 2;
      else if (status === "lv3") srsLevel = 3;
      else if (status === "lv4") srsLevel = 4;
      else if (status === "lv5") srsLevel = 5;

      map.set(item.id, {
        id: item.id,
        word: item.word,
        meaning: item.meaning,
        ipa: item.ipa ?? null,
        partOfSpeech: item.part_of_speech ?? null,
        example: item.example ?? null,
        example_translation: item.example_translation ?? null,
        synonyms: item.synonyms ?? null,
        initialSrsLevel: srsLevel,
        currentSrsLevel: srsLevel,
        consecutiveCorrect: 0,
        wrongCount: 0,
        totalAttempts: 0,
        isMasteredInSession: false,
      });
    }

    return map;
  }

  /**
   * Selects the next word to test based on adaptive priority.
   * Priority:
   * 1. Weak words (wrongCount > 0, not tested on immediately preceding question).
   * 2. Unlearned words with 0 attempts.
   * 3. Words in progress (consecutiveCorrect === 1).
   * Excludes words already mastered in the session unless all words are mastered.
   */
  static selectNextWord(session: AdaptiveSessionState): AdaptiveWordState | null {
    const allWords = Array.from(session.words.values());
    if (allWords.length === 0) return null;

    const unmastered = allWords.filter((w) => !w.isMasteredInSession);
    const candidates = unmastered.length > 0 ? unmastered : allWords;

    // Filter out the word tested in the immediately preceding question to avoid back-to-back repeats
    const lastWordId = session.recentWordIds[session.recentWordIds.length - 1];
    let eligible = candidates.filter((w) => w.id !== lastWordId);
    if (eligible.length === 0) eligible = candidates;

    // Sort by priority weight
    const scored = eligible.map((w) => {
      let priority = 0;
      // High priority for weak words needing recovery
      priority += w.wrongCount * 30;
      // Priority for words never attempted
      if (w.totalAttempts === 0) priority += 20;
      // Priority for words that need 1 more correct answer to master
      if (w.consecutiveCorrect === 1) priority += 15;
      // Decay priority if already answered correctly multiple times
      priority -= w.consecutiveCorrect * 10;
      // Add a small jitter to vary selection
      priority += Math.random() * 5;

      return { word: w, priority };
    });

    scored.sort((a, b) => b.priority - a.priority);
    return scored[0]?.word ?? null;
  }

  /**
   * Determines the adaptive question type and difficulty for a word.
   */
  static getDifficultyForWord(
    wordState: AdaptiveWordState
  ): {
    questionType: "recognition" | "collocation" | "contextual_mcq" | "supportive_hint";
    difficulty: "easy" | "medium" | "challenging";
  } {
    // If the learner just failed this word, offer a supportive hint question
    if (wordState.wrongCount > 0 && wordState.consecutiveCorrect === 0) {
      return {
        questionType: "supportive_hint",
        difficulty: "easy",
      };
    }

    // New or low SRS words start with recognition/collocation
    if (wordState.totalAttempts === 0 && wordState.initialSrsLevel <= 1) {
      return {
        questionType: "recognition",
        difficulty: "easy",
      };
    }

    // After 1 correct answer or for mid-level words, progress to collocation recall
    if (wordState.consecutiveCorrect === 1 || wordState.initialSrsLevel === 2) {
      return {
        questionType: "collocation",
        difficulty: "medium",
      };
    }

    // For higher SRS words or strong streak, test with challenging contextual MCQ
    return {
      questionType: "contextual_mcq",
      difficulty: "challenging",
    };
  }

  /**
   * Transforms an internal question into a client-safe payload (STRIPS ANSWER KEY & EXPLANATION).
   */
  static toClientSafeQuestion(
    q: ContextualMcqQuestion,
    questionNumber: number,
    totalEstimated: number
  ): ClientAdaptiveQuestion {
    return {
      id: q.id,
      vocabularyId: q.vocabularyId,
      targetWord: q.targetWord,
      questionType: q.questionType,
      difficulty: q.difficulty,
      prompt: q.prompt,
      sentence: q.sentence,
      options: [...q.options],
      hint: q.hint,
      questionNumber,
      totalEstimated,
    };
  }

  /**
   * Processes the user's answer and updates the adaptive session state.
   */
  static processAnswer(
    session: AdaptiveSessionState,
    questionId: string,
    selectedOptionIndex: number
  ): AdaptiveAnswerSubmissionResult {
    const question = session.questionBank.get(questionId);
    if (!question) {
      throw new Error(`Question ${questionId} not found in session.`);
    }

    const wordState = session.words.get(question.vocabularyId);
    if (!wordState) {
      throw new Error(`Vocabulary ${question.vocabularyId} not found in session.`);
    }

    const isCorrect = selectedOptionIndex === question.correctAnswerIndex;
    const now = Date.now();

    // Record answer
    session.answersHistory.push({
      questionId,
      vocabularyId: question.vocabularyId,
      isCorrect,
      selectedOptionIndex,
      timestamp: now,
    });
    session.askedQuestionIds.push(questionId);
    session.recentWordIds.push(wordState.id);
    if (session.recentWordIds.length > 5) session.recentWordIds.shift();

    // Update streak and score
    if (isCorrect) {
      session.score = (session.score ?? 0) + 10;
      session.streak = (session.streak ?? 0) + 1;
      session.highestStreak = Math.max(session.highestStreak ?? 0, session.streak);
    } else {
      session.streak = 0;
    }

    // Update word state
    wordState.totalAttempts += 1;
    wordState.lastTestedAt = now;

    if (isCorrect) {
      wordState.consecutiveCorrect += 1;
      // Mark mastered if answered correctly twice in session or once if already advanced
      if (wordState.consecutiveCorrect >= 2 || (wordState.initialSrsLevel >= 3 && wordState.consecutiveCorrect >= 1)) {
        wordState.isMasteredInSession = true;
      }
    } else {
      wordState.consecutiveCorrect = 0;
      wordState.wrongCount += 1;
      wordState.isMasteredInSession = false;
    }

    return {
      isCorrect,
      correctAnswerIndex: question.correctAnswerIndex,
      selectedOptionIndex,
      explanation: question.explanation,
      strongestDistractor: question.strongestDistractor,
      whyDistractorWrong: question.whyDistractorWrong,
      updatedSrsLevel: wordState.currentSrsLevel,
      isWeakWord: wordState.wrongCount > 0,
      example: wordState.example,
      exampleTranslation: wordState.example_translation || question.exampleTranslation || null,
      targetWord: wordState.word,
      meaning: wordState.meaning,
    };
  }

  /**
   * Generates final session summary and personalized recommendation.
   */
  static buildSessionSummary(session: AdaptiveSessionState): AdaptiveSessionSummary {
    const totalQuestions = session.answersHistory.length;
    const correctCount = session.answersHistory.filter((a) => a.isCorrect).length;
    const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    const weakWords: AdaptiveSessionSummary["weakWords"] = [];
    const improvedWords: AdaptiveSessionSummary["improvedWords"] = [];

    for (const wordState of session.words.values()) {
      if (wordState.wrongCount > 0) {
        weakWords.push({
          id: wordState.id,
          word: wordState.word,
          meaning: wordState.meaning,
          ipa: wordState.ipa,
          example: wordState.example,
          example_translation: wordState.example_translation,
          wrongCount: wordState.wrongCount,
        });
      }

      if (wordState.consecutiveCorrect >= 2 || (wordState.consecutiveCorrect >= 1 && wordState.wrongCount === 0)) {
        improvedWords.push({
          id: wordState.id,
          word: wordState.word,
          meaning: wordState.meaning,
          example: wordState.example,
          example_translation: wordState.example_translation,
          previousLevel: wordState.initialSrsLevel,
          newLevel: Math.min(5, wordState.initialSrsLevel + 1),
        });
      }
    }

    // Build personalized feedback
    let recommendation = "";
    if (accuracy >= 90) {
      recommendation =
        "Xuất sắc! Bạn nắm rất vững nghĩa, ngữ cảnh và các cụm collocations của bộ từ vựng này. Hãy tiếp tục duy trì bằng cách ôn tập SRS hoặc thử thách viết câu.";
    } else if (accuracy >= 70) {
      if (weakWords.length > 0) {
        const sampleWords = weakWords.slice(0, 3).map((w) => `"${w.word}"`).join(", ");
        recommendation = `Kết quả rất khả quan! Hãy chú ý ôn luyện thêm các từ ${sampleWords} vì đây là các từ có sự phân biệt ngữ cảnh và collocations tinh tế.`;
      } else {
        recommendation =
          "Luyện tập rất tốt! Độ chính xác ổn định, bạn đã hiểu rõ phần lớn ngữ cảnh của bộ từ vựng này.";
      }
    } else {
      const sampleWords = weakWords.slice(0, 3).map((w) => `"${w.word}"`).join(", ");
      recommendation = `Bạn đã nỗ lực hoàn thành bài tập! Các câu hỏi ngữ cảnh đòi hỏi sự phân biệt chính xác. Hãy ôn lại Flashcards hoặc bấm "Luyện từ chưa thuộc" để củng cố các từ ${sampleWords || "còn vướng mắc"}.`;
    }

    return {
      sessionId: session.sessionId,
      setId: session.setId,
      totalQuestions,
      correctCount,
      accuracy,
      weakWords,
      improvedWords,
      aiRecommendation: recommendation,
    };
  }
}
