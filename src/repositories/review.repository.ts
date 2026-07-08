import { createClient } from "@/lib/supabase/server";
import { Database } from "@/types/database";
import { SrsService } from "@/lib/srs/srs-service";
import { UpcomingReviewForecastDay, buildUpcomingReviewForecast } from "@/lib/srs/upcoming-reviews";

type VocabularyRow = Database["public"]["Tables"]["vocabularies"]["Row"];
type ReviewRow = Database["public"]["Tables"]["reviews"]["Row"];

function throwDbError(error: unknown): never {
  if (error instanceof Error) throw error;
  if (error && typeof error === "object" && "message" in error) {
    throw new Error(String((error as { message?: unknown }).message ?? "Database error"));
  }
  throw new Error("Database error");
}

export interface ReviewItem {
  review: ReviewRow;
  vocabulary: VocabularyRow;
}

export interface SrsSummary {
  dueToday: number;
  masteredWords: number;
  learningWords: number;
}

export interface UpcomingReviewSummary {
  total: number;
  busiestDay: UpcomingReviewForecastDay | null;
  averagePerDay: number;
  days: UpcomingReviewForecastDay[];
}

export const ReviewRepository = {
  /**
   * Returns all due review items for a user where next_review <= now().
   * Joins the review row with the associated vocabulary row.
   */
  async getDueReviews(userId: string): Promise<ReviewItem[]> {
    const supabase = await createClient();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("reviews")
      .select(`
        *,
        vocabulary:vocabularies(*)
      `)
      .eq("user_id", userId)
      .lte("next_review", now)
      .in("status", ["lv2", "lv3", "lv4", "lv5"])
      .order("next_review", { ascending: true });

    if (error) throwDbError(error);
    if (!data) return [];

    // Filter out any rows where the vocabulary was soft-deleted
    return data
      .filter(
        (row): row is typeof row & { vocabulary: VocabularyRow } =>
          row.vocabulary !== null &&
          !Array.isArray(row.vocabulary) &&
          (row.vocabulary as VocabularyRow).deleted_at === null
      )
      .map((row) => ({
        review: {
          id: row.id,
          user_id: row.user_id,
          vocabulary_id: row.vocabulary_id,
          ease_factor: row.ease_factor,
          interval: row.interval,
          repetitions: row.repetitions,
          next_review: row.next_review,
          last_review: row.last_review,
          last_grade: row.last_grade,
          status: row.status,
          created_at: row.created_at,
          updated_at: row.updated_at,
        },
        vocabulary: row.vocabulary as VocabularyRow,
      }));
  },

  /** Count of due review items for today (for dashboard). */
  async countDueToday(userId: string): Promise<number> {
    const supabase = await createClient();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("reviews")
      .select(`
        id,
        vocabulary:vocabularies(deleted_at)
      `)
      .eq("user_id", userId)
      .lte("next_review", now)
      .in("status", ["lv2", "lv3", "lv4", "lv5"]);

    if (error) throwDbError(error);
    return (data ?? []).filter(
      (row) =>
        row.vocabulary !== null &&
        !Array.isArray(row.vocabulary) &&
        row.vocabulary.deleted_at === null
    ).length;
  },

  async getSummary(userId: string): Promise<SrsSummary> {
    const supabase = await createClient();
    const now = new Date().toISOString();

    const [{ data: dueRows, error: dueError }, { count: masteredWords, error: masteredError }, { count: learningWords, error: learningError }] =
      await Promise.all([
        supabase
          .from("reviews")
          .select(`
            id,
            vocabulary:vocabularies(deleted_at)
          `)
          .eq("user_id", userId)
          .lte("next_review", now)
          .in("status", ["lv2", "lv3", "lv4", "lv5"]),
        supabase
          .from("reviews")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("status", "lv5"),
        supabase
          .from("reviews")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .in("status", ["lv0", "lv1"]),
      ]);

    if (dueError) throwDbError(dueError);
    if (masteredError) throwDbError(masteredError);
    if (learningError) throwDbError(learningError);

    return {
      dueToday: (dueRows ?? []).filter(
        (row) =>
          row.vocabulary !== null &&
          !Array.isArray(row.vocabulary) &&
          row.vocabulary.deleted_at === null
      ).length,
      masteredWords: masteredWords ?? 0,
      learningWords: learningWords ?? 0,
    };
  },

  async getUpcomingReviewForecast(userId: string, days = 7): Promise<UpcomingReviewSummary> {
    const supabase = await createClient();
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + days);

    const { data, error } = await supabase
      .from("reviews")
      .select(`
        next_review,
        status,
        vocabulary:vocabularies(deleted_at)
      `)
      .eq("user_id", userId)
      .gte("next_review", start.toISOString())
      .lt("next_review", end.toISOString())
      .in("status", ["lv2", "lv3", "lv4"]);

    if (error) throwDbError(error);

    const filteredRows = (data ?? []).filter(
      (row) =>
        row.vocabulary !== null &&
        !Array.isArray(row.vocabulary) &&
        row.vocabulary.deleted_at === null
    );

    const daysData = buildUpcomingReviewForecast(filteredRows, days, now);
    const total = daysData.reduce((sum, day) => sum + day.count, 0);
    const busiestDay = daysData.reduce<UpcomingReviewForecastDay | null>((winner, day) => {
      if (!winner || day.count > winner.count) return day;
      return winner;
    }, null);

    return {
      total,
      busiestDay,
      averagePerDay: days > 0 ? Math.round((total / days) * 10) / 10 : 0,
      days: daysData,
    };
  },

  async getBySetId(userId: string, setId: string): Promise<Array<VocabularyRow & { review: ReviewRow | null }>> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("vocabularies")
      .select(`
        *,
        review:reviews(*)
      `)
      .eq("owner_id", userId)
      .eq("set_id", setId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return (data ?? []).map((row) => ({
      ...row,
      review: (() => {
        const review = (row as unknown as { review?: ReviewRow | ReviewRow[] | null }).review;
        if (Array.isArray(review)) return review[0] ?? null;
        return review ?? null;
      })(),
    })) as Array<VocabularyRow & { review: ReviewRow | null }>;
  },

  /** Upsert a review record (create or update). */
  async upsertReview(
    userId: string,
    vocabularyId: string,
    data: Partial<Database["public"]["Tables"]["reviews"]["Update"]>
  ): Promise<void> {
    const supabase = await createClient();
    const { data: existing, error: fetchError } = await supabase
      .from("reviews")
      .select("id")
      .eq("user_id", userId)
      .eq("vocabulary_id", vocabularyId)
      .maybeSingle();

    if (fetchError) throwDbError(fetchError);

    if (existing?.id) {
      const { error } = await supabase
        .from("reviews")
        .update(data)
        .eq("id", existing.id);
      if (error) throwDbError(error);
      return;
    }

    const { error } = await supabase.from("reviews").insert({
      user_id: userId,
      vocabulary_id: vocabularyId,
      ...data,
    });
    if (error) throwDbError(error);
  },

  async processResult(params: {
    userId: string;
    vocabularyId: string;
    mode: "learn" | "dictation" | "sentence-practice" | "flashcard" | "review";
    answerResult: "correct" | "wrong" | "near" | "unknown";
  }): Promise<void> {
    const supabase = await createClient();
    const now = new Date();

    const { data: existing, error: fetchError } = await supabase
      .from("reviews")
      .select("*")
      .eq("user_id", params.userId)
      .eq("vocabulary_id", params.vocabularyId)
      .maybeSingle();

    if (fetchError) throwDbError(fetchError);

    const nextState = SrsService.processLearningResult({
      mode: params.mode,
      answerResult: params.answerResult,
      currentState: existing
        ? {
            level: SrsService.getLevelFromReview(existing),
            progress: existing.repetitions ?? 0,
            nextReviewAt: existing.next_review,
            intervalDays: existing.interval,
          }
        : { level: 0, progress: 0, nextReviewAt: null, intervalDays: null },
      now,
    });

    if (!nextState.shouldPersist) return;

    const payload = SrsService.toReviewUpdate(nextState.state, now);
    if (existing?.id) {
      const { error } = await supabase
        .from("reviews")
        .update(payload)
        .eq("id", existing.id);
      if (error) throwDbError(error);
      return;
    }

    const { error } = await supabase.from("reviews").insert({
      user_id: params.userId,
      vocabulary_id: params.vocabularyId,
      ...payload,
    });
    if (error) throwDbError(error);
  },
};
