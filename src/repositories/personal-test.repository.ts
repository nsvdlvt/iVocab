import { createClient } from "@/lib/supabase/server";
import { Database, Json } from "@/types/database";
import {
  VocabeeTest,
  TestMode,
  PersonalTestRecord,
  PersonalTestAttemptRecord,
  PersonalTestFlashcardItem,
} from "@/types/vocabee-test";
import { resolveFlashcardsForTestContent } from "@/lib/personal-test/flashcard-session";
import { gradeVocabeeTest } from "@/lib/personal-test/vocabee-test-grader";
import { SrsService } from "@/lib/srs/srs-service";
import {
  formatDifficultyLabel,
  type SelectableVocabSet,
  type SelectableVocabularyWord,
} from "@/lib/personal-test/vocabulary-selection";

type PersonalTestRow = Database["public"]["Tables"]["personal_tests"]["Row"];
type VocabSetRow = Database["public"]["Tables"]["vocab_sets"]["Row"];
type VocabularyRow = Database["public"]["Tables"]["vocabularies"]["Row"];

export const PersonalTestRepository = {
  /**
   * Fetches all personal tests created by the given user, joined with aggregated attempt stats.
   */
  async getPersonalTests(userId: string): Promise<PersonalTestRecord[]> {
    const supabase = await createClient();

    const { data: tests, error } = await supabase
      .from("personal_tests")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error || !tests) {
      console.error("[PersonalTestRepository.getPersonalTests] Error:", error);
      return [];
    }

    // Fetch attempts for all user's tests to compute stats
    const { data: attempts } = await supabase
      .from("personal_test_attempts")
      .select("id, test_id, score, status, started_at, completed_at")
      .eq("user_id", userId)
      .order("started_at", { ascending: false });

    const attemptsMap = new Map<string, typeof attempts>();
    attempts?.forEach((att) => {
      const list = attemptsMap.get(att.test_id) || [];
      list.push(att);
      attemptsMap.set(att.test_id, list);
    });

    return tests.map((t) => {
      const testAttempts = attemptsMap.get(t.id) || [];
      const completed = testAttempts.filter((a) => a.status === "completed");
      const inProgress = testAttempts.find((a) => a.status === "in_progress");

      const bestScore =
        completed.length > 0 ? Math.max(...completed.map((a) => Number(a.score) || 0)) : null;
      const lastPracticed =
        testAttempts.length > 0 ? testAttempts[0].started_at : null;

      return {
        id: t.id,
        user_id: t.user_id,
        title: t.title,
        schema_version: t.schema_version,
        content: t.content as unknown as VocabeeTest,
        total_words: t.total_words,
        total_sets: t.total_sets,
        created_at: t.created_at,
        updated_at: t.updated_at,
        attempts_count: completed.length,
        best_score: bestScore,
        last_practiced_at: lastPracticed,
        has_active_attempt: !!inProgress,
        active_attempt_id: inProgress?.id ?? null,
      };
    });
  },

  /**
   * Fetches a single personal test by ID, ensuring user ownership.
   */
  async getPersonalTestById(id: string, userId: string): Promise<PersonalTestRecord | null> {
    const supabase = await createClient();

    const { data: test, error } = await supabase
      .from("personal_tests")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !test) {
      if (error) console.error("[PersonalTestRepository.getPersonalTestById] Error:", error);
      return null;
    }

    const { data: attempts } = await supabase
      .from("personal_test_attempts")
      .select("id, status, score, started_at")
      .eq("test_id", id)
      .eq("user_id", userId)
      .order("started_at", { ascending: false });

    const completed = attempts?.filter((a) => a.status === "completed") || [];
    const inProgress = attempts?.find((a) => a.status === "in_progress");

    const bestScore =
      completed.length > 0 ? Math.max(...completed.map((a) => Number(a.score) || 0)) : null;

    return {
      id: test.id,
      user_id: test.user_id,
      title: test.title,
      schema_version: test.schema_version,
      content: test.content as unknown as VocabeeTest,
      total_words: test.total_words,
      total_sets: test.total_sets,
      created_at: test.created_at,
      updated_at: test.updated_at,
      attempts_count: completed.length,
      best_score: bestScore,
      last_practiced_at: attempts?.[0]?.started_at ?? null,
      has_active_attempt: !!inProgress,
      active_attempt_id: inProgress?.id ?? null,
    };
  },

  /**
   * Creates a new personal test in database.
   */
  async createPersonalTest(
    userId: string,
    validatedTest: VocabeeTest
  ): Promise<PersonalTestRow | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("personal_tests")
      .insert({
        user_id: userId,
        title: validatedTest.title,
        schema_version: validatedTest.schema,
        content: validatedTest as unknown as Json,
        total_words: validatedTest.total_words,
        total_sets: validatedTest.total_sets,
      })
      .select()
      .single();

    if (error) {
      console.error("[PersonalTestRepository.createPersonalTest] Error:", error);
      return null;
    }

    return data;
  },

  /**
   * Updates test title or entire validated content.
   */
  async updatePersonalTest(
    id: string,
    userId: string,
    updates: { title?: string; content?: VocabeeTest }
  ): Promise<PersonalTestRow | null> {
    const supabase = await createClient();

    const updatePayload: Database["public"]["Tables"]["personal_tests"]["Update"] = {
      updated_at: new Date().toISOString(),
    };

    if (updates.title) {
      updatePayload.title = updates.title;
    }
    if (updates.content) {
      updatePayload.content = updates.content as unknown as Json;
      updatePayload.total_words = updates.content.total_words;
      updatePayload.total_sets = updates.content.total_sets;
    }

    const { data, error } = await supabase
      .from("personal_tests")
      .update(updatePayload)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      console.error("[PersonalTestRepository.updatePersonalTest] Error:", error);
      return null;
    }

    return data;
  },

  /**
   * Deletes a personal test by ID.
   */
  async deletePersonalTest(id: string, userId: string): Promise<boolean> {
    const supabase = await createClient();

    const { error } = await supabase
      .from("personal_tests")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      console.error("[PersonalTestRepository.deletePersonalTest] Error:", error);
      return false;
    }

    return true;
  },

  /**
   * Gets or checks for an active unfinished attempt for a specific test.
   */
  async getActiveAttempt(
    testId: string,
    userId: string
  ): Promise<PersonalTestAttemptRecord | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("personal_test_attempts")
      .select("*")
      .eq("test_id", testId)
      .eq("user_id", userId)
      .eq("status", "in_progress")
      .order("started_at", { ascending: false })
      .maybeSingle();

    if (error || !data) return null;

    return {
      ...data,
      answers: (data.answers as Record<string, string>) || {},
    };
  },

  /**
   * Starts a new attempt or resumes an existing in_progress attempt.
   */
  async createAttempt(
    testId: string,
    userId: string,
    mode: TestMode
  ): Promise<PersonalTestAttemptRecord | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("personal_test_attempts")
      .insert({
        test_id: testId,
        user_id: userId,
        status: "in_progress",
        mode,
        answers: {},
        score: 0,
        total_questions: 0,
        correct_answers: 0,
        current_set_index: 0,
        current_exercise_index: 0,
      })
      .select()
      .single();

    if (error || !data) {
      console.error("[PersonalTestRepository.createAttempt] Error:", error);
      return null;
    }

    return {
      ...data,
      answers: (data.answers as Record<string, string>) || {},
    };
  },

  /**
   * Saves partial progress (checkpoint) for an active attempt.
   */
  async saveAttemptProgress(
    attemptId: string,
    userId: string,
    updates: {
      answers: Record<string, string>;
      currentSetIndex: number;
      currentExerciseIndex: number;
    }
  ): Promise<boolean> {
    const supabase = await createClient();

    const { error } = await supabase
      .from("personal_test_attempts")
      .update({
        answers: updates.answers as unknown as Json,
        current_set_index: updates.currentSetIndex,
        current_exercise_index: updates.currentExerciseIndex,
      })
      .eq("id", attemptId)
      .eq("user_id", userId)
      .eq("status", "in_progress");

    if (error) {
      console.error("[PersonalTestRepository.saveAttemptProgress] Error:", error);
      return false;
    }

    return true;
  },

  /**
   * Completes an attempt, performing authoritative server-side grading.
   */
  async completeAttempt(
    attemptId: string,
    userId: string,
    finalAnswers: Record<string, string>
  ): Promise<{ attempt: PersonalTestAttemptRecord; grading: ReturnType<typeof gradeVocabeeTest> } | null> {
    const supabase = await createClient();

    // 1. Fetch attempt and associated test content
    const { data: attemptRow, error: attemptErr } = await supabase
      .from("personal_test_attempts")
      .select("*, personal_tests!inner(content)")
      .eq("id", attemptId)
      .eq("user_id", userId)
      .maybeSingle();

    if (attemptErr || !attemptRow) {
      console.error("[PersonalTestRepository.completeAttempt] Fetch error:", attemptErr);
      return null;
    }

    const joinedTest = attemptRow.personal_tests as unknown as { content: VocabeeTest };
    const testContent = joinedTest.content;

    // 2. Authoritative server-side grading
    const grading = gradeVocabeeTest(testContent, finalAnswers);

    // 3. Update attempt record as completed
    const { data: updatedAttempt, error: updateErr } = await supabase
      .from("personal_test_attempts")
      .update({
        status: "completed",
        answers: finalAnswers as unknown as Json,
        score: grading.score,
        total_questions: grading.totalQuestions,
        correct_answers: grading.correctAnswers,
        completed_at: new Date().toISOString(),
      })
      .eq("id", attemptId)
      .eq("user_id", userId)
      .select()
      .single();

    if (updateErr || !updatedAttempt) {
      console.error("[PersonalTestRepository.completeAttempt] Update error:", updateErr);
      return null;
    }

    return {
      attempt: {
        ...updatedAttempt,
        answers: (updatedAttempt.answers as Record<string, string>) || {},
      },
      grading,
    };
  },

  /**
   * Fetches attempt by ID for result review.
   */
  async getAttemptById(
    attemptId: string,
    userId: string
  ): Promise<{ attempt: PersonalTestAttemptRecord; test: PersonalTestRecord } | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("personal_test_attempts")
      .select("*, personal_tests(*)")
      .eq("id", attemptId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data || !data.personal_tests) {
      return null;
    }

    const testRow = data.personal_tests as unknown as PersonalTestRow;

    return {
      attempt: {
        id: data.id,
        test_id: data.test_id,
        user_id: data.user_id,
        status: data.status,
        mode: data.mode,
        answers: (data.answers as Record<string, string>) || {},
        score: Number(data.score) || 0,
        total_questions: data.total_questions,
        correct_answers: data.correct_answers,
        current_set_index: data.current_set_index,
        current_exercise_index: data.current_exercise_index,
        started_at: data.started_at,
        completed_at: data.completed_at,
      },
      test: {
        id: testRow.id,
        user_id: testRow.user_id,
        title: testRow.title,
        schema_version: testRow.schema_version,
        content: testRow.content as unknown as VocabeeTest,
        total_words: testRow.total_words,
        total_sets: testRow.total_sets,
        created_at: testRow.created_at,
        updated_at: testRow.updated_at,
      },
    };
  },

  /**
   * Fetches recent attempts across all personal tests for the user.
   */
  async getRecentAttempts(userId: string, limit = 5): Promise<Array<PersonalTestAttemptRecord & { test_title: string }>> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("personal_test_attempts")
      .select("*, personal_tests!inner(title)")
      .eq("user_id", userId)
      .order("started_at", { ascending: false })
      .limit(limit);

    if (error || !data) {
      console.error("[PersonalTestRepository.getRecentAttempts] Error:", error);
      return [];
    }

    return data.map((row) => ({
      id: row.id,
      test_id: row.test_id,
      user_id: row.user_id,
      status: row.status,
      mode: row.mode,
      answers: (row.answers as Record<string, string>) || {},
      score: Number(row.score) || 0,
      total_questions: row.total_questions,
      correct_answers: row.correct_answers,
      current_set_index: row.current_set_index,
      current_exercise_index: row.current_exercise_index,
      started_at: row.started_at,
      completed_at: row.completed_at,
      test_title:
        (row.personal_tests as unknown as { title?: string } | null)?.title ||
        "Untitled Test",
    }));
  },

  /**
   * Fetches all active vocabulary sets owned by the user with word counts and difficulty/CEFR distribution.
   */
  async getUserSelectableVocabSets(userId: string): Promise<SelectableVocabSet[]> {
    const supabase = await createClient();
    const sets: VocabSetRow[] = [];
    const PAGE_SIZE = 1000;
    let from = 0;

    while (true) {
      const to = from + PAGE_SIZE - 1;
      const { data, error } = await supabase
        .from("vocab_sets")
        .select("*")
        .eq("user_id", userId)
        .is("deleted_at", null)
        .order("updated_at", { ascending: false })
        .range(from, to);

      if (error) {
        console.error("[PersonalTestRepository.getUserSelectableVocabSets] sets error:", error);
        throw error;
      }
      const page = (data ?? []) as VocabSetRow[];
      sets.push(...page);
      if (page.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }

    if (sets.length === 0) return [];

    // Paginate active vocabularies owned by user to compute accurate counts & level distribution
    const statsBySet = new Map<
      string,
      { wordCount: number; levelDistribution: Record<string, number> }
    >();

    let vFrom = 0;
    while (true) {
      const vTo = vFrom + PAGE_SIZE - 1;
      const { data: vocabRows, error: vocabErr } = await supabase
        .from("vocabularies")
        .select("set_id, difficulty")
        .eq("owner_id", userId)
        .is("deleted_at", null)
        .range(vFrom, vTo);

      if (vocabErr) {
        console.error("[PersonalTestRepository.getUserSelectableVocabSets] vocab error:", vocabErr);
        throw vocabErr;
      }

      const page = (vocabRows ?? []) as Array<{ set_id: string; difficulty: string | null }>;
      for (const row of page) {
        let entry = statsBySet.get(row.set_id);
        if (!entry) {
          entry = { wordCount: 0, levelDistribution: {} };
          statsBySet.set(row.set_id, entry);
        }
        entry.wordCount += 1;
        const label = formatDifficultyLabel(row.difficulty);
        if (label) {
          entry.levelDistribution[label] = (entry.levelDistribution[label] ?? 0) + 1;
        }
      }

      if (page.length < PAGE_SIZE) break;
      vFrom += PAGE_SIZE;
    }

    return sets.map((s) => {
      const stats = statsBySet.get(s.id) ?? { wordCount: 0, levelDistribution: {} };
      return {
        id: s.id,
        title: s.title,
        description: s.description,
        color: s.color,
        icon: s.icon,
        visibility: s.visibility,
        source: s.source,
        created_at: s.created_at,
        updated_at: s.updated_at,
        last_studied_at: s.last_studied_at,
        wordCount: stats.wordCount,
        levelDistribution: stats.levelDistribution,
      };
    });
  },

  /**
   * Fetches active vocabulary words belonging to the specified user-owned sets.
   * Silently ignores any setId not owned by userId or soft-deleted.
   */
  async getUserSelectableWordsBySetIds(
    userId: string,
    setIds: string[]
  ): Promise<SelectableVocabularyWord[]> {
    const cleanSetIds = Array.from(new Set(setIds.map((id) => id.trim()).filter(Boolean)));
    if (cleanSetIds.length === 0) return [];

    const supabase = await createClient();

    // Verify set ownership first
    const { data: ownedSets, error: setErr } = await supabase
      .from("vocab_sets")
      .select("id, title, color")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .in("id", cleanSetIds);

    if (setErr) {
      console.error("[PersonalTestRepository.getUserSelectableWordsBySetIds] setErr:", setErr);
      throw setErr;
    }

    const setMap = new Map<string, { title: string; color: string | null }>();
    for (const s of ownedSets ?? []) {
      setMap.set(s.id, { title: s.title, color: s.color });
    }

    const verifiedSetIds = Array.from(setMap.keys());
    if (verifiedSetIds.length === 0) return [];

    const words: SelectableVocabularyWord[] = [];
    const PAGE_SIZE = 1000;
    let from = 0;

    while (true) {
      const to = from + PAGE_SIZE - 1;
      const { data, error } = await supabase
        .from("vocabularies")
        .select(
          `
          *,
          review:reviews(status)
        `
        )
        .eq("owner_id", userId)
        .is("deleted_at", null)
        .in("set_id", verifiedSetIds)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) {
        console.error("[PersonalTestRepository.getUserSelectableWordsBySetIds] vocabErr:", error);
        throw error;
      }

      type RowWithReview = VocabularyRow & {
        review?: { status: string | null } | Array<{ status: string | null }> | null;
      };
      const page = (data ?? []) as unknown as RowWithReview[];
      for (const row of page) {
        const setInfo = setMap.get(row.set_id);
        if (!setInfo) continue;
        const reviewObj = Array.isArray(row.review) ? row.review[0] ?? null : row.review ?? null;
        const srsLevel = SrsService.getLevelFromReview(reviewObj);
        words.push({
          id: row.id,
          set_id: row.set_id,
          set_title: setInfo.title,
          set_color: setInfo.color,
          word: row.word,
          ipa: row.ipa,
          part_of_speech: row.part_of_speech,
          meaning: row.meaning,
          example: row.example,
          example_translation: row.example_translation,
          synonyms: row.synonyms,
          note: row.note,
          difficulty: row.difficulty,
          created_at: row.created_at,
          is_starred: row.is_starred,
          srsLevel,
        });
      }

      if (page.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }

    return words;
  },

  /**
   * Verifies ownership of every selected vocabulary record ID and its parent active set.
   * Returns verified words in requested order alongside any unauthorized/missing IDs.
   */
  async getVerifiedSelectedWordsForUser(
    userId: string,
    vocabularyIds: string[]
  ): Promise<{ words: SelectableVocabularyWord[]; unauthorizedIds: string[] }> {
    const cleanIds = Array.from(new Set(vocabularyIds.map((id) => id.trim()).filter(Boolean)));
    if (cleanIds.length === 0) {
      return { words: [], unauthorizedIds: [] };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("vocabularies")
      .select(
        `
        *,
        vocab_sets!inner(id, title, color, user_id, deleted_at)
      `
      )
      .in("id", cleanIds)
      .eq("owner_id", userId)
      .is("deleted_at", null)
      .eq("vocab_sets.user_id", userId)
      .is("vocab_sets.deleted_at", null);

    if (error) {
      console.error("[PersonalTestRepository.getVerifiedSelectedWordsForUser] error:", error);
      throw error;
    }

    type JoinedRow = VocabularyRow & {
      vocab_sets:
        | { id: string; title: string; color: string | null; user_id: string; deleted_at: string | null }
        | Array<{ id: string; title: string; color: string | null; user_id: string; deleted_at: string | null }>;
    };

    const byId = new Map<string, SelectableVocabularyWord>();
    for (const row of (data ?? []) as unknown as JoinedRow[]) {
      const setObj = Array.isArray(row.vocab_sets) ? row.vocab_sets[0] : row.vocab_sets;
      if (!setObj || setObj.user_id !== userId || setObj.deleted_at !== null) continue;
      byId.set(row.id, {
        id: row.id,
        set_id: row.set_id,
        set_title: setObj.title,
        set_color: setObj.color,
        word: row.word,
        ipa: row.ipa,
        part_of_speech: row.part_of_speech,
        meaning: row.meaning,
        example: row.example,
        example_translation: row.example_translation,
        synonyms: row.synonyms,
        note: row.note,
        difficulty: row.difficulty,
        created_at: row.created_at,
        is_starred: row.is_starred,
        audio_url: row.audio_url,
      });
    }

    const words: SelectableVocabularyWord[] = [];
    const unauthorizedIds: string[] = [];

    for (const id of cleanIds) {
      const found = byId.get(id);
      if (found) {
        words.push(found);
      } else {
        unauthorizedIds.push(id);
      }
    }

    return { words, unauthorizedIds };
  },

  /**
   * Resolves actual database vocabulary records for a Personal Test's Flashcards stage.
   * Does not invent missing vocabulary data and avoids duplicating records.
   */
  async getFlashcardsForTest(
    userId: string,
    test: PersonalTestRecord
  ): Promise<PersonalTestFlashcardItem[]> {
    const supabase = await createClient();
    const targetWords = Array.from(
      new Set(
        test.content.sets
          .flatMap((s) => s.words)
          .map((w) => w.trim().toLowerCase())
          .filter(Boolean)
      )
    );

    if (targetWords.length === 0) return [];

    const dbRecords: SelectableVocabularyWord[] = [];
    const PAGE_SIZE = 1000;
    let from = 0;

    while (true) {
      const to = from + PAGE_SIZE - 1;
      const { data, error } = await supabase
        .from("vocabularies")
        .select(
          `
          *,
          vocab_sets!inner(id, title, color, user_id, deleted_at)
        `
        )
        .eq("owner_id", userId)
        .is("deleted_at", null)
        .eq("vocab_sets.user_id", userId)
        .is("vocab_sets.deleted_at", null)
        .range(from, to);

      if (error) {
        console.error("[PersonalTestRepository.getFlashcardsForTest] error:", error);
        break;
      }

      type JoinedRow = VocabularyRow & {
        vocab_sets:
          | { id: string; title: string; color: string | null; user_id: string; deleted_at: string | null }
          | Array<{ id: string; title: string; color: string | null; user_id: string; deleted_at: string | null }>;
      };

      const page = (data ?? []) as unknown as JoinedRow[];
      for (const row of page) {
        const setObj = Array.isArray(row.vocab_sets) ? row.vocab_sets[0] : row.vocab_sets;
        if (!setObj || setObj.user_id !== userId || setObj.deleted_at !== null) continue;
        dbRecords.push({
          id: row.id,
          set_id: row.set_id,
          set_title: setObj.title,
          set_color: setObj.color,
          word: row.word,
          ipa: row.ipa,
          part_of_speech: row.part_of_speech,
          meaning: row.meaning,
          example: row.example,
          example_translation: row.example_translation,
          synonyms: row.synonyms,
          note: row.note,
          difficulty: row.difficulty,
          created_at: row.created_at,
          is_starred: row.is_starred,
          audio_url: row.audio_url,
        });
      }

      if (page.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }

    return resolveFlashcardsForTestContent(test.content, dbRecords);
  },
};
