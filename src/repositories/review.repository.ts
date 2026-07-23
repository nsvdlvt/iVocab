import { createClient } from "@/lib/supabase/server";
import { Database } from "@/types/database";
import { SrsService } from "@/lib/srs/srs-service";
import { UpcomingReviewForecastDay, classifyForecastRow, summarizeSrsForecast } from "@/lib/srs/upcoming-reviews";
import { VocabularyStatsService, type VocabularyStats } from "@/lib/statistics/vocabulary-stats.service";

type VocabularyRow = Database["public"]["Tables"]["vocabularies"]["Row"];
type ReviewRow = Database["public"]["Tables"]["reviews"]["Row"];
type VocabularyWithReviewRow = Database["public"]["Tables"]["vocabularies"]["Row"] & {
  review: ReviewRow | ReviewRow[] | null;
};

function throwDbError(error: unknown): never {
  if (error instanceof Error) throw error;
  if (error && typeof error === "object" && "message" in error) {
    throw new Error(String((error as { message?: unknown }).message ?? "Database error"));
  }
  throw new Error("Database error");
}

async function getSrsVocabularyRows(userId: string): Promise<VocabularyWithReviewRow[]> {
  const stats = await VocabularyStatsService.getUserVocabularyStats(userId);
  return stats.rows as VocabularyWithReviewRow[];
}

function getReviewRow(row: VocabularyWithReviewRow): ReviewRow | null {
  const review = Array.isArray(row.review) ? row.review[0] ?? null : row.review;
  return review ?? null;
}

export interface ReviewItem {
  review: ReviewRow | null;
  vocabulary: VocabularyRow;
}

export interface SrsSummary {
  dueToday: number;
  masteredWords: number;
  learningWords: number;
}

export interface SetReviewPreviewSummary {
  overdueCount: number;
  dueTodayCount: number;
  reviewNowCount: number;
  dueSoonCount: number;
  dueSoonDays: number;
  notLearnedCount: number;
  learnedCount: number;
  totalCount: number;
  levelDistribution: Array<{ level: "lv2" | "lv3" | "lv4" | "lv5"; count: number }>;
}

export interface UpcomingReviewSummary {
  total: number;
  busiestDay: UpcomingReviewForecastDay | null;
  averagePerDay: number;
  days: UpcomingReviewForecastDay[];
}

export const ReviewRepository = {
  /**
   * Returns all due review items for a user where next_review is due today or earlier.
   * Joins the review row with the associated vocabulary row.
   */
  async getDueReviews(userId: string): Promise<ReviewItem[]> {
    const rows = await getSrsVocabularyRows(userId);
    const now = new Date();
    const todayRows = rows.filter((row) => {
      const review = getReviewRow(row);
      return classifyForecastRow({ next_review: review?.next_review ?? null, status: review?.status ?? null }, now) === "today";
    });

    return todayRows.map((row) => {
      const review = getReviewRow(row);
      return {
        review:
          review &&
          {
            id: review.id,
            user_id: review.user_id,
            vocabulary_id: review.vocabulary_id,
            ease_factor: review.ease_factor,
            interval: review.interval,
            repetitions: review.repetitions,
            next_review: review.next_review,
            last_review: review.last_review,
            last_grade: review.last_grade,
            status: review.status,
            created_at: review.created_at,
            updated_at: review.updated_at,
          },
        vocabulary: row,
      };
    });
  },

  async getDueReviewsBySetId(userId: string, setId: string): Promise<ReviewItem[]> {
    const items = await this.getDueReviews(userId);
    return items.filter((item) => item.vocabulary.set_id === setId);
  },

  async getSetReviewPreview(userId: string, setId: string, days = 7): Promise<SetReviewPreviewSummary> {
    const rows = await getSrsVocabularyRows(userId);
    const now = new Date();
    const setRows = rows.filter((row) => row.set_id === setId);

    let overdueCount = 0;
    let dueTodayCount = 0;
    let reviewNowCount = 0;
    let dueSoonCount = 0;
    let notLearnedCount = 0;
    let learnedCount = 0;
    const levelDistribution = new Map<"lv2" | "lv3" | "lv4" | "lv5", number>([
      ["lv2", 0],
      ["lv3", 0],
      ["lv4", 0],
      ["lv5", 0],
    ]);

    for (const row of setRows) {
      const review = getReviewRow(row);
      const nextReview = review?.next_review ? new Date(review.next_review) : null;
      const level = review?.status?.startsWith("lv") ? Number(review.status.slice(2)) : null;
      const isNotLearned =
        review?.status === "new" || review?.status === "learning" || review?.status == null || (level !== null && level < 2);
      if (isNotLearned) {
        notLearnedCount += 1;
      } else {
        learnedCount += 1;
      }

      if (level !== null && level >= 2) {
        const key = `lv${Math.min(level, 5)}` as "lv2" | "lv3" | "lv4" | "lv5";
        levelDistribution.set(key, (levelDistribution.get(key) ?? 0) + 1);
      }

      if (!nextReview || !review?.status || level === null || level < 2) {
        continue;
      }

      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      const dueDay = new Date(nextReview);
      dueDay.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((dueDay.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));

      if (diffDays < 0) {
        overdueCount += 1;
        reviewNowCount += 1;
      } else if (diffDays === 0) {
        dueTodayCount += 1;
        reviewNowCount += 1;
      } else if (diffDays > 0 && diffDays <= days) {
        dueSoonCount += 1;
      }
    }

    return {
      overdueCount,
      dueTodayCount,
      reviewNowCount,
      dueSoonCount,
      dueSoonDays: days,
      notLearnedCount,
      learnedCount,
      totalCount: setRows.length,
      levelDistribution: Array.from(levelDistribution.entries()).map(([level, count]) => ({ level, count })),
    };
  },

  /** Count of due review items for today and earlier (for dashboard). */
  async countDueReviews(userId: string): Promise<number> {
    const rows = await getSrsVocabularyRows(userId);
    const forecast = summarizeSrsForecast(
      rows.map((row) => {
        const review = getReviewRow(row);
        return { next_review: review?.next_review ?? null, status: review?.status ?? null };
      }),
      7,
      new Date()
    );
    return forecast.summary.today;
  },

  async getSummary(userId: string): Promise<SrsSummary> {
    const rows = await getSrsVocabularyRows(userId);
    const dueRows = rows.filter((row) => {
      const review = getReviewRow(row);
      return classifyForecastRow({ next_review: review?.next_review ?? null, status: review?.status ?? null }, new Date()) === "today";
    });
    console.log(
      "[SRS DEBUG]",
      "[ReviewRepository.getSummary dueRows]",
      "dueRows.length=",
      dueRows.length,
      "dueRows=",
      dueRows.map((row) => ({
        vocabularyId: row.id,
        reviewId: getReviewRow(row)?.id ?? null,
        status: getReviewRow(row)?.status ?? null,
        nextReview: getReviewRow(row)?.next_review ?? null,
      }))
    );

    const forecast = summarizeSrsForecast(
      rows.map((row) => {
        const review = getReviewRow(row);
        return { next_review: review?.next_review ?? null, status: review?.status ?? null };
      }),
      7,
      new Date()
    );

    return {
      dueToday: forecast.summary.today,
      masteredWords: rows.filter((row) => {
        const review = getReviewRow(row);
        return review?.status === "lv5" || review?.status === "mastered";
      }).length,
      learningWords: rows.filter((row) => {
        const review = getReviewRow(row);
        const level = review?.status?.startsWith("lv") ? Number(review.status.slice(2)) : null;
        return review?.status === "new" || review?.status === "learning" || (level !== null && level < 2) || !review?.next_review;
      }).length,
    };
  },

  async getDashboardVocabularyStats(userId: string): Promise<VocabularyStats> {
    return VocabularyStatsService.getUserVocabularyStats(userId);
  },

  async getUpcomingReviewForecast(userId: string, days = 7): Promise<UpcomingReviewSummary> {
    const rows = await getSrsVocabularyRows(userId);
    const forecast = summarizeSrsForecast(
      rows.map((row) => {
        const review = getReviewRow(row);
        return { next_review: review?.next_review ?? null, status: review?.status ?? null };
      }),
      days,
      new Date()
    );
    const total = forecast.buckets.reduce((sum, day) => sum + day.count, 0);
    const busiestDay = forecast.buckets.reduce<UpcomingReviewForecastDay | null>((winner, day) => {
      if (!winner || day.count > winner.count) return day;
      return winner;
    }, null);

    return {
      total,
      busiestDay,
      averagePerDay: days > 0 ? Math.round((total / days) * 10) / 10 : 0,
      days: forecast.buckets,
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

    if (error) throwDbError(error);

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

    const updatePayload = SrsService.toReviewUpdate(nextState.state, now);
    if (existing?.id) {
      const { data: updated, error } = await supabase
        .from("reviews")
        .update(updatePayload)
        .eq("id", existing.id)
        .select("*")
        .maybeSingle();
      if (error) throwDbError(error);
      return;
    }

    const { data: inserted, error } = await supabase
      .from("reviews")
      .insert({
        user_id: params.userId,
        vocabulary_id: params.vocabularyId,
        ...updatePayload,
      })
      .select("*")
      .maybeSingle();
    if (error) throwDbError(error);
  },
};
