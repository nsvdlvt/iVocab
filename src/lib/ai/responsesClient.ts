// src/lib/ai/responsesClient.ts
import {
  executeChatCompletionWithFallback,
  type AIFeature,
} from "@/lib/ai/cloudflare";
import { AIResponseError, AIAbortError, AINetworkError } from "@/lib/ai/errors";
import type {
  ChatCompletionContentPart,
  ChatCompletionMessageParam,
} from "openai/resources/chat/completions";

export interface InputPart {
  type: "input_text" | "input_image" | "input_file" | string;
  text?: string;
  image_url?: string;
  image_base64?: string;
  file_id?: string;
  detail?: "low" | "high" | "auto";
}

export interface ResponsesRequestPayload {
  model?: string;
  input: string | InputPart[];
  text?: {
    format?: {
      type: "json_object" | "json_schema";
      name?: string;
      strict?: boolean;
      schema?: unknown;
    };
  };
  feature?: AIFeature;
  temperature?: number;
  max_tokens?: number;
  [key: string]: unknown;
}

export async function request<T = unknown>(
  payload: Omit<ResponsesRequestPayload, "model"> & { model?: string; feature?: AIFeature },
  abortSignal?: AbortSignal
): Promise<T> {
  const callerFile = getCallerFile();

  // Convert input to OpenAI chat messages format
  const messages: ChatCompletionMessageParam[] = [];

  if (typeof payload.input === "string") {
    messages.push({ role: "user", content: payload.input });
  } else if (Array.isArray(payload.input)) {
    const userContentParts: ChatCompletionContentPart[] = [];
    for (const part of payload.input) {
      if ((part.type === "input_text" || part.type === "text") && part.text) {
        userContentParts.push({ type: "text", text: part.text });
      } else if (
        (part.type === "input_image" || part.type === "image_url") &&
        (part.image_url || part.image_base64)
      ) {
        userContentParts.push({
          type: "image_url",
          image_url: { url: part.image_url || part.image_base64! },
        });
      }
    }
    messages.push({
      role: "user",
      content: userContentParts.length > 0 ? userContentParts : String(payload.input),
    });
  }

  if (messages.length === 0) {
    throw new AIResponseError("Không có nội dung để gửi tới AI.");
  }

  let feature: AIFeature = payload.feature || "vocab";
  if (!payload.feature) {
    if (callerFile.includes("sentence")) feature = "sentence";
    else if (callerFile.includes("writing")) feature = "writing";
    else if (callerFile.includes("quiz")) feature = "quiz";
    else if (callerFile.includes("import")) feature = "import";
  }

  try {
    const result = await executeChatCompletionWithFallback({
      messages,
      feature,
      signal: abortSignal,
      modelsOverride: payload.model ? [payload.model] : undefined,
      temperature: typeof payload.temperature === "number" ? payload.temperature : 0.3,
      maxTokens: typeof payload.max_tokens === "number" ? payload.max_tokens : undefined,
    });

    const replyText = result.completion.choices?.[0]?.message?.content ?? "";
    if (!replyText) {
      throw new AIResponseError("AI không trả về nội dung hợp lệ.");
    }

    return replyText as unknown as T;
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.name === "AbortError" || err.message.includes("bị hủy") || err.message.includes("Timeout")) {
        throw new AIAbortError("Yêu cầu AI bị gián đoạn hoặc quá thời gian xử lý.");
      }
      if (err.message.includes("kết nối") || err.message.includes("network")) {
        throw new AINetworkError(`Lỗi kết nối mạng: ${err.message}`);
      }
      throw new AIResponseError(err.message);
    }
    throw new AIResponseError(String(err));
  }
}

function getCallerFile(): string {
  const stack = new Error().stack?.split("\n").slice(2) ?? [];
  for (const line of stack) {
    if (line.includes("sentence-practice.ts")) return "sentence-practice.ts";
    if (line.includes("import-vocabulary.ts")) return "import-vocabulary.ts";
    if (line.includes("writing-assistant.ts")) return "writing-assistant.ts";
    if (line.includes("quiz.ts")) return "quiz.ts";
  }
  return "unknown";
}
