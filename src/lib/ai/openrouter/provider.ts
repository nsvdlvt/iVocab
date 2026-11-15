// src/lib/ai/openrouter/provider.ts
import OpenAI from "openai";
import {
  getOpenRouterApiKey,
  getOpenRouterBaseUrl,
  getOpenRouterModels,
  getOpenRouterTimeout,
  sanitizeErrorMessage,
} from "./config";
import type {
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionMessageParam,
  ChatCompletionTool,
  ChatCompletion,
} from "openai/resources/chat/completions";

let cachedClient: OpenAI | null = null;
let lastApiKey: string | null = null;
let lastBaseUrl: string | null = null;

/**
 * Resets or replaces cached client (useful for testing or dynamic config reloads)
 */
export function resetOpenRouterClient(client: OpenAI | null = null): void {
  cachedClient = client;
  lastApiKey = client ? "__mock__" : null;
  lastBaseUrl = client ? "__mock__" : null;
}

/**
 * Returns a singleton or refreshed OpenAI client configured for OpenRouter.
 */

export function getOpenRouterClient(): OpenAI {
  if (cachedClient && lastApiKey === "__mock__") {
    return cachedClient;
  }

  const currentKey = getOpenRouterApiKey();
  const currentUrl = getOpenRouterBaseUrl();

  if (!cachedClient || lastApiKey !== currentKey || lastBaseUrl !== currentUrl) {
    cachedClient = new OpenAI({
      apiKey: currentKey,
      baseURL: currentUrl,
      defaultHeaders: {
        "HTTP-Referer": "https://vocabee.site",
        "X-Title": "Vocabee AI Assistant",
      },
      timeout: getOpenRouterTimeout(),
    });
    lastApiKey = currentKey;
    lastBaseUrl = currentUrl;
  }

  return cachedClient;
}

export interface ChatCompletionAttemptResult {
  completion: ChatCompletion;
  model: string;
}

/**
 * Checks if an error is retryable with a fallback model.
 * Handles rate limits (429), server errors (500, 502, 503), timeouts, quota limits (402), network errors.
 */
export function isRetryableModelError(error: unknown): boolean {
  if (!error) return false;

  const err = error as { status?: number; code?: string | number; message?: string };
  const status = Number(err.status || err.code || 0);

  if (status === 429 || status === 402 || status === 500 || status === 502 || status === 503 || status === 504) {
    return true;
  }

  const msg = (err.message || "").toLowerCase();
  if (
    msg.includes("rate limit") ||
    msg.includes("rate-limited") ||
    msg.includes("quota") ||
    msg.includes("credits") ||
    msg.includes("unavailable") ||
    msg.includes("timeout") ||
    msg.includes("timed out") ||
    msg.includes("econnreset") ||
    msg.includes("etimedout") ||
    msg.includes("provider returned error") ||
    msg.includes("temporarily rate-limited")
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
}

/**
 * Executes chat completion with multi-model fallback.
 * Iterates through prioritized models:
 * 1. google/gemma-4-26b-a4b-it:free
 * 2. nvidia/nemotron-3.5-lightning:free
 * 3. openrouter/free
 */
export async function executeChatCompletionWithFallback(
  options: ExecuteChatOptions
): Promise<ChatCompletionAttemptResult> {
  const client = getOpenRouterClient();
  const models = options.modelsOverride && options.modelsOverride.length > 0
    ? options.modelsOverride
    : getOpenRouterModels();

  let lastError: unknown = null;

  for (const model of models) {
    try {
      const completion = await client.chat.completions.create({
        model,
        messages: options.messages,
        tools: options.tools && options.tools.length > 0 ? options.tools : undefined,
        tool_choice: options.tools && options.tools.length > 0 ? (options.tool_choice || "auto") : undefined,
        temperature: options.temperature ?? 0.2,
        max_tokens: options.maxTokens,
      });

      if (completion && completion.choices && completion.choices.length > 0) {
        return { completion, model };
      }

      throw new Error(`Model ${model} returned empty choices`);
    } catch (err: unknown) {
      lastError = err;
      const sanitized = sanitizeErrorMessage(err);
      console.warn(
        `[OpenRouter Provider] Model "${model}" failed: ${sanitized}. Attempting fallback model if available...`
      );

      if (!isRetryableModelError(err)) {
        // If not a standard retryable error, still allow fallback if there are more models
        console.warn(`[OpenRouter Provider] Error was non-standard but trying fallback: ${sanitized}`);
      }
    }
  }

  const finalMsg = sanitizeErrorMessage(lastError);
  throw new Error(`Tất cả các model AI đều không khả dụng. Lỗi gần nhất: ${finalMsg}`);
}

/**
 * Streams final assistant reply using fallback.
 */
export async function* streamChatCompletionWithFallback(
  options: ExecuteChatOptions
): AsyncGenerator<{ chunk: string; model: string }> {
  const client = getOpenRouterClient();
  const models = options.modelsOverride && options.modelsOverride.length > 0
    ? options.modelsOverride
    : getOpenRouterModels();

  let lastError: unknown = null;

  for (const model of models) {
    try {
      const stream = await client.chat.completions.create({
        model,
        messages: options.messages,
        temperature: options.temperature ?? 0.2,
        stream: true,
      });

      for await (const part of stream) {
        const delta = part.choices?.[0]?.delta?.content || "";
        if (delta) {
          yield { chunk: delta, model };
        }
      }
      return;
    } catch (err: unknown) {
      lastError = err;
      console.warn(
        `[OpenRouter Provider] Streaming failed for model "${model}": ${sanitizeErrorMessage(err)}. Trying fallback...`
      );
    }
  }

  throw new Error(
    `Không thể kết nối stream với các model AI. Lỗi: ${sanitizeErrorMessage(lastError)}`
  );
}
