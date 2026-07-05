import { createClient } from "@/lib/supabase/server";
import { Database } from "@/types/database";

type HistoryRow = Database["public"]["Tables"]["sentence_practice_history"]["Row"];
type HistoryInsert = Database["public"]["Tables"]["sentence_practice_history"]["Insert"];

export const SentenceHistoryRepository = {
  async create(
    userId: string,
    item: Omit<HistoryInsert, "id" | "user_id" | "created_at" | "updated_at">
  ): Promise<HistoryRow> {
    const supabase = await createClient();
    
    // Calculate attempt_number automatically
    const { count } = await supabase
      .from("sentence_practice_history")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("vocab_id", item.vocab_id);
      
    const attemptNumber = (count ?? 0) + 1;

    const { data, error } = await supabase
      .from("sentence_practice_history")
      .insert({
        ...item,
        user_id: userId,
        attempt_number: attemptNumber,
      })
      .select("*")
      .single();

    if (error) throw error;
    return data;
  },

  async getByVocabularyId(userId: string, vocabId: string): Promise<HistoryRow[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("sentence_practice_history")
      .select("*")
      .eq("user_id", userId)
      .eq("vocab_id", vocabId)
      .order("attempt_number", { ascending: false });

    if (error) throw error;
    return data ?? [];
  },

  async getStatsForSet(
    userId: string,
    setId: string
  ): Promise<Record<string, { latestScore: number; highestScore: number; attemptCount: number }>> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("sentence_practice_history")
      .select("vocab_id, overall_score, attempt_number")
      .eq("user_id", userId)
      .eq("vocab_set_id", setId);

    if (error) throw error;

    const stats: Record<string, { latestScore: number; highestScore: number; attemptCount: number }> = {};
    if (!data) return stats;

    // Group records by vocab_id
    const groups: Record<string, typeof data> = {};
    for (const row of data) {
      if (!groups[row.vocab_id]) {
        groups[row.vocab_id] = [];
      }
      groups[row.vocab_id].push(row);
    }

    // Compute stats for each group
    for (const vocabId in groups) {
      const rows = groups[vocabId];
      const attemptCount = rows.length;
      let highestScore = 0;
      let latestScore = 0;
      let maxAttempt = -1;

      for (const row of rows) {
        if (row.overall_score > highestScore) {
          highestScore = row.overall_score;
        }
        if (row.attempt_number > maxAttempt) {
          maxAttempt = row.attempt_number;
          latestScore = row.overall_score;
        }
      }

      stats[vocabId] = {
        latestScore,
        highestScore,
        attemptCount,
      };
    }

    return stats;
  },
};
