import { createClient } from "@/lib/supabase/server";
import { Database } from "@/types/database";
import { summarizeSrsForecast, type UpcomingReviewForecastDay } from "@/lib/srs/upcoming-reviews";

type VocabularyRow = Database["public"]["Tables"]["vocabularies"]["Row"];
type ReviewRow = Database["public"]["Tables"]["reviews"]["Row"];
type VocabSetRow = Database["public"]["Tables"]["vocab_sets"]["Row"];

export type VocabularyState = "new" | "learning" | "learned" | "mastered";

export interface VocabularyStatsForecastDay {
  date: string;
  count: number;
  label: string;
  isToday: boolean;
  isTomorrow: boolean;
}

export interface VocabularyStatsForecast {
  total: number;
  averagePerDay: number;
  busiestDay: UpcomingReviewForecastDay | null;
  days: VocabularyStatsForecastDay[];
}

export interface VocabularyStats {
  totalWords: number;
  newWords: number;
  learningWords: number;
  learnedWords: number;
  masteredWords: number;
  dueToday: number;
  overdue: number;
  forecast: VocabularyStatsForecast;
  rows: Array<VocabularyRow & { review: ReviewRow | null; state: VocabularyState }>;
}

type VocabularyWithReviewRow = VocabularyRow & {
  review: ReviewRow | ReviewRow[] | null;
  vocab_sets?: Pick<VocabSetRow, "id" | "deleted_at"> | Pick<VocabSetRow, "id" | "deleted_at">[] | null;
};
const VOCAB_STATS_PAGE_SIZE = 1000;

function getReviewRow(row: VocabularyWithReviewRow): ReviewRow | null {
  const review = Array.isArray(row.review) ? row.review[0] ?? null : row.review;
  return review ?? null;
}

function getVocabularyState(review: ReviewRow | null): VocabularyState {
  const level = review?.status?.startsWith("lv") ? Number(review.status.slice(2)) : null;

  if (review?.status === "lv5" || review?.status === "mastered" || level === 5) {
    return "mastered";
  }

  if (level !== null && level >= 2) {
    return "learned";
  }

  if (review?.status === "learning" || level === 1) {
    return "learning";
  }

  return "new";
}

function getNextReviewState(review: ReviewRow | null, now: Date): "dueToday" | "overdue" | null {
  if (!review?.next_review) return null;
  const nextReview = new Date(review.next_review);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const target = new Date(nextReview);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
  if (diffDays < 0) return "overdue";
  if (diffDays === 0) return "dueToday";
  return null;
}

export const VocabularyStatsService = {
  async getUserVocabularyStats(userId: string): Promise<VocabularyStats> {
    const supabase = await createClient();
    const now = new Date();
    const rawRows: VocabularyWithReviewRow[] = [];
    let from = 0;

    while (true) {
      const to = from + VOCAB_STATS_PAGE_SIZE - 1;
      const { data, error } = await supabase
        .from("vocabularies")
        .select(
          `
          *,
          vocab_sets!inner(id, deleted_at),
          review:reviews(*)
        `
        )
        .eq("owner_id", userId)
        .is("deleted_at", null)
        .is("vocab_sets.deleted_at", null)
        .order("created_at", { ascending: true })
        .range(from, to);

      if (error) throw error;

      const page = (data ?? []) as VocabularyWithReviewRow[];
      rawRows.push(...page);

      if (page.length < VOCAB_STATS_PAGE_SIZE) {
        break;
      }

      from += VOCAB_STATS_PAGE_SIZE;
    }

    const rows = rawRows.map((row) => {
      const typed = row as VocabularyWithReviewRow;
      const review = getReviewRow(typed);
      return {
        ...typed,
        review,
        state: getVocabularyState(review),
      };
    });

    let newWords = 0;
    let learningWords = 0;
    let learnedWords = 0;
    let masteredWords = 0;
    let dueToday = 0;
    let overdue = 0;

    const forecast = summarizeSrsForecast(
      rows.map((row) => {
        const review = row.review;
        const nextReviewState = getNextReviewState(review, now);
        if (nextReviewState === "dueToday") dueToday += 1;
        if (nextReviewState === "overdue") overdue += 1;
        return { next_review: review?.next_review ?? null, status: review?.status ?? null };
      }),
      7,
      now
    );

    for (const row of rows) {
      switch (row.state) {
        case "new":
          newWords += 1;
          break;
        case "learning":
          learningWords += 1;
          break;
        case "learned":
          learnedWords += 1;
          break;
        case "mastered":
          masteredWords += 1;
          break;
      }
    }

    return {
      totalWords: rows.length,
      newWords,
      learningWords,
      learnedWords,
      masteredWords,
      dueToday,
      overdue,
      forecast: {
        total: forecast.buckets.reduce((sum, day) => sum + day.count, 0),
        averagePerDay: 7 > 0 ? Math.round((forecast.buckets.reduce((sum, day) => sum + day.count, 0) / 7) * 10) / 10 : 0,
        busiestDay: forecast.buckets.reduce<UpcomingReviewForecastDay | null>((winner, day) => {
          if (!winner || day.count > winner.count) {
            return day;
          }
          return winner;
        }, null),
        days: forecast.buckets.map((day) => {
          return {
            date: day.date,
            count: day.count,
            label: day.label,
            isToday: day.isToday,
            isTomorrow: day.isTomorrow,
          };
        }),
      },
      rows,
    };
  },
};
