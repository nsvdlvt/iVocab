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

    const [vocabResult, sessionResult] = await Promise.all([
      supabase
        .from("vocabularies")
        .select("id, set_id, review:reviews(*)")
        .eq("owner_id", userId)
        .is("deleted_at", null),
      supabase
        .from("review_sessions")
        .select("vocabulary_set_id, created_at")
        .eq("user_id", userId)
        .not("vocabulary_set_id", "is", null)
        .order("created_at", { ascending: true }),
    ]);

    if (vocabResult.error) throw vocabResult.error;
    if (sessionResult.error) throw sessionResult.error;

    const summaries: Record<string, VocabSetProgressSummary> = {};

    for (const row of (vocabResult.data ?? []) as Array<VocabularyRow & { review?: ReviewRow | ReviewRow[] | null }>) {
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

      summaries[setId] = current;
    }

    for (const session of (sessionResult.data ?? []) as ReviewSessionRow[]) {
      const setId = session.vocabulary_set_id;
      if (!setId) continue;

      const current = summaries[setId] ?? {
        setId,
        totalWords: 0,
        masteredWords: 0,
        learningWords: 0,
        newWords: 0,
        lastStudiedAt: null,
      };

      if (!current.lastStudiedAt || new Date(session.created_at).getTime() > new Date(current.lastStudiedAt).getTime()) {
        current.lastStudiedAt = session.created_at;
      }

      summaries[setId] = current;
    }

    const setResult = await supabase
      .from("vocab_sets")
      .select("id, last_studied_at")
      .eq("user_id", userId)
      .is("deleted_at", null);

    if (!setResult.error) {
      for (const setRow of (setResult.data ?? []) as Pick<VocabSetRow, "id" | "last_studied_at">[]) {
        const current = summaries[setRow.id] ?? {
          setId: setRow.id,
          totalWords: 0,
          masteredWords: 0,
          learningWords: 0,
          newWords: 0,
          lastStudiedAt: null,
        };

        if (
          setRow.last_studied_at &&
          (!current.lastStudiedAt || new Date(setRow.last_studied_at).getTime() > new Date(current.lastStudiedAt).getTime())
        ) {
          current.lastStudiedAt = setRow.last_studied_at;
        }

        summaries[setRow.id] = current;
      }
    } else if ((setResult.error as { code?: string } | null)?.code !== "42703") {
      throw setResult.error;
    }

    return summaries;
  },
};
