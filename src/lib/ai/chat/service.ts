// src/lib/ai/chat/service.ts
import {
  getCloudflareTimeout,
  isCloudflareConfigured,
  sanitizeErrorMessage,
} from "@/lib/ai/cloudflare/config";
import {
  executeChatCompletionWithFallback,
  streamChatCompletionWithFallback,
} from "@/lib/ai/cloudflare/provider";
import { VOCABEE_CHAT_SYSTEM_PROMPT } from "./system-prompt";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

export const CHAT_SYSTEM_PROMPT = VOCABEE_CHAT_SYSTEM_PROMPT;

export const MAX_MESSAGE_LENGTH = 4000;
export const MAX_MESSAGES_COUNT = 40;
export const MAX_TOTAL_CHARS = 32000;
export const DEFAULT_CHAT_MAX_TOKENS = 2048;
export const DEFAULT_CHAT_TEMPERATURE = 0.6;

export interface ChatTurnMessage {
  role: "user" | "assistant";
  content: string;
}

export type ValidationResult =
  | { ok: true; messages: ChatTurnMessage[] }
  | { ok: false; error: string };

/**
 * Validates and normalizes incoming chat messages from the client.
 * Only permits "user" and "assistant" roles; enforces length and count limits.
 */
export function validateChatMessages(raw: unknown): ValidationResult {
  if (!Array.isArray(raw) || raw.length === 0) {
    return { ok: false, error: "Vui lòng nhập nội dung tin nhắn." };
  }

  const normalized: ChatTurnMessage[] = [];

  for (const item of raw) {
    if (!item || typeof item !== "object") {
      return { ok: false, error: "Định dạng tin nhắn không hợp lệ." };
    }

    const role = (item as { role?: unknown }).role;
    const content = (item as { content?: unknown }).content;

    if (role !== "user" && role !== "assistant") {
      return { ok: false, error: "Vai trò tin nhắn không được hỗ trợ." };
    }

    if (typeof content !== "string") {
      return { ok: false, error: "Nội dung tin nhắn phải là văn bản." };
    }

    const trimmed = content.trim();
    if (!trimmed) {
      continue;
    }

    if (trimmed.length > MAX_MESSAGE_LENGTH) {
      return {
        ok: false,
        error: `Tin nhắn không được vượt quá ${MAX_MESSAGE_LENGTH.toLocaleString("vi-VN")} ký tự.`,
      };
    }

    normalized.push({ role, content: trimmed });
  }

  if (normalized.length === 0) {
    return { ok: false, error: "Vui lòng nhập nội dung tin nhắn." };
  }

  if (normalized[normalized.length - 1].role !== "user") {
    return { ok: false, error: "Tin nhắn cuối cùng phải đến từ người dùng." };
  }

  // Keep the most recent turns within count and total character budget
  const recent = normalized.slice(-MAX_MESSAGES_COUNT);
  const bounded: ChatTurnMessage[] = [];
  let charSum = 0;

  for (let i = recent.length - 1; i >= 0; i--) {
    const msg = recent[i];
    if (bounded.length > 0 && charSum + msg.content.length > MAX_TOTAL_CHARS) {
      break;
    }
    bounded.unshift(msg);
    charSum += msg.content.length;
  }

  return { ok: true, messages: bounded };
}

/**
 * Builds the provider message array with the fixed general-purpose system prompt.
 */
export function buildChatCompletionMessages(
  messages: ChatTurnMessage[]
): ChatCompletionMessageParam[] {
  return [
    { role: "system", content: CHAT_SYSTEM_PROMPT },
    ...messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  ];
}

/**
 * Maps provider/network/timeout errors into safe, user-friendly HTTP responses.
 */
export function classifyChatError(error: unknown): { status: number; message: string } {
  const sanitized = sanitizeErrorMessage(error);
  const lower = sanitized.toLowerCase();
  const statusFromErr = Number((error as { status?: unknown })?.status || 0);

  if (lower.includes("chưa cấu hình")) {
    return {
      status: 503,
      message: "Dịch vụ AI chưa được cấu hình trên máy chủ. Vui lòng liên hệ quản trị viên.",
    };
  }

  if (
    statusFromErr === 429 ||
    lower.includes("rate limit") ||
    lower.includes("rate-limited") ||
    lower.includes("neurons") ||
    lower.includes("quota")
  ) {
    return {
      status: 429,
      message: "Hệ thống AI đang nhận quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.",
    };
  }

  if (
    statusFromErr === 408 ||
    statusFromErr === 504 ||
    lower.includes("timeout") ||
    lower.includes("timed out")
  ) {
    return {
      status: 504,
      message: "Yêu cầu tới AI bị quá thời gian chờ. Vui lòng thử lại.",
    };
  }

  if (
    lower.includes("econnreset") ||
    lower.includes("enotfound") ||
    lower.includes("econnrefused") ||
    lower.includes("fetch failed") ||
    lower.includes("network")
  ) {
    return {
      status: 502,
      message: "Không thể kết nối tới máy chủ AI. Vui lòng kiểm tra mạng và thử lại.",
    };
  }

  if (statusFromErr >= 500 && statusFromErr < 600) {
    return {
      status: 502,
      message: "Máy chủ AI đang tạm thời gián đoạn. Vui lòng thử lại sau.",
    };
  }

  return {
    status: 502,
    message: sanitized || "Không thể nhận phản hồi từ AI. Vui lòng thử lại.",
  };
}

/**
 * Streams a general AI chat response from Cloudflare Workers AI.
 */
export async function* streamGeneralChat(
  messages: ChatTurnMessage[],
  signal?: AbortSignal
): AsyncGenerator<{ chunk: string; model: string }> {
  if (!isCloudflareConfigured()) {
    throw new Error("Chưa cấu hình CLOUDFLARE_API_TOKEN hoặc CLOUDFLARE_ACCOUNT_ID");
  }

  const timeoutController = new AbortController();
  const timeoutMs = getCloudflareTimeout();
  const timer = setTimeout(() => {
    timeoutController.abort(new Error("Request timed out"));
  }, timeoutMs);

  const onParentAbort = () => {
    timeoutController.abort(signal?.reason);
  };
  if (signal) {
    if (signal.aborted) {
      clearTimeout(timer);
      return;
    }
    signal.addEventListener("abort", onParentAbort, { once: true });
  }

  try {
    const completionMessages = buildChatCompletionMessages(messages);
    for await (const part of streamChatCompletionWithFallback({
      messages: completionMessages,
      feature: "chat",
      temperature: DEFAULT_CHAT_TEMPERATURE,
      maxTokens: DEFAULT_CHAT_MAX_TOKENS,
      signal: timeoutController.signal,
    })) {
      yield part;
    }
  } finally {
    clearTimeout(timer);
    if (signal) {
      signal.removeEventListener("abort", onParentAbort);
    }
  }
}

/**
 * Executes a non-streaming general AI chat completion from Cloudflare Workers AI.
 */
export async function generateGeneralChatReply(
  messages: ChatTurnMessage[],
  signal?: AbortSignal
): Promise<{ reply: string; model: string }> {
  if (!isCloudflareConfigured()) {
    throw new Error("Chưa cấu hình CLOUDFLARE_API_TOKEN hoặc CLOUDFLARE_ACCOUNT_ID");
  }

  const completionMessages = buildChatCompletionMessages(messages);
  const result = await executeChatCompletionWithFallback({
    messages: completionMessages,
    feature: "chat",
    temperature: DEFAULT_CHAT_TEMPERATURE,
    maxTokens: DEFAULT_CHAT_MAX_TOKENS,
    signal,
  });

  const reply = result.completion.choices?.[0]?.message?.content?.trim() || "";
  if (!reply) {
    throw new Error("AI không trả về nội dung hợp lệ.");
  }

  return { reply, model: result.model };
}
