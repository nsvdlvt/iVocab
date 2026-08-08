import { createClient } from "@/lib/supabase/server";
import { Database } from "@/types/database";
import { SrsService } from "@/lib/srs/srs-service";

type VocabularyRow = Database["public"]["Tables"]["vocabularies"]["Row"];
type ReviewRow = Database["public"]["Tables"]["reviews"]["Row"];
type ReviewSessionRow = Database["public"]["Tables"]["review_sessions"]["Row"];
type VocabSetRow = Database["public"]["Tables"]["vocab_sets"]["Row"];

export interface VocabSetProgressSummary {
  setId: string;
  totalWords: number;
  masteredWords: number;
  learningWords: number;
  newWords: number;
  lastStudiedAt: string | null;
}

function getReview(row: VocabularyRow & { review?: ReviewRow | ReviewRow[] | null }): ReviewRow | null {
  const review = row.review ?? null;
  return Array.isArray(review) ? review[0] ?? null : review;
}

function getState(review: ReviewRow | null) {
  const level = SrsService.getLevelFromReview(review);

  if (level >= 2) return "mastered";
  if (level >= 1) return "learning";
  return "new";
}

export const VocabSetSummaryService = {
  async getUserVocabSetSummaries(userId: string): Promise<Record<string, VocabSetProgressSummary>> {
    const supabase = await createClient();

    const summaries: Record<string, VocabSetProgressSummary> = {};

    // 1. Fetch user's vocabulary sets to initialize all sets
    const setResult = await supabase
      .from("vocab_sets")
      .select("id, last_studied_at")
      .eq("user_id", userId)
      .is("deleted_at", null);

    if (setResult.error && (setResult.error as { code?: string })?.code !== "42703") {
      throw setResult.error;
    }

    for (const setRow of (setResult.data ?? []) as Pick<VocabSetRow, "id" | "last_studied_at">[]) {
      summaries[setRow.id] = {
        setId: setRow.id,
        totalWords: 0,
        masteredWords: 0,
        learningWords: 0,
        newWords: 0,
        lastStudiedAt: setRow.last_studied_at || null,
      };
    }

    // 2. Fetch all user vocabularies using pagination to avoid PostgREST 1000-row default limit
    const allVocabs: Array<VocabularyRow & { review?: ReviewRow | ReviewRow[] | null }> = [];
    let from = 0;
    const PAGE_SIZE = 1000;

    while (true) {
      const to = from + PAGE_SIZE - 1;
      const { data, error } = await supabase
        .from("vocabularies")
        .select("id, set_id, review:reviews(*)")
        .eq("owner_id", userId)
        .is("deleted_at", null)
        .range(from, to);

      if (error) throw error;

      const page = (data ?? []) as unknown as Array<VocabularyRow & { review?: ReviewRow | ReviewRow[] | null }>;
      allVocabs.push(...page);

      if (page.length < PAGE_SIZE) {
        break;
      }
      from += PAGE_SIZE;
    }

    // 3. Process vocabulary stats and review dates
    for (const row of allVocabs) {
      const setId = row.set_id;
      if (!setId) continue;

      const review = getReview(row);
      const state = getState(review);

      const current = summaries[setId] ?? {
        setId,
        totalWords: 0,
        masteredWords: 0,
        learningWords: 0,
        newWords: 0,
        lastStudiedAt: null,
      };

      current.totalWords += 1;
      if (state === "mastered") current.masteredWords += 1;
      else if (state === "learning") current.learningWords += 1;
      else current.newWords += 1;

      // Extract study timestamp from review (last_review or updated_at)
      const reviewTime = review?.last_review || review?.updated_at;
      if (reviewTime) {
        if (!current.lastStudiedAt || new Date(reviewTime).getTime() > new Date(current.lastStudiedAt).getTime()) {
          current.lastStudiedAt = reviewTime;
        }
      }

      summaries[setId] = current;
    }

    // 4. Fetch review sessions for last studied timestamp
    const sessionResult = await supabase
      .from("review_sessions")
      .select("vocabulary_set_id, created_at")
      .eq("user_id", userId)
      .not("vocabulary_set_id", "is", null)
      .order("created_at", { ascending: true });

    if (!sessionResult.error) {
      for (const session of (sessionResult.data ?? []) as ReviewSessionRow[]) {
        const setId = session.vocabulary_set_id;
        if (!setId || !summaries[setId]) continue;

        if (
          session.created_at &&
          (!summaries[setId].lastStudiedAt ||
            new Date(session.created_at).getTime() > new Date(summaries[setId].lastStudiedAt!).getTime())
        ) {
          summaries[setId].lastStudiedAt = session.created_at;
        }
      }
    }

    return summaries;
  },
};
