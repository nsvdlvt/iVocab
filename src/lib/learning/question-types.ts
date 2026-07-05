import { Database } from "@/types/database";

export type VocabularyRow = Database["public"]["Tables"]["vocabularies"]["Row"];

export type QuestionDirection = "en-vi" | "vi-en";
export type QuestionType = "mcq" | "input" | "word-dictation" | "sentence-dictation";
export type AnswerState = "unanswered" | "correct" | "near" | "wrong" | "unknown";

export interface LearnOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface LearnQuestion {
  id: string; // word id
  prompt: string;
  direction: QuestionDirection;
  type: QuestionType;
  options: LearnOption[];
  correctOptionId: string;
  correctAnswer: string;
  word: VocabularyRow;
}
