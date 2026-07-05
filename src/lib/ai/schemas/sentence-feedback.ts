// src/lib/ai/schemas/sentence-feedback.ts
import { z } from "zod";

/**
 * Zod schema for the AI's strict JSON feedback response.
 * Includes optional advanced fields that UI components may display.
 */
export const sentenceFeedbackSchema = z.object({
  usedTargetWord: z.boolean(),
  message: z.string().optional(),
  feedback: z.string().optional().default(""),
  mistakes: z.array(
    z.object({
      type: z.string(),
      start: z.number().int().nonnegative(),
      end: z.number().int().nonnegative(),
      confidence: z.number().min(0).max(1),
    })
  ).optional().default([]),
  // Optional advanced data
  correctedSentence: z.string().optional(),
  alternativeSentences: z.array(z.string()).optional(),
  explanation: z.string().optional(),
});

export type SentenceFeedback = z.infer<typeof sentenceFeedbackSchema>;
