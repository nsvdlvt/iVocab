import { createClient } from "@/lib/supabase/server";
import { cache } from "react";
import { Database, Json } from "@/types/database";

type ReadingRow = Database["public"]["Tables"]["reading_articles"]["Row"];

export type ReadingContent = {
  paragraphs: Array<{
    id: string;
    text: string;
    highlighted_words?: Array<{
      text: string;
      start?: number;
      end?: number;
      highlightColor?: string;
      meaning?: string;
      ipa?: string;
      partOfSpeech?: string;
      example?: string;
    }>;
  }>;
};

function asReadingContent(value: Json): ReadingContent {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { paragraphs: [] };
  }

  const paragraphs = "paragraphs" in value && Array.isArray(value.paragraphs) ? value.paragraphs : [];
  return {
    paragraphs: paragraphs.map((paragraph, index) => {
      const rawParagraph = paragraph as Record<string, unknown>;
      const highlightedWords = Array.isArray(rawParagraph.highlighted_words) ? rawParagraph.highlighted_words : [];
      const text =
        typeof rawParagraph.text === "string"
          ? rawParagraph.text
          : typeof rawParagraph.english === "string"
            ? rawParagraph.english
            : "";

      return {
        id: typeof rawParagraph.id === "string" ? rawParagraph.id : `paragraph-${index + 1}`,
        text,
        highlighted_words: highlightedWords.map((word) => {
          const rawWord = word as Record<string, unknown>;
          return {
            text: typeof rawWord.text === "string" ? rawWord.text : "",
            start: typeof rawWord.start === "number" ? rawWord.start : undefined,
            end: typeof rawWord.end === "number" ? rawWord.end : undefined,
            highlightColor: typeof rawWord.highlightColor === "string" ? rawWord.highlightColor : undefined,
            meaning: typeof rawWord.meaning === "string" ? rawWord.meaning : undefined,
            ipa: typeof rawWord.ipa === "string" ? rawWord.ipa : undefined,
            partOfSpeech: typeof rawWord.partOfSpeech === "string" ? rawWord.partOfSpeech : undefined,
            example: typeof rawWord.example === "string" ? rawWord.example : undefined,
          };
        }),
      };
    }),
  };
}

export function normalizeReadingRow(row: ReadingRow) {
  const englishContent = asReadingContent(row.english_content);
  const vietnameseContent = asReadingContent(row.vietnamese_content);
  const paragraphs = englishContent.paragraphs.map((paragraph, index) => {
    const translated = vietnameseContent.paragraphs[index];
    return {
      id: paragraph.id ?? `paragraph-${index + 1}`,
      source: paragraph.text,
      translation: translated?.text ?? "",
      highlightedWords: paragraph.highlighted_words?.map((word) => ({
        text: word.text,
        start: word.start,
        end: word.end,
        highlightColor: word.highlightColor,
        ipa: word.ipa,
        meaning: word.meaning,
        partOfSpeech: word.partOfSpeech,
        example: word.example,
      })),
    };
  });

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    coverImageUrl: row.cover_image_url,
    topic: row.topic,
    level: row.level,
    estimatedReadingMinutes: row.estimated_reading_minutes,
    vocabularyCount: row.vocabulary_count,
    status: row.status,
    publishedAt: row.published_at,
    paragraphs,
    sourceLanguage: "English",
    targetLanguage: "Vietnamese",
  };
}

export const ReadingRepository = {
  listPublished: cache(async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("reading_articles")
      .select("*")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) {
      if ("code" in error && error.code === "42P01") return [];
      throw error;
    }
    return (data ?? []).map(normalizeReadingRow);
  }),

  getBySlug: cache(async (slug: string) => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("reading_articles")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (error) {
      if ("code" in error && error.code === "42P01") return null;
      throw error;
    }
    if (!data || data.status !== "published") return null;
    return normalizeReadingRow(data);
  }),
};
