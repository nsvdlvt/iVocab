// src/lib/ai/openrouter/provider.ts
import OpenAI from "openai";
import {
  assertOpenRouterConfigured,
  getOpenRouterApiKey,
  getOpenRouterBaseUrl,
  getOpenRouterModelsForFeature,
  getOpenRouterTimeout,
  isOpenRouterConfigured,
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
let lastApiKey: string | null = null;
let lastBaseUrl: string | null = null;

/**
 * Resets or replaces cached client (useful for unit testing or dynamic config reloads)
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
      apiKey: currentKey || "unconfigured",
      baseURL: currentUrl,
      defaultHeaders: {
        "HTTP-Referer": "https://vocabee.site",
        "X-Title": "Vocabee AI Assistant",
      },
      timeout: getOpenRouterTimeout(),
      maxRetries: 0,
    });
    lastApiKey = currentKey;
    lastBaseUrl = currentUrl;
  }

  return cachedClient;
}

export interface ChatCompletionAttemptResult {
  completion: ChatCompletion;
  model: string;
  isFallback: boolean;
}

/**
 * Checks if an error is retryable with a fallback model.
 * Handles rate limits (429), server errors (500, 502, 503, 504), timeouts, quota limits (402), network errors.
 */
export function isRetryableModelError(error: unknown): boolean {
  if (!error) return false;

  const err = error as { status?: number; code?: string | number; message?: string; error?: { message?: string } };
  const msg = (err.message || err.error?.message || "").toLowerCase();

  // If daily account-level quota is exhausted, retrying immediately is futile and causes unnecessary delay
  if (msg.includes("free-models-per-day") || msg.includes("free_daily_limit")) {
    return false;
  }

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
    msg.includes("credits") ||
    msg.includes("unavailable") ||
    msg.includes("timeout") ||
    msg.includes("timed out") ||
    msg.includes("econnreset") ||
    msg.includes("etimedout") ||
    msg.includes("provider returned error") ||
    msg.includes("temporarily rate-limited") ||
    msg.includes("high demand")
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

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Executes chat completion with multi-model fallback.
 * Prioritizes Gemma 4 26B A4B as primary model, falling back to Nemotron 3.5 Lightning.
 */
export async function executeChatCompletionWithFallback(
  options: ExecuteChatOptions
): Promise<ChatCompletionAttemptResult> {
  if (!isOpenRouterConfigured()) {
    assertOpenRouterConfigured();
  }

  const client = getOpenRouterClient();
  const models =
    options.modelsOverride && options.modelsOverride.length > 0
      ? options.modelsOverride
      : getOpenRouterModelsForFeature(options.feature);

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
            messages: options.messages,
            tools: options.tools && options.tools.length > 0 ? options.tools : undefined,
            tool_choice:
              options.tools && options.tools.length > 0
                ? options.tool_choice || "auto"
                : undefined,
            temperature: options.temperature ?? 0.2,
            max_tokens: options.maxTokens,
          },
          { signal: options.signal }
        );

        if (completion && completion.choices && completion.choices.length > 0) {
          return { completion, model, isFallback };
        }

        throw new Error(`Model ${model} returned empty choices`);
      } catch (err: unknown) {
        lastError = err;
        const sanitized = sanitizeErrorMessage(err);

        if (attempt < maxRetries && isRetryableModelError(err)) {
          const backoff = (attempt + 1) * 600;
          console.warn(
            `[OpenRouter Provider] Model "${model}" attempt ${attempt + 1} failed: ${sanitized}. Retrying in ${backoff}ms...`
          );
          await delay(backoff);
          continue;
        }

        console.warn(
          `[OpenRouter Provider] Model "${model}" exhausted attempts. Error: ${sanitized}. ${
            modelIndex + 1 < models.length
              ? `Attempting fallback model "${models[modelIndex + 1]}"...`
              : "No further fallback models available."
          }`
        );
        break; // Break retry loop to try next model
      }
    }
  }

  const finalMsg = sanitizeErrorMessage(lastError);
  throw new Error(`Tất cả các model AI đều không khả dụng. Lỗi gần nhất: ${finalMsg}`);
}

/**
 * Streams chat completion with multi-model fallback.
 * Yields streaming text chunks and the model used.
 */
export async function* streamChatCompletionWithFallback(
  options: ExecuteChatOptions
): AsyncGenerator<{ chunk: string; model: string }> {
  if (!isOpenRouterConfigured()) {
    assertOpenRouterConfigured();
  }

  const client = getOpenRouterClient();
  const models =
    options.modelsOverride && options.modelsOverride.length > 0
      ? options.modelsOverride
      : getOpenRouterModelsForFeature(options.feature);

  let lastError: unknown = null;

  for (const model of models) {
    if (options.signal?.aborted) {
      throw new Error("Yêu cầu AI đã bị hủy.");
    }

    try {
      const stream = await client.chat.completions.create(
        {
          model,
          messages: options.messages,
          temperature: options.temperature ?? 0.2,
          max_tokens: options.maxTokens,
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
          yield { chunk: delta, model };
        }
      }
      return;
    } catch (err: unknown) {
      lastError = err;
      console.warn(
        `[OpenRouter Provider] Streaming failed for model "${model}": ${sanitizeErrorMessage(
          err
        )}. Trying fallback...`
      );
    }
  }

  throw new Error(
    `Không thể kết nối stream với các model AI. Lỗi: ${sanitizeErrorMessage(lastError)}`
  );
}
