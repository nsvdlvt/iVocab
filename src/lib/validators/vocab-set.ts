import { z } from "zod";

export const vocabSetSchema = z.object({
  title: z
    .string()
    .min(1, "Tên bộ từ vựng không được để trống")
    .max(100, "Tên bộ từ vựng không được vượt quá 100 ký tự"),
  description: z
    .string()
    .max(500, "Mô tả không được vượt quá 500 ký tự")
    .optional()
    .or(z.literal("")),
  source_language: z
    .string()
    .min(1, "Ngôn ngữ gốc không được để trống"),
  target_language: z
    .string()
    .min(1, "Ngôn ngữ mục tiêu không được để trống"),
  color: z
    .string()
    .min(1, "Vui lòng chọn màu sắc hiển thị")
    .optional()
    .or(z.literal("")),
  icon: z
    .string()
    .min(1, "Vui lòng chọn biểu tượng hiển thị")
    .optional()
    .or(z.literal("")),
  visibility: z.enum(["private", "unlisted", "public"], {
    message: "Trạng thái hiển thị không hợp lệ",
  }),
});

export type VocabSetFormValues = z.infer<typeof vocabSetSchema>;
