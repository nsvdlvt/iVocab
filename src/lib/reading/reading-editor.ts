import { z } from "zod";

export const readingTopics = [
  { label: "Công nghệ", value: "Technology" },
  { label: "Môi trường", value: "Environment" },
  { label: "Giáo dục", value: "Education" },
  { label: "Sức khỏe & Lối sống", value: "Health & Lifestyle" },
  { label: "Xã hội", value: "Society" },
  { label: "Kinh doanh", value: "Business" },
  { label: "Khoa học", value: "Science" },
  { label: "Du lịch", value: "Travel" },
  { label: "Văn hóa", value: "Culture" },
  { label: "Tương lai", value: "Future" },
  { label: "Khác", value: "Other" },
] as const;

export const readingLevels = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

export const readingCreateSchema = z.object({
  title: z.string().trim().min(1, "Vui lòng nhập tiêu đề."),
  description: z.string().trim().optional().or(z.literal("")),
  level: z.enum(readingLevels),
  topic: z.string().trim().min(1, "Vui lòng chọn chủ đề."),
  estimatedReadingMinutes: z.coerce.number().int().min(1).max(60),
  vocabularyCount: z.coerce.number().int().min(0).max(500),
  englishContent: z.string().trim().min(1, "Vui lòng nhập nội dung tiếng Anh."),
  vietnameseContent: z.string().trim().min(1, "Vui lòng nhập nội dung tiếng Việt."),
  coverImageUrl: z.string().url().optional().or(z.literal("")),
});

export type ReadingCreateInput = z.infer<typeof readingCreateSchema>;

export type ParagraphDraft = {
  id: string;
  text: string;
};

export function slugifyReadingTitle(title: string) {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function parseParagraphDrafts(raw: string): ParagraphDraft[] {
  return raw
    .split(/\n\s*\n+/g)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((text, index) => ({ id: `p${index + 1}`, text }));
}
