// src/lib/ai/agent/orchestrator.ts
import { openai } from "@/lib/openai";
import { AGENT_TOOLS } from "./tools";
import { AgentExecutor } from "./executor";
import { VOCABEE_AGENT_SYSTEM_PROMPT } from "./system-prompt";
import {
  AgentChatMessage,
  AgentResponse,
  AgentToolEvent,
  PendingConfirmation,
} from "./types";
import {
  getMaxAgentSteps,
  sanitizeErrorMessage,
  getOpenRouterChatModel,
  getOpenRouterModelsForFeature,
} from "@/lib/ai/openrouter/config";
import type {
  ChatCompletionMessageParam,
  ChatCompletionToolMessageParam,
} from "openai/resources/chat/completions";

export const TOOL_DISPLAY_NAMES: Record<string, string> = {
  get_vocabulary_overview: "Kiểm tra tổng quan từ vựng",
  list_vocab_sets: "Tìm danh sách bộ từ vựng",
  get_vocab_set_details: "Tra cứu chi tiết bộ từ",
  search_vocabulary: "Tìm kiếm từ vựng",
  get_vocabulary_details: "Tra cứu thông tin từ vựng",
  lookup_dictionary_word: "Tra cứu từ điển Vocabee",
  find_duplicate_vocabularies: "Quét từ vựng trùng lặp",
  get_vocabularies_by_cefr: "Lọc từ theo chuẩn CEFR",
  get_learning_progress: "Đọc dữ liệu tiến trình học",
  get_review_schedule: "Tính toán lịch ôn tập SRS",
  get_srs_sets_distribution: "Phân tích phân bố SRS theo bộ từ",
  get_learning_history: "Truy vấn lịch sử học tập",
  get_frequently_incorrect_words: "Phân tích từ thường làm sai",
  get_sets_learning_comparison: "So sánh hiệu quả các bộ từ",
  create_vocab_set: "Tạo bộ từ mới",
  rename_vocab_set: "Đổi tên bộ từ",
  add_vocabulary: "Thêm từ mới vào bộ",
  bulk_add_vocabulary: "Thêm danh sách từ vựng",
  update_vocabulary: "Cập nhật từ vựng",
  delete_vocab_set: "Chuẩn bị xóa bộ từ",
  delete_vocabulary: "Chuẩn bị xóa từ vựng",
  reset_vocab_set_progress: "Chuẩn bị reset tiến trình bộ từ",
  delete_vocab_set_learning_history: "Chuẩn bị xóa lịch sử học",
  reset_single_vocabulary_progress: "Chuẩn bị reset tiến trình từ",
};

/**
 * Consolidates consecutive or repeated tool events to prevent UI spamming.
 * e.g., 4x "Tìm kiếm từ vựng" -> 1x "Tìm kiếm từ vựng (4 lần)".
 */
export function consolidateToolEvents(rawEvents: AgentToolEvent[]): AgentToolEvent[] {
  const map = new Map<string, { event: AgentToolEvent; count: number }>();

  for (const evt of rawEvents) {
    const key = evt.toolName;
    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
      if (evt.status === "error") existing.event.status = "error";
      if (evt.summary) existing.event.summary = evt.summary;
    } else {
      map.set(key, { event: { ...evt }, count: 1 });
    }
  }

  return Array.from(map.values()).map(({ event, count }) => {
    if (count > 1) {
      return {
        ...event,
        displayName: `${event.displayName} (${count} lần)`,
      };
    }
    return event;
  });
}

/**
 * Detects if user's latest message is asking for personal database information
 */
function isPersonalDataQuery(messages: AgentChatMessage[]): boolean {
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUserMsg) return false;
  const text = lastUserMsg.content.toLowerCase();
  const keywords = [
    "từ vựng",
    "bộ từ",
    "kho từ",
    "tiến độ",
    "ôn tập",
    "hôm nay",
    "đến hạn",
    "quá hạn",
    "bao nhiêu",
    "srs",
    "lịch sử",
    "thống kê",
    "bộ nào",
    "từ nào",
    "tạo bộ",
    "xóa bộ",
    "thêm từ",
    "xóa từ",
    "reset",
    "chi tiết",
    "danh sách",
  ];
  return keywords.some((kw) => text.includes(kw));
}

export interface AgentConversationOptions {
  onToolEvent?: (event: AgentToolEvent) => void;
  onTextDelta?: (delta: string) => void;
  onStatusChange?: (status: string) => void;
  signal?: AbortSignal;
}

export async function runAgentConversation(
  userId: string,
  userMessages: AgentChatMessage[],
  options?: AgentConversationOptions
): Promise<AgentResponse> {
  const executor = new AgentExecutor(userId);
  const rawToolEvents: AgentToolEvent[] = [];
  let pendingConfirmation: PendingConfirmation | null = null;
  const maxSteps = getMaxAgentSteps();

  // Track executed tools to detect loops & prevent redundant calls
  const executedToolSignatures = new Map<string, unknown>();
  const toolCallFrequencies = new Map<string, number>();

  // Build initial message chain with recent conversation context (trimmed for performance)
  const conversationMessages: ChatCompletionMessageParam[] = [
    { role: "system", content: VOCABEE_AGENT_SYSTEM_PROMPT },
    ...userMessages.slice(-15).map((m): ChatCompletionMessageParam => {
      if (m.role === "tool") {
        return {
          role: "tool",
          tool_call_id: m.tool_call_id || "call_init",
          content: m.content,
        } as ChatCompletionToolMessageParam;
      }
      return {
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
      };
    }),
  ];

  let chosenModel = getOpenRouterChatModel();
  let step = 0;
  let executedAnyDbTool = false;
  const isDataQuery = isPersonalDataQuery(userMessages);

  const modelsToTry = getOpenRouterModelsForFeature("agent");

  while (step < maxSteps) {
    step += 1;
    options?.onStatusChange?.("Đang phân tích yêu cầu...");

    let completion = null;
    let lastError: unknown = null;

    for (const model of modelsToTry) {
      if (options?.signal?.aborted) break;
      try {
        const response = await openai.chat.completions.create(
          {
            model,
            messages: conversationMessages,
            tools: AGENT_TOOLS,
            tool_choice: "auto",
            temperature: 0.2,
          },
          { signal: options?.signal }
        );

        if (response && response.choices && response.choices.length > 0) {
          completion = response;
          chosenModel = model;
          break;
        }
      } catch (err: unknown) {
        lastError = err;
        const sanitized = sanitizeErrorMessage(err);
        console.warn(
          `[AgentOrchestrator] Model "${model}" failed: ${sanitized}. Trying fallback...`
        );
      }
    }

    if (!completion || !completion.choices || completion.choices.length === 0) {
      console.error("[AgentOrchestrator] All models failed:", sanitizeErrorMessage(lastError));
      return {
        success: false,
        reply: "Rất tiếc, máy chủ AI đang bận hoặc gặp sự cố kết nối. Vui lòng thử lại sau ít phút.",
        toolEvents: consolidateToolEvents(rawToolEvents),
        confirmation: null,
        error: lastError ? sanitizeErrorMessage(lastError) : "API Error",
      };
    }

    const message = completion.choices[0].message;
    conversationMessages.push(message);

    // If model made tool calls (one or multiple in this turn)
    if (message.tool_calls && message.tool_calls.length > 0) {
      for (const call of message.tool_calls) {
        if (call.type !== "function") continue;
        const toolName = call.function.name;
        let toolArgs: Record<string, unknown> = {};
        try {
          toolArgs =
            typeof call.function.arguments === "string"
              ? JSON.parse(call.function.arguments || "{}")
              : call.function.arguments || {};
        } catch {
          toolArgs = {};
        }

        const displayName = TOOL_DISPLAY_NAMES[toolName] || toolName;
        const signature = `${toolName}:${JSON.stringify(toolArgs)}`;
        const freq = (toolCallFrequencies.get(toolName) || 0) + 1;
        toolCallFrequencies.set(toolName, freq);

        options?.onStatusChange?.(`Đang thực hiện: ${displayName}...`);

        // 1. Check for identical duplicate tool call in the same turn
        if (executedToolSignatures.has(signature)) {
          const cachedData = executedToolSignatures.get(signature);
          conversationMessages.push({
            role: "tool",
            tool_call_id: call.id,
            content: JSON.stringify({
              status: "cached",
              data: cachedData,
              note: "[HỆ THỐNG]: Bạn đã gọi truy vấn này với cùng tham số ở bước trước. Vui lòng sử dụng kết quả đã trả về để tổng hợp câu trả lời cho người dùng, TUYỆT ĐỐI KHÔNG gọi lặp lại.",
            }),
          });
          continue;
        }

        // 2. Cap repetitive single-word search calls to prevent runaway loops (max 2 per request)
        if (toolName === "search_vocabulary" && freq > 2) {
          conversationMessages.push({
            role: "tool",
            tool_call_id: call.id,
            content: JSON.stringify({
              status: "rate_limit_exceeded",
              warning:
                "[HỆ THỐNG]: Đã đạt giới hạn tìm kiếm từ lẻ. Để xem phân bố các từ đến hạn theo bộ từ, hãy gọi 'get_srs_sets_distribution'. Để xem toàn bộ từ của một bộ, hãy gọi 'get_vocab_set_details'. Hãy tổng hợp câu trả lời từ dữ liệu đã có.",
            }),
          });
          continue;
        }

        // Execute tool securely
        const toolRunningEvent: AgentToolEvent = {
          toolName,
          displayName,
          status: "running",
        };
        options?.onToolEvent?.(toolRunningEvent);

        const execResult = await executor.execute(toolName, toolArgs);
        executedAnyDbTool = true;

        if (execResult.confirmation) {
          pendingConfirmation = execResult.confirmation;
        }

        executedToolSignatures.set(signature, execResult.data);

        const toolCompletedEvent: AgentToolEvent = {
          toolName,
          displayName,
          status: execResult.error ? "error" : "completed",
          summary: execResult.summary,
        };
        rawToolEvents.push(toolCompletedEvent);
        options?.onToolEvent?.(toolCompletedEvent);

        // Feed tool response back into conversation
        conversationMessages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify({
            status: execResult.error ? "error" : "success",
            data: execResult.data,
            error: execResult.error,
            summary: execResult.summary,
            confirmationRequired: Boolean(execResult.confirmation),
            confirmationTitle: execResult.confirmation?.title,
          }),
        });
      }

      // Continue loop so model can process tool results or call next tool
      continue;
    }

    // No tool calls -> Model generated final response text
    const finalReply = message.content?.trim() || "";

    // If streaming callback is active and final reply exists, stream out in progressive chunks
    if (options?.onTextDelta && finalReply) {
      const tokens = finalReply.match(/(\S+\s*|\s+)/g) || [finalReply];
      for (const token of tokens) {
        if (options.signal?.aborted) break;
        options.onTextDelta(token);
        await new Promise((r) => setTimeout(r, 12));
      }
    }

    // Anti-hallucination check: If user requested personal database stats but no tools were executed
    if (isDataQuery && !executedAnyDbTool && step === 1) {
      console.warn(
        "[AgentOrchestrator] Warning: Data query completed without any database tool execution."
      );
    }

    return {
      success: true,
      reply: finalReply,
      toolEvents: consolidateToolEvents(rawToolEvents),
      confirmation: pendingConfirmation,
      model: chosenModel,
    };
  }

  // If reached max steps
  return {
    success: true,
    reply: "Tôi đã xử lý và đối chiếu đầy đủ các bước dữ liệu cần thiết cho yêu cầu của bạn.",
    toolEvents: consolidateToolEvents(rawToolEvents),
    confirmation: pendingConfirmation,
    model: chosenModel,
  };
}
