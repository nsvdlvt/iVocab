// src/lib/ai/agent/types.ts

export type AgentActionType =
  | "create_vocabulary_set"
  | "update_vocabulary_set"
  | "delete_vocabulary_set"
  | "create_vocabulary_word"
  | "update_vocabulary_word"
  | "delete_vocabulary_word"
  | "bulk_create_vocabulary_words"
  | "bulk_update_vocabulary_words"
  | "save_personal_test";

export interface PendingConfirmation {
  actionId: string;
  action: AgentActionType;
  title: string;
  description: string;
  targetName: string;
  affectedCount: number;
  affectedSummary: string;
  consequences: string[];
  previewItems?: Array<{ label: string; detail?: string }>;
  token: string;
  expiresAt: string;
  status: "pending" | "confirmed" | "cancelled" | "expired" | "failed";
  executedMessage?: string;
}

export interface AgentToolEvent {
  toolName: string;
  displayName: string;
  status: "running" | "completed" | "error";
}

export interface ExerciseQuestionCardItem {
  id: string;
  vocabularyId?: string;
  word: string;
  questionType:
    | "mcq"
    | "fill_in_blank"
    | "word_formation"
    | "cloze_test"
    | "synonym_selection"
    | "contextual_mcq"
    | "sentence_completion";
  prompt: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

export interface AgentResultCard {
  id: string;
  kind: "vocab_sets" | "learning_stats" | "word_list" | "practice_quiz" | "action_result";
  title: string;
  subtitle?: string;
  metrics?: Array<{ label: string; value: string }>;
  items?: Array<{
    id?: string;
    title: string;
    subtitle?: string;
    badge?: string;
    detail?: string;
  }>;
  questions?: ExerciseQuestionCardItem[];
  actionUrl?: string;
}

export interface AgentChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AgentResponse {
  success: boolean;
  reply: string;
  toolEvents: AgentToolEvent[];
  confirmations: PendingConfirmation[];
  cards: AgentResultCard[];
  model?: string;
  error?: string;
}
