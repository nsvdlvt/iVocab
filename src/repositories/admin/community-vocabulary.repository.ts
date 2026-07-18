import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { Database } from "@/types/database";

export type CommunityCategoryRow = Database["public"]["Tables"]["community_categories"]["Row"] & {
  community_vocabulary_sets_count?: number;
};

export type CommunityVocabularySetRow =
  Database["public"]["Tables"]["community_vocabulary_sets"]["Row"] & {
    community_categories?: Pick<Database["public"]["Tables"]["community_categories"]["Row"], "id" | "name" | "slug" | "color" | "icon"> | null;
    vocab_sets?: Pick<Database["public"]["Tables"]["vocab_sets"]["Row"], "id" | "title" | "description" | "icon" | "color"> | null;
    profiles?: Pick<Database["public"]["Tables"]["profiles"]["Row"], "id" | "email" | "display_name"> | null;
  };

export type VocabularySetOption = Pick<Database["public"]["Tables"]["vocab_sets"]["Row"], "id" | "title" | "description" | "icon" | "color">;

export class CommunityVocabularyRepository {
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

  static async getCategories() {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from("community_categories")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data;
  }

  static async getCommunitySets(page = 1, pageSize = 10, search = "", sort = "created_at", order: "asc" | "desc" = "desc") {
    const supabase = await this.getSupabase();
    const allowedSortColumns = new Set([
      "created_at",
      "updated_at",
      "sort_order",
      "title_snapshot",
      "difficulty",
      "estimated_minutes",
    ]);
    const sortColumn = allowedSortColumns.has(sort) ? sort : "created_at";
    let query = supabase
      .from("community_vocabulary_sets")
      .select("*, community_categories(id, name, slug, color, icon), vocab_sets(id, title, description, icon, color), profiles(id, email, display_name)", { count: "exact" });

    if (search.trim()) {
      const term = search.trim().replace(/,/g, " ");
      query = query.or(`title_snapshot.ilike.%${term}%,description_snapshot.ilike.%${term}%`);
    }

    const { data, count, error } = await query
      .order(sortColumn, { ascending: order === "asc" })
      .range((page - 1) * pageSize, page * pageSize - 1);
    if (error) throw error;
    return { data: data ?? [], count: count ?? 0, page, pageSize };
  }

  static async getPublishableVocabularySets(search = "") {
    const supabase = await this.getSupabase();
    let query = supabase
      .from("vocab_sets")
      .select("id, title, description, icon, color")
      .order("updated_at", { ascending: false })
      .limit(30);

    if (search.trim()) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  }

  static async getCommunityOverview() {
    const [categories, sets] = await Promise.all([
      this.getCategories(),
      this.getCommunitySets(1, 50),
    ]);

    return { categories, sets: sets.data };
  }
}
