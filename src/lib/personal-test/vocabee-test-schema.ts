import { z } from "zod";

export const MatchingItemSchema = z.object({
  id: z.number().int({ message: "ID phải là số nguyên" }),
  word: z.string().trim().min(1, { message: "Từ vựng không được để trống" }),
  definition: z.string().trim().min(1, { message: "Định nghĩa không được để trống" }),
  explanation: z.string().trim().min(1, { message: "Giải thích không được để trống" }),
});

export const MatchingExerciseSchema = z.object({
  type: z.literal("matching"),
  items: z.array(MatchingItemSchema).min(1, { message: "Bài tập Matching phải có ít nhất 1 câu hỏi" }),
});

export const SentenceCompletionItemSchema = z.object({
  id: z.number().int({ message: "ID phải là số nguyên" }),
  sentence: z.string().trim().min(1, { message: "Câu hỏi không được để trống" }),
  answer: z.string().trim().min(1, { message: "Đáp án không được để trống" }),
  explanation: z.string().trim().min(1, { message: "Giải thích không được để trống" }),
});

export const SentenceCompletionExerciseSchema = z.object({
  type: z.literal("sentence_completion"),
  word_bank: z.array(z.string().trim().min(1, { message: "Từ trong word bank không được để trống" }))
    .min(1, { message: "Word bank phải có ít nhất 1 từ" }),
  items: z.array(SentenceCompletionItemSchema).min(1, { message: "Bài tập điền từ phải có ít nhất 1 câu hỏi" }),
});

export const SynonymsMatchingItemSchema = z.object({
  id: z.number().int({ message: "ID phải là số nguyên" }),
  word: z.string().trim().min(1, { message: "Từ vựng không được để trống" }),
  synonyms: z.array(z.string().trim().min(1, { message: "Từ đồng nghĩa không được để trống" }))
    .min(1, { message: "Phải có ít nhất 1 từ đồng nghĩa" })
    .max(2, { message: "Chỉ được chứa tối đa 2 từ đồng nghĩa" }),
  explanation: z.string().trim().min(1, { message: "Giải thích không được để trống" }),
});

export const SynonymsMatchingExerciseSchema = z.object({
  type: z.literal("synonyms_matching"),
  items: z.array(SynonymsMatchingItemSchema).min(1, { message: "Bài tập từ đồng nghĩa phải có ít nhất 1 câu hỏi" }),
});

export const ClozeTestAnswerSchema = z.object({
  id: z.number().int({ message: "ID phải là số nguyên" }),
  answer: z.string().trim().min(1, { message: "Đáp án không được để trống" }),
  explanation: z.string().trim().min(1, { message: "Giải thích không được để trống" }),
});

export const ClozeTestExerciseSchema = z.object({
  type: z.literal("cloze_test"),
  word_bank: z.array(z.string().trim().min(1, { message: "Từ trong word bank không được để trống" }))
    .min(1, { message: "Word bank phải có ít nhất 1 từ" }),
  passage: z.string().trim().min(1, { message: "Đoạn văn passage không được để trống" }),
  answers: z.array(ClozeTestAnswerSchema).min(1, { message: "Cloze test phải có ít nhất 1 đáp án" }),
});

export const ExerciseSchema = z.discriminatedUnion("type", [
  MatchingExerciseSchema,
  SentenceCompletionExerciseSchema,
  SynonymsMatchingExerciseSchema,
  ClozeTestExerciseSchema,
]);

export const VocabeeTestSetSchema = z.object({
  id: z.string().trim().min(1, { message: "ID của Set không được để trống" }),
  label: z.string().trim().min(1, { message: "Tên Set không được để trống" }),
  words: z.array(z.string().trim().min(1, { message: "Từ vựng không được để trống" }))
    .min(1, { message: "Mỗi Set phải chứa ít nhất 1 từ vựng" }),
  exercises: z.array(ExerciseSchema).length(4, { message: "Mỗi Set phải có đúng 4 dạng bài tập" }),
});

export const VocabeeTestSchema = z.object({
  schema: z.literal("vocabee-test-v1", {
    message: 'Trường "schema" phải có giá trị chính xác là "vocabee-test-v1"',
  }),
  title: z.string().trim().min(1, { message: "Tiêu đề bài kiểm tra không được để trống" }),
  total_words: z.number().int().positive({ message: "Tổng số từ (total_words) phải là số nguyên dương" }),
  total_sets: z.number().int().positive({ message: "Tổng số set (total_sets) phải là số nguyên dương" }),
  sets: z.array(VocabeeTestSetSchema).min(1, { message: "Bài kiểm tra phải có ít nhất 1 Set" }),
});
