import type {
  AdaptiveSessionState,
  AdaptiveWordState,
  WordStudyItem,
} from "./adaptive-flow-engine";
import { AdaptiveFlowEngine } from "./adaptive-flow-engine";
import type {
  ContextualMcqQuestion,
  ClientAdaptiveQuestion,
  AdaptiveAnswerSubmissionResult,
  AdaptiveSessionSummary,
} from "@/lib/ai/schemas/contextual-mcq";
import {
  generateContextualMcqs,
  generateDeterministicFallbackQuestions,
} from "@/lib/ai/contextual-mcq";
import {
  LearningSessionRepository,
  LearningSessionRow,
} from "@/repositories/learning-session.repository";
import { ReviewRepository } from "@/repositories/review.repository";
import { VocabSetRepository } from "@/repositories/vocab-set.repository";
import { LearningProgressService } from "@/lib/statistics/learning-progress.service";
import type { Json } from "@/types/database";

const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

class AdaptiveSessionStoreManager {
  private memoryCache = new Map<string, { state: AdaptiveSessionState; cachedAt: number }>();
  private completedSummaries = new Map<string, AdaptiveSessionSummary>();

  private cleanupCache() {
    const now = Date.now();
    for (const [id, entry] of this.memoryCache.entries()) {
      if (now - entry.cachedAt > SESSION_TTL_MS) {
        this.memoryCache.delete(id);
      }
    }
  }

  /**
   * Deserializes a database row into an AdaptiveSessionState.
   */
  private rowToSessionState(row: LearningSessionRow): AdaptiveSessionState {
    const wordStatesMap = new Map<string, AdaptiveWordState>();
    if (row.word_states && typeof row.word_states === "object") {
      for (const [k, v] of Object.entries(row.word_states as unknown as Record<string, AdaptiveWordState>)) {
        wordStatesMap.set(k, v);
      }
    }

    const questionBankMap = new Map<string, ContextualMcqQuestion>();
    if (Array.isArray(row.question_bank)) {
      for (const q of row.question_bank as unknown as ContextualMcqQuestion[]) {
        if (q && q.id) questionBankMap.set(q.id, q);
      }
    }

    return {
      sessionId: row.id,
      userId: row.user_id,
      setId: row.vocabulary_set_id,
      startedAt: new Date(row.created_at).getTime(),
      stage: row.stage,
      selectedWordIds: row.selected_word_ids ?? [],
      currentCardIndex: row.current_card_index ?? 0,
      reviewedCardIds: row.reviewed_card_ids ?? [],
      words: wordStatesMap,
      questionBank: questionBankMap,
      askedQuestionIds: row.asked_question_ids ?? [],
      currentQuestionId: row.current_question_id ?? null,
      recentWordIds: [],
      answersHistory: Array.isArray(row.answers_history)
        ? (row.answers_history as AdaptiveSessionState["answersHistory"])
        : [],
      score: row.score ?? 0,
      streak: row.streak ?? 0,
      highestStreak: row.highest_streak ?? 0,
    };
  }

  /**
   * Serializes an AdaptiveSessionState for DB insertion/update.
   */
  private sessionStateToRowUpdates(session: AdaptiveSessionState): {
    stage: "flashcards" | "practice" | "results";
    selected_word_ids: string[];
    current_card_index: number;
    reviewed_card_ids: string[];
    question_bank: Json;
    asked_question_ids: string[];
    current_question_id: string | null;
    word_states: Json;
    answers_history: Json;
    score: number;
    streak: number;
    highest_streak: number;
  } {
    return {
      stage: session.stage,
      selected_word_ids: session.selectedWordIds,
      current_card_index: session.currentCardIndex,
      reviewed_card_ids: session.reviewedCardIds,
      question_bank: Array.from(session.questionBank.values()) as unknown as Json,
      asked_question_ids: session.askedQuestionIds,
      current_question_id: session.currentQuestionId ?? null,
      word_states: Object.fromEntries(session.words) as unknown as Json,
      answers_history: session.answersHistory as unknown as Json,
      score: session.score,
      streak: session.streak,
      highest_streak: session.highestStreak,
    };
  }

  /**
   * Initializes and persists an adaptive learning session for exactly the selected words.
   */
  async createSession(
    userId: string,
    setId: string,
    words: WordStudyItem[],
    options?:
      | ContextualMcqQuestion[]
      | {
          pregeneratedQuestions?: ContextualMcqQuestion[];
          initialStage?: "flashcards" | "practice";
        }
  ): Promise<{
    sessionId: string;
    firstQuestion: ClientAdaptiveQuestion | null;
    totalWords: number;
    stage: "flashcards" | "practice" | "results";
  }> {
    this.cleanupCache();

    if (words.length === 0) {
      throw new Error("Không có từ vựng nào được chọn để bắt đầu phiên học.");
    }

    const pregeneratedQuestions = Array.isArray(options)
      ? options
      : options?.pregeneratedQuestions;
    const initialStage = Array.isArray(options)
      ? "flashcards"
      : options?.initialStage ?? "flashcards";

    const wordStates = AdaptiveFlowEngine.initWordStates(words);
    const questionBank = new Map<string, ContextualMcqQuestion>();

    if (pregeneratedQuestions && pregeneratedQuestions.length > 0) {
      for (const q of pregeneratedQuestions) {
        questionBank.set(q.id, q);
      }
    } else {
      // Build inputs from the exact selected words
      const vocabInputs = words.map((w) => ({
        id: w.id,
        word: w.word,
        meaning: w.meaning,
        partOfSpeech: w.part_of_speech ?? null,
        ipa: w.ipa ?? null,
        example: w.example ?? null,
        example_translation: w.example_translation ?? null,
        synonyms: w.synonyms ?? null,
        note: w.note ?? null,
        srsLevel: wordStates.get(w.id)?.initialSrsLevel ?? 0,
      }));

      try {
        const questions = await generateContextualMcqs(
          vocabInputs,
          Math.max(words.length, 5)
        );
        for (const q of questions) {
          questionBank.set(q.id, q);
        }
      } catch (err) {
        console.warn("[AdaptiveSessionStore] AI generation failed, using deterministic fallback:", err);
        const fallback = generateDeterministicFallbackQuestions(vocabInputs);
        for (const q of fallback) {
          questionBank.set(q.id, q);
        }
      }
    }

    const selectedWordIds = words.map((w) => w.id);

    // Persist new session into database
    let dbRow: LearningSessionRow | null = null;
    try {
      dbRow = await LearningSessionRepository.createSession(userId, setId, {
        stage: initialStage,
        selected_word_ids: selectedWordIds,
        current_card_index: 0,
        reviewed_card_ids: [],
        question_bank: Array.from(questionBank.values()) as unknown as Json,
        asked_question_ids: [],
        current_question_id: null,
        word_states: Object.fromEntries(wordStates) as unknown as Json,
        answers_history: [],
        score: 0,
        streak: 0,
        highest_streak: 0,
        is_mastery_updated: false,
      });
    } catch (dbErr) {
      console.warn("[AdaptiveSessionStore] DB persistence fallback to memory:", dbErr);
    }

    const sessionId = dbRow
      ? dbRow.id
      : typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `00000000-0000-4000-8000-${Date.now().toString(16).padStart(12, "0")}`;

    const sessionState: AdaptiveSessionState = {
      sessionId,
      userId,
      setId,
      startedAt: Date.now(),
      stage: initialStage,
      selectedWordIds,
      currentCardIndex: 0,
      reviewedCardIds: [],
      words: wordStates,
      questionBank,
      askedQuestionIds: [],
      currentQuestionId: null,
      recentWordIds: [],
      answersHistory: [],
      score: 0,
      streak: 0,
      highestStreak: 0,
    };

    // Pick first question if already in or entering practice
    const firstQuestion = await this.getNextClientQuestion(sessionState);
    if (firstQuestion) {
      sessionState.currentQuestionId = firstQuestion.id;
      if (dbRow) {
        await LearningSessionRepository.updateSession(sessionId, userId, {
          current_question_id: firstQuestion.id,
        }).catch(() => {});
      }
    }

    this.memoryCache.set(sessionId, { state: sessionState, cachedAt: Date.now() });

    return {
      sessionId,
      firstQuestion,
      totalWords: words.length,
      stage: initialStage,
    };
  }

  /**
   * Retrieves an active unfinished session for a user and vocabulary set.
   * Backed by the database so progress survives tab/browser closing and server restarts.
   */
  async getActiveSession(
    userId: string,
    setId: string
  ): Promise<{
    session: AdaptiveSessionState;
    currentQuestion: ClientAdaptiveQuestion | null;
    rawRow: LearningSessionRow;
  } | null> {
    const dbRow = await LearningSessionRepository.getActiveSession(userId, setId);
    if (!dbRow) return null;

    let sessionState: AdaptiveSessionState;
    const cached = this.memoryCache.get(dbRow.id);

    if (cached) {
      sessionState = cached.state;
    } else {
      sessionState = this.rowToSessionState(dbRow);
      this.memoryCache.set(dbRow.id, { state: sessionState, cachedAt: Date.now() });
    }

    // Determine current client question
    let currentQuestion: ClientAdaptiveQuestion | null = null;
    if (sessionState.currentQuestionId) {
      const q = sessionState.questionBank.get(sessionState.currentQuestionId);
      if (q) {
        currentQuestion = AdaptiveFlowEngine.toClientSafeQuestion(
          q,
          sessionState.askedQuestionIds.length + 1,
          Math.max(sessionState.words.size, 5)
        );
      }
    }

    if (!currentQuestion && sessionState.stage === "practice") {
      currentQuestion = await this.getNextClientQuestion(sessionState);
      if (currentQuestion) {
        sessionState.currentQuestionId = currentQuestion.id;
        await LearningSessionRepository.updateSession(sessionState.sessionId, userId, {
          current_question_id: currentQuestion.id,
        });
      }
    }

    return {
      session: sessionState,
      currentQuestion,
      rawRow: dbRow,
    };
  }

  /**
   * Retrieves a session by ID, scoped to user.
   */
  async getSession(sessionId: string, userId: string): Promise<AdaptiveSessionState | null> {
    const cached = this.memoryCache.get(sessionId);
    if (cached && cached.state.userId === userId) {
      return cached.state;
    }

    const row = await LearningSessionRepository.getSessionById(sessionId, userId);
    if (!row) return null;

    const sessionState = this.rowToSessionState(row);
    this.memoryCache.set(sessionId, { state: sessionState, cachedAt: Date.now() });
    return sessionState;
  }

  /**
   * Checkpoints learning stage and card index into DB.
   */
  async saveCheckpoint(
    sessionId: string,
    userId: string,
    updates: {
      stage?: "flashcards" | "practice" | "results";
      currentCardIndex?: number;
      reviewedCardIds?: string[];
    }
  ): Promise<void> {
    const session = await this.getSession(sessionId, userId);
    if (session) {
      if (updates.stage) session.stage = updates.stage;
      if (typeof updates.currentCardIndex === "number") {
        session.currentCardIndex = updates.currentCardIndex;
      }
      if (updates.reviewedCardIds) {
        session.reviewedCardIds = updates.reviewedCardIds;
      }
    }

    await LearningSessionRepository.updateSession(sessionId, userId, {
      stage: updates.stage,
      current_card_index: updates.currentCardIndex,
      reviewed_card_ids: updates.reviewedCardIds,
    });
  }

  /**
   * Generates or selects the next client question based on adaptive state.
   */
  async getNextClientQuestion(
    session: AdaptiveSessionState
  ): Promise<ClientAdaptiveQuestion | null> {
    const targetWord = AdaptiveFlowEngine.selectNextWord(session);
    if (!targetWord) return null;

    // Look for an unused question in the bank for this target word
    let question = Array.from(session.questionBank.values()).find(
      (q) => q.vocabularyId === targetWord.id && !session.askedQuestionIds.includes(q.id)
    );

    // If no unused question is in bank, dynamically generate or fallback
    if (!question) {
      const vocabInput = {
        id: targetWord.id,
        word: targetWord.word,
        meaning: targetWord.meaning,
        partOfSpeech: targetWord.partOfSpeech,
        ipa: targetWord.ipa,
        example: targetWord.example,
        example_translation: targetWord.example_translation,
        synonyms: targetWord.synonyms,
        srsLevel: targetWord.currentSrsLevel,
        isWeak: targetWord.wrongCount > 0,
      };

      try {
        const generated = await generateContextualMcqs([vocabInput], 1);
        if (generated && generated.length > 0) {
          question = generated[0];
          session.questionBank.set(question.id, question);
        }
      } catch {
        const fallback = generateDeterministicFallbackQuestions([vocabInput]);
        if (fallback.length > 0) {
          question = fallback[0];
          session.questionBank.set(question.id, question);
        }
      }
    }

    if (!question) return null;

    const questionNumber = session.askedQuestionIds.length + 1;
    const totalEstimated = Math.max(session.words.size, 5);

    return AdaptiveFlowEngine.toClientSafeQuestion(
      question,
      questionNumber,
      totalEstimated
    );
  }

  /**
   * Evaluates an answer submission on the server and updates DB checkpoint atomically.
   */
  async submitAnswer(
    sessionId: string,
    userId: string,
    questionId: string,
    selectedOptionIndex: number
  ): Promise<AdaptiveAnswerSubmissionResult> {
    const session = await this.getSession(sessionId, userId);
    if (!session) {
      throw new Error("Không tìm thấy phiên học hoặc phiên đã hết hạn.");
    }

    if (session.askedQuestionIds.includes(questionId)) {
      throw new Error("This question has already been submitted.");
    }

    const result = AdaptiveFlowEngine.processAnswer(
      session,
      questionId,
      selectedOptionIndex
    );

    // Check completion criteria:
    // All words tested at least once AND no active unaddressed weak words,
    // OR question count reaches target limit (e.g. 15 questions)
    const allWordsAttempted = Array.from(session.words.values()).every(
      (w) => w.totalAttempts > 0
    );
    const hasUnresolvedWeak = Array.from(session.words.values()).some(
      (w) => w.wrongCount > 0 && w.consecutiveCorrect === 0
    );

    const questionCount = session.answersHistory.length;
    const shouldFinish =
      (allWordsAttempted && !hasUnresolvedWeak && questionCount >= Math.min(session.words.size, 5)) ||
      questionCount >= Math.max(session.words.size * 2, 15);

    if (shouldFinish) {
      result.sessionCompleted = true;
      result.nextQuestion = null;
      session.currentQuestionId = null;
    } else {
      result.nextQuestion = await this.getNextClientQuestion(session);
      if (!result.nextQuestion) {
        result.sessionCompleted = true;
        session.currentQuestionId = null;
      } else {
        session.currentQuestionId = result.nextQuestion.id;
      }
    }

    // Persist answer progress to DB
    await LearningSessionRepository.updateSession(
      sessionId,
      userId,
      this.sessionStateToRowUpdates(session)
    ).catch((err) => {
      console.warn("[AdaptiveSessionStore] updateSession fallback:", err);
    });

    return result;
  }

  /**
   * Provides a supportive hint for a question.
   */
  async getHint(sessionId: string, userId: string, questionId: string): Promise<string | null> {
    const session = await this.getSession(sessionId, userId);
    if (!session) return null;

    const question = session.questionBank.get(questionId);
    if (!question) return null;

    return question.hint || `Hãy chú ý đến nghĩa "${question.targetWord}" trong ngữ cảnh câu.`;
  }

  /**
   * Safely abandons an active session so user can "Tạo lại bài".
   */
  async abandonSession(userId: string, setId: string): Promise<void> {
    await LearningSessionRepository.abandonActiveSession(userId, setId);
    this.memoryCache.clear();
  }

  /**
   * Completes a session, builds summary report, and updates vocabulary mastery idempotently.
   * Marks session as completed so it is NEVER restored as an active session.
   */
  async finishSession(
    sessionId: string,
    userId: string
  ): Promise<AdaptiveSessionSummary | null> {
    if (this.completedSummaries.has(sessionId)) {
      return this.completedSummaries.get(sessionId)!;
    }

    let rawRow: LearningSessionRow | null = null;
    try {
      rawRow = await LearningSessionRepository.getSessionById(sessionId, userId);
    } catch {}

    // 1. Idempotency check: if session already completed, return existing summary
    if (rawRow?.status === "completed" && rawRow.summary) {
      const summary = rawRow.summary as unknown as AdaptiveSessionSummary;
      this.completedSummaries.set(sessionId, summary);
      return summary;
    }

    const session = rawRow ? this.rowToSessionState(rawRow) : (await this.getSession(sessionId, userId));
    if (!session) return null;

    const summary = AdaptiveFlowEngine.buildSessionSummary(session);
    this.completedSummaries.set(sessionId, summary);

    // 2. Update vocabulary mastery based on session evidence
    try {
      for (const wordState of session.words.values()) {
        const isMasteredOrConsistentlyCorrect =
          wordState.consecutiveCorrect >= 2 ||
          (wordState.consecutiveCorrect >= 1 && wordState.wrongCount === 0);

        const hasMistakes = wordState.wrongCount > 0;

        if (isMasteredOrConsistentlyCorrect) {
          await ReviewRepository.processResult({
            userId,
            vocabularyId: wordState.id,
            mode: "learn",
            answerResult: "correct",
          }).catch((err) => console.warn("[finishSession] SRS correct update error:", err));
        } else if (hasMistakes) {
          await ReviewRepository.processResult({
            userId,
            vocabularyId: wordState.id,
            mode: "learn",
            answerResult: "wrong",
          }).catch((err) => console.warn("[finishSession] SRS wrong update error:", err));
        }
      }

      // Record study activity
      await LearningProgressService.recordActivity(
        userId,
        session.words.size,
        0,
        "learn"
      ).catch((err) => console.warn("[finishSession] LearningProgress error:", err));

      // Touch last studied at
      await VocabSetRepository.touchLastStudiedAt(session.setId, userId).catch((err) =>
        console.warn("[finishSession] touchLastStudiedAt error:", err)
      );
    } catch (err) {
      console.error("[finishSession] Error updating vocabulary mastery:", err);
    }

    // 3. Mark session completed in DB with summary
    await LearningSessionRepository.completeSession(
      sessionId,
      userId,
      summary as unknown as Json,
      true
    ).catch((err) => {
      console.warn("[finishSession] completeSession DB warning:", err);
    });

    // 4. Invalidate memory cache for this session
    this.memoryCache.delete(sessionId);

    return summary;
  }
}

export const AdaptiveSessionStore = new AdaptiveSessionStoreManager();
