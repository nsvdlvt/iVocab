import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { Database } from "@/types/database";

export type VocabSetRow = Database["public"]["Tables"]["vocab_sets"]["Row"];
export type VocabularyRow = Database["public"]["Tables"]["vocabularies"]["Row"];

export class AdminVocabularyRepository {
  private static async getSupabase() {
    const cookieStore = await cookies();
    return createServerClient<Database>(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      }
    );
  }

  static async getSets(
    page: number = 1,
    pageSize: number = 10,
    search?: string,
    visibility?: string
  ) {
    const supabase = await this.getSupabase();
    
    let query = supabase.from("vocab_sets").select("*, profiles(id, email, display_name)", { count: "exact" });
    
    if (visibility && visibility !== "all") {
      query = query.eq("visibility", visibility);
    }

    if (search && search.trim()) {
      const term = search.trim();
      query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
    }
    
    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);
      
    if (error) throw error;

    // Attach word counts
    const setsWithCounts = await Promise.all(
      (data || []).map(async (set) => {
        const { count: wordCount } = await supabase
          .from("vocabularies")
          .select("id", { count: "exact", head: true })
          .eq("set_id", set.id);
        return {
          ...set,
          word_count: wordCount || 0,
        };
      })
    );
    
    return {
      data: setsWithCounts,
      count: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  }

  static async getSetById(id: string) {
    const supabase = await this.getSupabase();
    const { data: set, error } = await supabase
      .from("vocab_sets")
      .select("*, profiles(id, email, display_name)")
      .eq("id", id)
      .maybeSingle();

    if (error || !set) throw error || new Error("Bộ từ vựng không tồn tại");

    const { data: words, count: wordCount } = await supabase
      .from("vocabularies")
      .select("*", { count: "exact" })
      .eq("set_id", id)
      .order("created_at", { ascending: true });

    return {
      ...set,
      words: words || [],
      word_count: wordCount || 0,
    };
  }

  static async updateSet(
    id: string,
    updates: Partial<Database["public"]["Tables"]["vocab_sets"]["Update"]>
  ) {
    const supabase = await this.getSupabase();
    const { error } = await supabase
      .from("vocab_sets")
      .update(updates)
      .eq("id", id);
    if (error) throw error;
    return { success: true };
  }

  static async deleteSet(id: string) {
    const supabase = await this.getSupabase();
    // First delete associated vocabularies
    await supabase.from("vocabularies").delete().eq("set_id", id);
    const { error } = await supabase.from("vocab_sets").delete().eq("id", id);
    if (error) throw error;
    return { success: true };
  }

  static async getWords(
    page: number = 1,
    pageSize: number = 10,
    search?: string,
    setId?: string,
    partOfSpeech?: string,
    difficulty?: string
  ) {
    const supabase = await this.getSupabase();
    
    let query = supabase.from("vocabularies").select("*, vocab_sets(id, title, user_id)", { count: "exact" });
    
    if (setId) {
      query = query.eq("set_id", setId);
    }
    if (partOfSpeech && partOfSpeech !== "all") {
      query = query.eq("part_of_speech", partOfSpeech);
    }
    if (difficulty && difficulty !== "all") {
      query = query.eq("difficulty", difficulty);
    }
    if (search && search.trim()) {
      const term = search.trim();
      query = query.or(`word.ilike.%${term}%,meaning.ilike.%${term}%`);
    }
    
    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);
      
    if (error) throw error;
    
    return {
      data: data || [],
      count: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  }

  static async getWordById(id: string) {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from("vocabularies")
      .select("*, vocab_sets(id, title)")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) throw error || new Error("Từ vựng không tồn tại");
    return data;
  }

  static async updateWord(
    id: string,
    updates: Partial<Database["public"]["Tables"]["vocabularies"]["Update"]>
  ) {
    const supabase = await this.getSupabase();
    const { error } = await supabase
      .from("vocabularies")
      .update(updates)
      .eq("id", id);
    if (error) throw error;
    return { success: true };
  }

  static async deleteWord(id: string) {
    const supabase = await this.getSupabase();
    // Also delete any review records referencing this word
    await supabase.from("reviews").delete().eq("vocabulary_id", id);
    const { error } = await supabase.from("vocabularies").delete().eq("id", id);
    if (error) throw error;
    return { success: true };
  }
}
