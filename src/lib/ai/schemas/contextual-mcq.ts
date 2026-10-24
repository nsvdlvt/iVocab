import { z } from "zod";

export const contextualMcqOptionSchema = z.string().min(1).trim();

export const contextualMcqQuestionSchema = z.object({
  id: z.string().min(1),
  vocabularyId: z.string().min(1),
  targetWord: z.string().min(1),
  questionType: z.enum([
    "recognition",
    "collocation",
    "contextual_mcq",
    "supportive_hint",
  ]),
  difficulty: z.enum(["easy", "medium", "challenging"]),
  prompt: z.string().min(1),
  sentence: z.string().min(1),
  options: z.array(contextualMcqOptionSchema).length(4),
  correctAnswerIndex: z.number().int().min(0).max(3),
  explanation: z.string().min(1),
  strongestDistractor: z.string().min(1),
  whyDistractorWrong: z.string().min(1),
  hint: z.string().optional().nullable(),
  exampleTranslation: z.string().optional().nullable(),
});

export const contextualMcqBatchSchema = z.object({
  questions: z.array(contextualMcqQuestionSchema).min(1),
});

export type ContextualMcqQuestion = z.infer<typeof contextualMcqQuestionSchema>;
export type ContextualMcqBatch = z.infer<typeof contextualMcqBatchSchema>;

/**
 * Client-safe question payload - NEVER exposes correctAnswerIndex or explanation before answer submission!
 */
export interface ClientAdaptiveQuestion {
  id: string;
  vocabularyId: string;
  targetWord: string;
  questionType: "recognition" | "collocation" | "contextual_mcq" | "supportive_hint";
  difficulty: "easy" | "medium" | "challenging";
  prompt: string;
  sentence: string;
  options: string[];
  hint?: string | null;
  questionNumber: number;
  totalEstimated: number;
}

export interface AdaptiveAnswerSubmissionResult {
  isCorrect: boolean;
  correctAnswerIndex: number;
  selectedOptionIndex: number;
  explanation: string;
  strongestDistractor: string;
  whyDistractorWrong: string;
  updatedSrsLevel: number;
  isWeakWord: boolean;
  example?: string | null;
  exampleTranslation?: string | null;
  targetWord?: string;
  meaning?: string;
  nextQuestion?: ClientAdaptiveQuestion | null;
  sessionCompleted?: boolean;
  isDuplicateSubmission?: boolean;
}

export interface AdaptiveSessionSummary {
  sessionId: string;
  setId: string;
  totalQuestions: number;
  correctCount: number;
  accuracy: number;
  weakWords: Array<{
    id: string;
    word: string;
    meaning: string;
    ipa?: string | null;
    example?: string | null;
    example_translation?: string | null;
    wrongCount: number;
  }>;
  improvedWords: Array<{
    id: string;
    word: string;
    meaning: string;
    example?: string | null;
    example_translation?: string | null;
    previousLevel: number;
    newLevel: number;
  }>;
  aiRecommendation: string;
}
