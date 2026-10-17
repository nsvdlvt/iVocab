import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { Database, Json } from "@/types/database";

export type ReadingArticleRow = Database["public"]["Tables"]["reading_articles"]["Row"];

export interface ReadingParagraph {
  id: string;
  text: string;
  translation?: string;
  highlighted_words?: string[];
}

export class AdminReadingRepository {
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

  static async getArticles(
    page: number = 1,
    pageSize: number = 10,
    search?: string,
    status?: "draft" | "published" | "all",
    topic?: string,
    level?: string
  ) {
    const supabase = await this.getSupabase();
    
    let query = supabase.from("reading_articles").select("*", { count: "exact" });
    
    if (status && status !== "all") {
      query = query.eq("status", status);
    }
    if (topic && topic !== "all") {
      query = query.eq("topic", topic);
    }
    if (level && level !== "all") {
      query = query.eq("level", level);
    }
    if (search && search.trim()) {
      const term = search.trim();
      query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
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

  static async getArticleById(id: string): Promise<ReadingArticleRow | null> {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from("reading_articles")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  static async createArticle(
    payload: {
      slug: string;
      title: string;
      description?: string | null;
      topic: string;
      level: string;
      estimated_reading_minutes?: number;
      vocabulary_count?: number;
      english_content: Json;
      vietnamese_content: Json;
      status: "draft" | "published";
    }
  ): Promise<ReadingArticleRow> {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from("reading_articles")
      .insert({
        ...payload,
        published_at: payload.status === "published" ? new Date().toISOString() : null,
      })
      .select("*")
      .single();

    if (error) throw error;
    return data;
  }

  static async updateArticle(
    id: string,
    updates: Partial<Database["public"]["Tables"]["reading_articles"]["Update"]>
  ): Promise<ReadingArticleRow> {
    const supabase = await this.getSupabase();
    const updatePayload = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    if (updates.status === "published" && !updates.published_at) {
      updatePayload.published_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("reading_articles")
      .update(updatePayload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteArticle(id: string): Promise<{ success: boolean }> {
    const supabase = await this.getSupabase();
    // Delete highlights first
    await supabase.from("reading_highlights").delete().eq("article_id", id);
    const { error } = await supabase.from("reading_articles").delete().eq("id", id);
    if (error) throw error;
    return { success: true };
  }

  static async getHighlightsStats() {
    const supabase = await this.getSupabase();
    const { count } = await supabase
      .from("reading_highlights")
      .select("id", { count: "exact", head: true });
    return {
      totalHighlights: count || 0,
    };
  }
}
