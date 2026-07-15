import { z } from "zod";

export const aiQuizQuestionSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  word: z.string().min(1),
  blank: z.string().min(1),
  options: z.array(z.string().min(1)).length(4),
  correctAnswer: z
    .union([z.number(), z.string()])
    .transform((value) => (typeof value === "string" ? Number(value) : value))
    .pipe(z.number().int().min(0).max(3)),
  explanation: z.string().min(1),
  meaning: z.string().min(1),
});

export const aiQuizSchema = z.object({
  title: z.string().min(1),
  passage: z.string().min(1),
  questions: z.array(aiQuizQuestionSchema).min(1),
  source: z.literal("ai").optional(),
});

export type AiQuizQuestion = z.infer<typeof aiQuizQuestionSchema>;
export type AiQuizPayload = z.infer<typeof aiQuizSchema>;
