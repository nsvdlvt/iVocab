// src/lib/ai/agent/types.ts

export type DestructiveActionType =
  | "delete_vocab_set"
  | "delete_vocabulary"
  | "reset_vocab_set_progress"
  | "delete_vocab_set_learning_history"
  | "reset_single_vocabulary_progress";

export interface PendingConfirmation {
  id: string;
  action: DestructiveActionType;
  title: string;
  targetId: string;
  targetName: string;
  affectedSummary: string;
  deletedSummary: string;
  retainedSummary: string;
  token: string;
  status: "pending" | "confirmed" | "cancelled" | "expired";
  executedMessage?: string;
}

export interface AgentToolEvent {
  toolName: string;
  displayName: string;
  status: "running" | "completed" | "error";
  summary?: string;
}

export interface AgentChatMessage {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  tool_call_id?: string;
  name?: string;
}

export interface AgentResponse {
  success: boolean;
  reply: string;
  toolEvents?: AgentToolEvent[];
  confirmation?: PendingConfirmation | null;
  model?: string;
  error?: string;
}

export interface ConfirmActionRequest {
  token: string;
  action: DestructiveActionType;
  targetId: string;
}
