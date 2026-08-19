import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { Database } from "@/types/database";

type ReadingHighlightRow = Database["public"]["Tables"]["reading_highlights"]["Row"];

export type ReadingHighlight = {
  id: string;
  articleId: string;
  paragraphId: string;
  language: "en" | "vi";
  selectedText: string;
  color: "yellow" | "green" | "blue" | "pink" | "purple";
};

function normalize(row: ReadingHighlightRow): ReadingHighlight {
  return {
    id: row.id,
    articleId: row.article_id,
    paragraphId: row.paragraph_id,
    language: row.language,
    selectedText: row.selected_text,
    color: row.color,
  };
}

export const ReadingHighlightRepository = {
  listByArticle: cache(async (articleId: string) => {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return [];

    const { data, error } = await supabase
      .from("reading_highlights")
      .select("*")
      .eq("article_id", articleId)
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) {
      if ("code" in error && error.code === "42P01") return [];
      throw error;
    }

    return (data ?? []).map(normalize);
  }),
};
