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
   * Ensures a question has a stable, globally unique ID within this session,
   * completely preventing collisions with existing questions or askedQuestionIds.
   */
  private ensureUniqueQuestion(
    question: ContextualMcqQuestion,
    sessionId: string,
    existingIds: Set<string>
  ): ContextualMcqQuestion {
    let qId = question.id ? question.id.trim() : "";
    // If empty or already used in existingIds
    if (!qId || existingIds.has(qId)) {
      const rand =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID().slice(0, 8)
          : Math.random().toString(36).slice(2, 8);
      const prefix = sessionId && sessionId !== "init" ? sessionId.slice(0, 8) : "s";
      qId = `q_${prefix}_${question.vocabularyId}_${Date.now()}_${rand}`;
    }
    existingIds.add(qId);
    return { ...question, id: qId };
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
    const existingIds = new Set<string>();

    if (pregeneratedQuestions && pregeneratedQuestions.length > 0) {
      for (const q of pregeneratedQuestions) {
        const uniqueQ = this.ensureUniqueQuestion(q, "init", existingIds);
        questionBank.set(uniqueQ.id, uniqueQ);
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
          const uniqueQ = this.ensureUniqueQuestion(q, "init", existingIds);
          questionBank.set(uniqueQ.id, uniqueQ);
        }
      } catch (err) {
        console.warn("[AdaptiveSessionStore] AI generation failed, using deterministic fallback:", err);
        const fallback = generateDeterministicFallbackQuestions(vocabInputs);
        for (const q of fallback) {
          const uniqueQ = this.ensureUniqueQuestion(q, "init", existingIds);
          questionBank.set(uniqueQ.id, uniqueQ);
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
    let dbRow: LearningSessionRow | null = null;
    try {
      dbRow = await LearningSessionRepository.getActiveSession(userId, setId);
    } catch {}

    let sessionState: AdaptiveSessionState | null = null;

    if (dbRow) {
      const cached = this.memoryCache.get(dbRow.id);
      if (cached) {
        sessionState = cached.state;
      } else {
        sessionState = this.rowToSessionState(dbRow);
        this.memoryCache.set(dbRow.id, { state: sessionState, cachedAt: Date.now() });
      }
    } else {
      // Memory cache fallback for tests and offline resilience
      const cachedEntry = Array.from(this.memoryCache.values()).find(
        (e) => e.state.userId === userId && e.state.setId === setId
      );
      if (cachedEntry) {
        sessionState = cachedEntry.state;
      }
    }

    if (!sessionState) return null;

    // Determine current client question
    let currentQuestion: ClientAdaptiveQuestion | null = null;
    if (
      sessionState.currentQuestionId &&
      !sessionState.askedQuestionIds.includes(sessionState.currentQuestionId)
    ) {
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
        }).catch(() => {});
      }
    }

    return {
      session: sessionState,
      currentQuestion,
      rawRow: dbRow ?? ({} as LearningSessionRow),
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

      const existingIds = new Set<string>([
        ...Array.from(session.questionBank.keys()),
        ...session.askedQuestionIds,
      ]);

      try {
        const generated = await generateContextualMcqs([vocabInput], 1);
        if (generated && generated.length > 0) {
          question = this.ensureUniqueQuestion(
            generated[0],
            session.sessionId,
            existingIds
          );
          session.questionBank.set(question.id, question);
        }
      } catch {
        const fallback = generateDeterministicFallbackQuestions([vocabInput]);
        if (fallback.length > 0) {
          question = this.ensureUniqueQuestion(
            fallback[0],
            session.sessionId,
            existingIds
          );
          session.questionBank.set(question.id, question);
        }
      }
    }

    if (!question) return null;

    // Safety guard: if question.id is somehow in askedQuestionIds, guarantee a fresh ID
    if (session.askedQuestionIds.includes(question.id)) {
      console.warn(
        `[AdaptiveSessionStore] Collision prevented: Question ${question.id} was already in askedQuestionIds. Generating fresh unique ID.`
      );
      const existingIds = new Set<string>([
        ...Array.from(session.questionBank.keys()),
        ...session.askedQuestionIds,
      ]);
      question = this.ensureUniqueQuestion(
        question,
        session.sessionId,
        existingIds
      );
      session.questionBank.set(question.id, question);
    }

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
   * Fully idempotent: duplicate clicks, network retries, or re-submissions safely return
   * the existing evaluation result and next question without corrupting score, streak, or history.
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

    // 1. Idempotency Check: Was this question already submitted in this session?
    if (session.askedQuestionIds.includes(questionId)) {
      const existingAnswer = session.answersHistory.find(
        (a) => a.questionId === questionId
      );

      if (existingAnswer) {
        console.warn(
          `[AdaptiveSessionStore] Idempotent answer submission for question ${questionId} in session ${sessionId}`
        );

        const question = session.questionBank.get(questionId);
        const wordState = question ? session.words.get(question.vocabularyId) : null;

        // Determine current next question
        let nextQuestion: ClientAdaptiveQuestion | null = null;
        if (session.currentQuestionId && session.currentQuestionId !== questionId) {
          const nextQ = session.questionBank.get(session.currentQuestionId);
          if (nextQ && !session.askedQuestionIds.includes(nextQ.id)) {
            nextQuestion = AdaptiveFlowEngine.toClientSafeQuestion(
              nextQ,
              session.askedQuestionIds.length + 1,
              Math.max(session.words.size, 5)
            );
          }
        }

        if (!nextQuestion && session.currentQuestionId !== questionId) {
          nextQuestion = await this.getNextClientQuestion(session);
        }

        return {
          isCorrect: existingAnswer.isCorrect,
          correctAnswerIndex: question ? question.correctAnswerIndex : 0,
          selectedOptionIndex: existingAnswer.selectedOptionIndex ?? 0,
          explanation: question?.explanation || "",
          strongestDistractor: question?.strongestDistractor || "",
          whyDistractorWrong: question?.whyDistractorWrong || "",
          updatedSrsLevel: wordState?.currentSrsLevel ?? 0,
          isWeakWord: wordState ? wordState.wrongCount > 0 : false,
          example: wordState?.example,
          exampleTranslation:
            wordState?.example_translation || question?.exampleTranslation || null,
          targetWord: wordState?.word,
          meaning: wordState?.meaning,
          nextQuestion,
          sessionCompleted: !nextQuestion,
          isDuplicateSubmission: true,
        };
      }

      throw new Error("Câu hỏi này đã được hoàn thành trong phiên học.");
    }

    // Validate question belongs to this session
    if (!session.questionBank.has(questionId)) {
      throw new Error(`Câu hỏi ${questionId} không tồn tại trong phiên học này.`);
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
