import { createClient } from "@/lib/supabase/server";
import { Database } from "@/types/database";
import { cache } from "react";

type VocabularyRow = Database["public"]["Tables"]["vocabularies"]["Row"];
type VocabularyInsert = Database["public"]["Tables"]["vocabularies"]["Insert"];
type ReviewRow = Database["public"]["Tables"]["reviews"]["Row"];
type VocabSetRow = Database["public"]["Tables"]["vocab_sets"]["Row"];
export type LibraryVocabularyRow = VocabularyRow & {
  vocab_sets?: Pick<VocabSetRow, "id" | "title" | "color" | "deleted_at"> | null;
  review?: ReviewRow | null;
};

const ACTIVE_VOCABULARY_SELECT = `
  *,
  vocab_sets!inner(id, title, color, deleted_at),
  review:reviews(*)
`;

async function getActiveVocabularyRows(userId: string): Promise<LibraryVocabularyRow[]> {
  const supabase = await createClient();
  const rawRows: LibraryVocabularyRow[] = [];
  let from = 0;
  const PAGE_SIZE = 1000;

  while (true) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from("vocabularies")
      .select(ACTIVE_VOCABULARY_SELECT)
      .eq("owner_id", userId)
      .is("deleted_at", null)
      .is("vocab_sets.deleted_at", null)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    const page = (data ?? []) as unknown as LibraryVocabularyRow[];
    rawRows.push(...page);

    if (page.length < PAGE_SIZE) {
      break;
    }

    from += PAGE_SIZE;
  }

  return rawRows.map((row) => {
    const typed = row;
    const review = (row as LibraryVocabularyRow & { review?: ReviewRow | ReviewRow[] | null }).review;
    return {
      ...typed,
      review: Array.isArray(review) ? review[0] ?? null : review ?? null,
      vocab_sets: Array.isArray(typed.vocab_sets) ? typed.vocab_sets[0] ?? null : typed.vocab_sets ?? null,
    };
  });
}

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
    if (process.env.NODE_ENV === "development") {
      console.log("[vocabulary.repository] getPublicBySetId:start", { setId });
    }
    const setResult = await supabase
      .from("vocab_sets")
      .select("visibility")
      .eq("id", setId)
      .is("deleted_at", null)
      .maybeSingle();

    if (setResult.error) {
      console.error("[vocabulary.repository] getPublicBySetId:set-check-error", { setId, error: setResult.error });
      throw setResult.error;
    }
    const isShareable = setResult.data?.visibility === "public" || setResult.data?.visibility === "unlisted" || setResult.data?.visibility == null;
    if (process.env.NODE_ENV === "development") {
      console.log("[vocabulary.repository] getPublicBySetId:set-check-result", {
        setId,
        shareable: !!setResult.data && isShareable,
        visibility: setResult.data?.visibility ?? null,
      });
    }
    if (!setResult.data || !isShareable) return [];

    const { data, error } = await supabase
      .from("vocabularies")
      .select("*")
      .eq("set_id", setId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[vocabulary.repository] getPublicBySetId:error", { setId, error });
      throw error;
    }
    if (process.env.NODE_ENV === "development") {
      console.log("[vocabulary.repository] getPublicBySetId:result", {
        setId,
        wordCount: data?.length ?? 0,
      });
    }
    return data ?? [];
  }),

  countByUser: cache(async (userId: string): Promise<number> => {
    return (await getActiveVocabularyRows(userId)).length;
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

  async setFavoriteStatus(id: string, ownerId: string, isFavorite: boolean): Promise<void> {
    return this.updateStarStatus(id, ownerId, isFavorite);
  },

  getLibraryByUser: cache(async (userId: string): Promise<LibraryVocabularyRow[]> => {
    return getActiveVocabularyRows(userId);
  }),
};
