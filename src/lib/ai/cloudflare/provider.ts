// src/lib/ai/cloudflare/provider.ts
import OpenAI from "openai";
import {
  assertCloudflareConfigured,
  getCloudflareApiToken,
  getCloudflareBaseUrl,
  getCloudflareModelsForFeature,
  getCloudflareTimeout,
  isCloudflareConfigured,
  sanitizeErrorMessage,
  type AIFeature,
} from "./config";
import type {
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionMessageParam,
  ChatCompletionTool,
  ChatCompletion,
} from "openai/resources/chat/completions";

let cachedClient: OpenAI | null = null;
let lastApiToken: string | null = null;
let lastBaseUrl: string | null = null;

/**
 * Resets or replaces cached client (useful for unit testing or dynamic config reloads).
 */
export function resetCloudflareClient(client: OpenAI | null = null): void {
  cachedClient = client;
  lastApiToken = client ? "__mock__" : null;
  lastBaseUrl = client ? "__mock__" : null;
}

/**
 * Returns a singleton or refreshed OpenAI client configured for Cloudflare Workers AI.
 */
export function getCloudflareClient(): OpenAI {
  if (cachedClient && lastApiToken === "__mock__") {
    return cachedClient;
  }

  const currentToken = getCloudflareApiToken();
  const currentUrl = getCloudflareBaseUrl();

  if (!cachedClient || lastApiToken !== currentToken || lastBaseUrl !== currentUrl) {
    cachedClient = new OpenAI({
      apiKey: currentToken || "unconfigured",
      baseURL: currentUrl,
      timeout: getCloudflareTimeout(),
      maxRetries: 0,
    });
    lastApiToken = currentToken;
    lastBaseUrl = currentUrl;
  }

  return cachedClient;
}

/**
 * Normalizes chat messages for Cloudflare Workers AI's strict JSON schema validator.
 * In particular, assistant tool-call turns returned by models like @cf/openai/gpt-oss-20b
 * contain `content: null` and non-standard fields (`reasoning_content`, `refusal`, etc.)
 * which trigger Cloudflare error 5006 ("'string' not in 'null'") if sent back verbatim.
 */
export function sanitizeChatMessages(
  messages: ChatCompletionMessageParam[]
): ChatCompletionMessageParam[] {
  return messages.map((msg) => {
    if (msg.role === "assistant") {
      const assistantMsg = msg as Extract<ChatCompletionMessageParam, { role: "assistant" }>;
      const content =
        typeof assistantMsg.content === "string"
          ? assistantMsg.content
          : Array.isArray(assistantMsg.content)
          ? assistantMsg.content
          : "";

      const sanitized: Extract<ChatCompletionMessageParam, { role: "assistant" }> = {
        role: "assistant",
        content,
      };

      if (Array.isArray(assistantMsg.tool_calls) && assistantMsg.tool_calls.length > 0) {
        sanitized.tool_calls = assistantMsg.tool_calls;
      }

      return sanitized;
    }

    if (msg.role === "tool") {
      const toolMsg = msg as Extract<ChatCompletionMessageParam, { role: "tool" }>;
      return {
        role: "tool",
        tool_call_id: toolMsg.tool_call_id,
        content:
          typeof toolMsg.content === "string"
            ? toolMsg.content
            : JSON.stringify(toolMsg.content ?? ""),
      };
    }

    if (msg.role === "system" || msg.role === "developer") {
      return {
        role: msg.role,
        content: typeof msg.content === "string" ? msg.content : String(msg.content ?? ""),
      } as ChatCompletionMessageParam;
    }

    return {
      role: msg.role,
      content: msg.content ?? "",
    } as ChatCompletionMessageParam;
  });
}

export interface ChatCompletionAttemptResult {
  completion: ChatCompletion;
  model: string;
  isFallback: boolean;
}

/**
 * Checks if an error is retryable with the same or fallback model.
 * Handles rate limits (429), server errors (500, 502, 503, 504), timeouts, quota limits (402), network errors.
 */
export function isRetryableModelError(error: unknown): boolean {
  if (!error) return false;

  const err = error as { status?: number; code?: string | number; message?: string; error?: { message?: string } };
  const msg = (err.message || err.error?.message || "").toLowerCase();

  const status = Number(err.status || err.code || 0);

  if (
    status === 429 ||
    status === 402 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504
  ) {
    return true;
  }

  if (
    msg.includes("rate limit") ||
    msg.includes("rate-limited") ||
    msg.includes("quota") ||
    msg.includes("neurons") ||
    msg.includes("unavailable") ||
    msg.includes("timeout") ||
    msg.includes("timed out") ||
    msg.includes("econnreset") ||
    msg.includes("etimedout") ||
    msg.includes("provider returned error") ||
    msg.includes("temporarily rate-limited") ||
    msg.includes("high demand") ||
    msg.includes("overloaded") ||
    msg.includes("capacity")
  ) {
    return true;
  }

  return false;
}

export interface ExecuteChatOptions {
  messages: ChatCompletionMessageParam[];
  tools?: ChatCompletionTool[];
  tool_choice?: ChatCompletionCreateParamsNonStreaming["tool_choice"];
  temperature?: number;
  modelsOverride?: string[];
  maxTokens?: number;
  feature?: AIFeature;
  signal?: AbortSignal;
  maxRetriesPerModel?: number;
}

/**
 * Returns model-specific request parameters to avoid excessive default thinking latency
 * on Cloudflare Workers AI reasoning models while keeping outputs fast and deterministic.
 */
export function getModelSpecificParams(model: string): Record<string, unknown> {
  if (model.includes("gemma-4") && process.env.CLOUDFLARE_ENABLE_THINKING !== "true") {
    return { chat_template_kwargs: { enable_thinking: false } };
  }
  if (model.includes("gpt-oss")) {
    return { reasoning_effort: process.env.CLOUDFLARE_REASONING_EFFORT?.trim() || "low" };
  }
  return {};
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function hasValidAssistantOutput(completion: ChatCompletion, hasTools: boolean): boolean {
  const message = completion?.choices?.[0]?.message;
  if (!message) return false;

  const hasText = typeof message.content === "string" && message.content.trim().length > 0;
  const hasToolCalls = Array.isArray(message.tool_calls) && message.tool_calls.length > 0;

  return hasTools ? hasText || hasToolCalls : hasText;
}

/**
 * Executes chat completion with multi-model fallback on Cloudflare Workers AI.
 * Prioritizes @cf/google/gemma-4-26b-a4b-it as primary model, falling back to @cf/openai/gpt-oss-20b.
 */
export async function executeChatCompletionWithFallback(
  options: ExecuteChatOptions
): Promise<ChatCompletionAttemptResult> {
  if (lastApiToken !== "__mock__" && !isCloudflareConfigured()) {
    assertCloudflareConfigured();
  }

  const client = getCloudflareClient();
  const models =
    options.modelsOverride && options.modelsOverride.length > 0
      ? options.modelsOverride
      : getCloudflareModelsForFeature(options.feature);

  const sanitizedMessages = sanitizeChatMessages(options.messages);
  const hasTools = Boolean(options.tools && options.tools.length > 0);
  const primaryModel = models[0];
  const maxRetries = options.maxRetriesPerModel ?? 1;
  let lastError: unknown = null;

  for (let modelIndex = 0; modelIndex < models.length; modelIndex++) {
    const model = models[modelIndex];
    const isFallback = model !== primaryModel;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (options.signal?.aborted) {
        throw new Error("Yêu cầu AI đã bị hủy.");
      }

      try {
        const completion = await client.chat.completions.create(
          {
            model,
            messages: sanitizedMessages,
            tools: hasTools ? options.tools : undefined,
            tool_choice: hasTools ? options.tool_choice || "auto" : undefined,
            temperature: options.temperature ?? 0.2,
            ...(typeof options.maxTokens === "number" ? { max_tokens: options.maxTokens } : {}),
            ...getModelSpecificParams(model),
          },
          { signal: options.signal }
        );

        if (hasValidAssistantOutput(completion, hasTools)) {
          return { completion, model, isFallback };
        }

        throw new Error(`Model ${model} returned empty choices`);
      } catch (err: unknown) {
        lastError = err;
        const sanitized = sanitizeErrorMessage(err);

        if (attempt < maxRetries && isRetryableModelError(err)) {
          const backoff = (attempt + 1) * 600;
          console.warn(
            `[Cloudflare AI Provider] Model "${model}" attempt ${attempt + 1} failed: ${sanitized}. Retrying in ${backoff}ms...`
          );
          await delay(backoff);
          continue;
        }

        console.warn(
          `[Cloudflare AI Provider] Model "${model}" exhausted attempts. Error: ${sanitized}. ${
            modelIndex + 1 < models.length
              ? `Attempting fallback model "${models[modelIndex + 1]}"...`
              : "No further fallback models available."
          }`
        );
        break;
      }
    }
  }

  const finalMsg = sanitizeErrorMessage(lastError);
  throw new Error(`Tất cả các model AI đều không khả dụng. Lỗi gần nhất: ${finalMsg}`);
}

/**
 * Streams chat completion with multi-model fallback on Cloudflare Workers AI.
 * Yields streaming text chunks and the model used.
 */
export async function* streamChatCompletionWithFallback(
  options: ExecuteChatOptions
): AsyncGenerator<{ chunk: string; model: string }> {
  if (lastApiToken !== "__mock__" && !isCloudflareConfigured()) {
    assertCloudflareConfigured();
  }

  const client = getCloudflareClient();
  const models =
    options.modelsOverride && options.modelsOverride.length > 0
      ? options.modelsOverride
      : getCloudflareModelsForFeature(options.feature);

  const sanitizedMessages = sanitizeChatMessages(options.messages);
  let lastError: unknown = null;

  for (const model of models) {
    if (options.signal?.aborted) {
      throw new Error("Yêu cầu AI đã bị hủy.");
    }

    let hasYielded = false;

    try {
      const stream = await client.chat.completions.create(
        {
          model,
          messages: sanitizedMessages,
          temperature: options.temperature ?? 0.2,
          ...(typeof options.maxTokens === "number" ? { max_tokens: options.maxTokens } : {}),
          ...getModelSpecificParams(model),
          stream: true,
        },
        { signal: options.signal }
      );

      for await (const part of stream) {
        if (options.signal?.aborted) {
          return;
        }
        const delta = part.choices?.[0]?.delta?.content || "";
        if (delta) {
          hasYielded = true;
          yield { chunk: delta, model };
        }
      }

      if (hasYielded) {
        return;
      }

      throw new Error(`Model ${model} returned an empty stream`);
    } catch (err: unknown) {
      if (options.signal?.aborted || (err instanceof Error && err.name === "AbortError")) {
        return;
      }
      if (hasYielded) {
        throw err;
      }
      lastError = err;
      console.warn(
        `[Cloudflare AI Provider] Streaming failed for model "${model}": ${sanitizeErrorMessage(
          err
        )}. Trying fallback...`
      );
    }
  }

  throw new Error(
    `Không thể kết nối stream với các model AI. Lỗi: ${sanitizeErrorMessage(lastError)}`
  );
}
