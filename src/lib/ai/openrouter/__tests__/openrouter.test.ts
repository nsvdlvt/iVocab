// src/lib/ai/openrouter/__tests__/openrouter.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { ChatCompletion } from "openai/resources/chat/completions";
import {
  getOpenRouterApiKey,
  getOpenRouterBaseUrl,
  getOpenRouterChatModel,
  getOpenRouterVocabModel,
  getOpenRouterFallbackModel,
  getOpenRouterModelsForFeature,
  getMaxAgentSteps,
  sanitizeErrorMessage,
  isOpenRouterConfigured,
  assertOpenRouterConfigured,
  DEFAULT_OPENROUTER_CHAT_MODEL,
  DEFAULT_OPENROUTER_VOCAB_MODEL,
  DEFAULT_OPENROUTER_FALLBACK_MODEL,
} from "../config";
import {
  isRetryableModelError,
  executeChatCompletionWithFallback,
  getOpenRouterClient,
  resetOpenRouterClient,
} from "../provider";

describe("OpenRouter Configuration", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("reads OPENROUTER_API_KEY without exposing or logging it", () => {
    process.env.OPENROUTER_API_KEY = "sk-or-v1-testkey1234567890";
    expect(getOpenRouterApiKey()).toBe("sk-or-v1-testkey1234567890");
    expect(isOpenRouterConfigured()).toBe(true);
  });

  it("throws clear configuration error if OPENROUTER_API_KEY is missing", () => {
    delete process.env.OPENROUTER_API_KEY;
    expect(() => assertOpenRouterConfigured()).toThrow(
      "Chưa cấu hình biến môi trường OPENROUTER_API_KEY"
    );
  });

  it("reads OPENROUTER_BASE_URL and trims trailing slashes", () => {
    process.env.OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1///";
    expect(getOpenRouterBaseUrl()).toBe("https://openrouter.ai/api/v1");
  });

  it("returns default Gemma 4 and Nemotron models correctly", () => {
    delete process.env.OPENROUTER_CHAT_MODEL;
    delete process.env.OPENROUTER_VOCAB_MODEL;
    delete process.env.OPENROUTER_FALLBACK_MODEL;
    delete process.env.OPENROUTER_MODEL;
    delete process.env.AI_MODEL;

    expect(getOpenRouterChatModel()).toBe(DEFAULT_OPENROUTER_CHAT_MODEL);
    expect(getOpenRouterVocabModel()).toBe(DEFAULT_OPENROUTER_VOCAB_MODEL);
    expect(getOpenRouterFallbackModel()).toBe(DEFAULT_OPENROUTER_FALLBACK_MODEL);
  });

  it("selects correct primary model by feature with Nemotron as fallback", () => {
    const chatModels = getOpenRouterModelsForFeature("chat");
    expect(chatModels[0]).toBe("google/gemma-4-26b-a4b-it:free");
    expect(chatModels[1]).toBe("nvidia/nemotron-3.5-lightning:free");

    const vocabModels = getOpenRouterModelsForFeature("vocab");
    expect(vocabModels[0]).toBe("google/gemma-4-26b-a4b-it:free");
    expect(vocabModels[1]).toBe("nvidia/nemotron-3.5-lightning:free");
  });

  it("sanitizes API keys and Bearer tokens from error strings", () => {
    const rawError =
      "Error communicating with upstream sk-or-v1-abcdef0123456789abcdef0123456789 failed with Bearer sk-secret";
    const sanitized = sanitizeErrorMessage(rawError);
    expect(sanitized).not.toContain("sk-or-v1-abcdef0123456789abcdef0123456789");
    expect(sanitized).not.toContain("sk-secret");
    expect(sanitized).toContain("sk-***");
  });

  it("caps max agent steps to prevent infinite execution loops", () => {
    process.env.OPENROUTER_MAX_STEPS = "20"; // over limit
    expect(getMaxAgentSteps()).toBe(5); // default fallback

    process.env.OPENROUTER_MAX_STEPS = "4";
    expect(getMaxAgentSteps()).toBe(4);
  });
});

describe("OpenRouter Provider & Fallback Logic", () => {
  beforeEach(() => {
    process.env.OPENROUTER_API_KEY = "sk-or-v1-mock-key-for-test";
  });

  it("identifies retryable HTTP and model errors", () => {
    expect(isRetryableModelError({ status: 429 })).toBe(true);
    expect(isRetryableModelError({ status: 502 })).toBe(true);
    expect(isRetryableModelError({ status: 503 })).toBe(true);
    expect(isRetryableModelError(new Error("temporarily rate-limited upstream"))).toBe(true);
    expect(isRetryableModelError(new Error("provider returned error"))).toBe(true);
    expect(isRetryableModelError(new Error("Request timed out"))).toBe(true);
    expect(isRetryableModelError({ status: 400 })).toBe(false);
  });

  it("retries same model when transient 429 occurs", async () => {
    const mockClient = getOpenRouterClient();
    resetOpenRouterClient(mockClient);

    const createSpy = vi.spyOn(mockClient.chat.completions, "create");

    // 1st attempt fails with 429, 2nd attempt succeeds
    createSpy
      .mockRejectedValueOnce({
        status: 429,
        message: "google/gemma-4-26b-a4b-it:free is temporarily rate-limited",
      })
      .mockResolvedValueOnce({
        id: "call-ok",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: "Xin chào từ Gemma sau retry!",
            },
            finish_reason: "stop",
          },
        ],
      } as unknown as ChatCompletion);

    const result = await executeChatCompletionWithFallback({
      messages: [{ role: "user", content: "Xin chào" }],
      modelsOverride: ["google/gemma-4-26b-a4b-it:free"],
      maxRetriesPerModel: 1,
    });

    expect(createSpy).toHaveBeenCalledTimes(2);
    expect(result.model).toBe("google/gemma-4-26b-a4b-it:free");
    expect(result.completion.choices[0].message.content).toBe("Xin chào từ Gemma sau retry!");
    expect(result.isFallback).toBe(false);

    createSpy.mockRestore();
    resetOpenRouterClient(null);
  });

  it("switches to fallback model when primary model is exhausted", async () => {
    const mockClient = getOpenRouterClient();
    resetOpenRouterClient(mockClient);

    const createSpy = vi.spyOn(mockClient.chat.completions, "create");

    // Primary model fails, Fallback model succeeds
    createSpy
      .mockRejectedValueOnce({
        status: 429,
        message: "google/gemma-4-26b-a4b-it:free rate limited",
      })
      .mockResolvedValueOnce({
        id: "call-ok",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: "Xin chào từ model fallback Nemotron!",
            },
            finish_reason: "stop",
          },
        ],
      } as unknown as ChatCompletion);

    const result = await executeChatCompletionWithFallback({
      messages: [{ role: "user", content: "Xin chào" }],
      modelsOverride: [
        "google/gemma-4-26b-a4b-it:free",
        "nvidia/nemotron-3.5-lightning:free",
      ],
      maxRetriesPerModel: 0,
    });

    expect(createSpy).toHaveBeenCalledTimes(2);
    expect(result.model).toBe("nvidia/nemotron-3.5-lightning:free");
    expect(result.completion.choices[0].message.content).toBe(
      "Xin chào từ model fallback Nemotron!"
    );
    expect(result.isFallback).toBe(true);

    createSpy.mockRestore();
    resetOpenRouterClient(null);
  });

  it("handles multi-tool calls in a single turn", async () => {
    const mockClient = getOpenRouterClient();
    resetOpenRouterClient(mockClient);

    const createSpy = vi.spyOn(mockClient.chat.completions, "create");

    createSpy.mockResolvedValueOnce({
      id: "call-tools",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: null,
            tool_calls: [
              {
                id: "call_1",
                type: "function",
                function: {
                  name: "get_learning_progress",
                  arguments: "{}",
                },
              },
              {
                id: "call_2",
                type: "function",
                function: {
                  name: "list_vocab_sets",
                  arguments: '{"limit": 5}',
                },
              },
            ],
          },
          finish_reason: "tool_calls",
        },
      ],
    } as unknown as ChatCompletion);

    const result = await executeChatCompletionWithFallback({
      messages: [
        {
          role: "user",
          content: "Cho tôi biết tiến độ học và các bộ từ",
        },
      ],
      maxRetriesPerModel: 0,
    });

    const toolCalls = result.completion.choices[0].message.tool_calls;
    expect(toolCalls).toHaveLength(2);
    const tc1 = toolCalls?.[0] as { function: { name: string } };
    const tc2 = toolCalls?.[1] as { function: { name: string } };
    expect(tc1.function.name).toBe("get_learning_progress");
    expect(tc2.function.name).toBe("list_vocab_sets");

    createSpy.mockRestore();
    resetOpenRouterClient(null);
  });
});
