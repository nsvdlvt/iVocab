import { createClient } from "@/lib/supabase/server";
import { Database } from "@/types/database";
import { cache } from "react";

type VocabularyRow = Database["public"]["Tables"]["vocabularies"]["Row"];
type VocabularyInsert = Database["public"]["Tables"]["vocabularies"]["Insert"];

export const VocabularyRepository = {
  getBySetId: cache(async (setId: string, ownerId: string): Promise<VocabularyRow[]> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("vocabularies")
      .select("*")
      .eq("set_id", setId)
      .eq("owner_id", ownerId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data ?? [];
  }),

  getPublicBySetId: cache(async (setId: string): Promise<VocabularyRow[]> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("vocabularies")
      .select("*")
      .eq("set_id", setId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data ?? [];
  }),

  countByUser: cache(async (userId: string): Promise<number> => {
    const supabase = await createClient();
    const { count, error } = await supabase
      .from("vocabularies")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", userId)
      .is("deleted_at", null);

    if (error) throw error;
    return count ?? 0;
  }),

  /** Returns up to `limit` vocabulary rows owned by user (across all sets), used for quiz generation. */
  getForQuiz: cache(async (userId: string, limit = 40): Promise<VocabularyRow[]> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("vocabularies")
      .select("*")
      .eq("owner_id", userId)
      .is("deleted_at", null)
      .limit(limit);

    if (error) throw error;
    return data ?? [];
  }),

  bulkInsert: async (items: VocabularyInsert[]): Promise<void> => {
    if (items.length === 0) return;
    const supabase = await createClient();
    const { error } = await supabase.from("vocabularies").insert(items);
    if (error) throw error;
  },

  softDelete: async (id: string, ownerId: string): Promise<void> => {
    const supabase = await createClient();
    const { error } = await supabase
      .from("vocabularies")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("owner_id", ownerId);
    if (error) throw error;
  },

  getWordsForStudy: cache(async (setId: string, ownerId: string): Promise<VocabularyRow[]> => {
    const supabase = await createClient();
    
    // Check if display_order column exists dynamically or default sort by created_at.
    // In our types.ts schema, display_order is not defined yet, so we fallback.
    const { data, error } = await supabase
      .from("vocabularies")
      .select("*")
      .eq("set_id", setId)
      .eq("owner_id", ownerId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data ?? [];
  }),

  async updateStarStatus(id: string, ownerId: string, isStarred: boolean): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from("vocabularies")
      .update({ is_starred: isStarred })
      .eq("id", id)
      .eq("owner_id", ownerId);
    if (error) throw error;
  },
};
