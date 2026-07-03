import { createClient } from "@/lib/supabase/server";
import { Database } from "@/types/database";

type VocabSetRow = Database["public"]["Tables"]["vocab_sets"]["Row"];
type VocabSetInsert = Database["public"]["Tables"]["vocab_sets"]["Insert"];
type VocabSetUpdate = Database["public"]["Tables"]["vocab_sets"]["Update"];

export const VocabSetRepository = {
  async getVocabSets(
    userId: string,
    options: {
      search?: string;
      visibility?: string;
      sort?: string;
      page?: number;
      limit?: number;
      showDeleted?: boolean;
    } = {}
  ) {
    const supabase = await createClient();
    const {
      search,
      visibility,
      sort = "updated_at_desc",
      page = 1,
      limit = 12,
      showDeleted = false,
    } = options;

    let query = supabase
      .from("vocab_sets")
      .select("*", { count: "exact" })
      .eq("user_id", userId);

    // Filter soft deleted
    if (showDeleted) {
      query = query.not("deleted_at", "is", null);
    } else {
      query = query.is("deleted_at", null);
    }

    // Filter visibility
    if (visibility && visibility !== "all") {
      query = query.eq("visibility", visibility);
    }

    // Filter search
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Sorting
    if (sort === "updated_at_desc") {
      query = query.order("updated_at", { ascending: false });
    } else if (sort === "updated_at_asc") {
      query = query.order("updated_at", { ascending: true });
    } else if (sort === "title_asc") {
      query = query.order("title", { ascending: true });
    } else if (sort === "title_desc") {
      query = query.order("title", { ascending: false });
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;

    return { data: data || [], count: count || 0 };
  },

  async getVocabSetById(id: string, userId: string): Promise<VocabSetRow | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("vocab_sets")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async createVocabSet(
    id: string,
    userId: string,
    data: Omit<VocabSetInsert, "id" | "user_id" | "created_at" | "updated_at" | "deleted_at">
  ): Promise<VocabSetRow> {
    const supabase = await createClient();
    const { data: inserted, error } = await supabase
      .from("vocab_sets")
      .insert({
        id,
        user_id: userId,
        ...data,
      })
      .select()
      .single();

    if (error) throw error;
    return inserted;
  },

  async updateVocabSet(id: string, userId: string, data: VocabSetUpdate): Promise<VocabSetRow> {
    const supabase = await createClient();
    const { data: updated, error } = await supabase
      .from("vocab_sets")
      .update(data)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    return updated;
  },

  async softDeleteVocabSet(id: string, userId: string): Promise<VocabSetRow> {
    const supabase = await createClient();
    const { data: updated, error } = await supabase
      .from("vocab_sets")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    return updated;
  },

  async restoreVocabSet(id: string, userId: string): Promise<VocabSetRow> {
    const supabase = await createClient();
    const { data: updated, error } = await supabase
      .from("vocab_sets")
      .update({ deleted_at: null })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    return updated;
  },

  async permanentDeleteVocabSet(id: string, userId: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from("vocab_sets")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw error;
  },

  async getVocabularyItems(setId: string, ownerId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("vocabularies")
      .select("*")
      .eq("set_id", setId)
      .eq("owner_id", ownerId)
      .is("deleted_at", null);

    if (error) throw error;
    return data || [];
  },

  async bulkInsertVocabularyItems(items: Database["public"]["Tables"]["vocabularies"]["Insert"][]) {
    if (items.length === 0) return;
    const supabase = await createClient();
    const { error } = await supabase.from("vocabularies").insert(items);
    if (error) throw error;
  }
};
