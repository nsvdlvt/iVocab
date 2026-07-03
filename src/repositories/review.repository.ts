import { createClient } from "@/lib/supabase/server";
import { Database } from "@/types/database";

type VocabularyRow = Database["public"]["Tables"]["vocabularies"]["Row"];
type ReviewRow = Database["public"]["Tables"]["reviews"]["Row"];

export interface ReviewItem {
  review: ReviewRow;
  vocabulary: VocabularyRow;
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
      .order("next_review", { ascending: true });

    if (error) throw error;
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

    const { count, error } = await supabase
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .lte("next_review", now);

    if (error) throw error;
    return count ?? 0;
  },

  /** Upsert a review record (create or update). */
  async upsertReview(
    userId: string,
    vocabularyId: string,
    data: Partial<Database["public"]["Tables"]["reviews"]["Update"]>
  ): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.from("reviews").upsert(
      {
        user_id: userId,
        vocabulary_id: vocabularyId,
        ...data,
      },
      { onConflict: "user_id,vocabulary_id" }
    );
    if (error) throw error;
  },
};
