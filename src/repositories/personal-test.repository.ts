import { createClient } from "@/lib/supabase/server";
import { Database, Json } from "@/types/database";
import {
  VocabeeTest,
  TestMode,
  PersonalTestRecord,
  PersonalTestAttemptRecord,
  AttemptStatus,
} from "@/types/vocabee-test";
import { gradeVocabeeTest } from "@/lib/personal-test/vocabee-test-grader";

type PersonalTestRow = Database["public"]["Tables"]["personal_tests"]["Row"];
type PersonalTestAttemptRow = Database["public"]["Tables"]["personal_test_attempts"]["Row"];

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

    const testContent = (attemptRow.personal_tests as any).content as VocabeeTest;

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
      test_title: (row.personal_tests as any)?.title || "Untitled Test",
    }));
  },
};
