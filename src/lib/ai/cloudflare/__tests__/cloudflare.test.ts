// src/lib/ai/cloudflare/__tests__/cloudflare.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { ChatCompletion } from "openai/resources/chat/completions";
import {
  getCloudflareApiToken,
  getCloudflareAccountId,
  getCloudflareBaseUrl,
  getCloudflareHealthCheckUrl,
  getCloudflareChatModel,
  getCloudflareVocabModel,
  getCloudflareFallbackModel,
  getCloudflareModelsForFeature,
  sanitizeErrorMessage,
  isCloudflareConfigured,
  assertCloudflareConfigured,
  DEFAULT_CLOUDFLARE_CHAT_MODEL,
  DEFAULT_CLOUDFLARE_VOCAB_MODEL,
  DEFAULT_CLOUDFLARE_FALLBACK_MODEL,
} from "../config";
import {
  isRetryableModelError,
  executeChatCompletionWithFallback,
  getCloudflareClient,
  resetCloudflareClient,
  sanitizeChatMessages,
} from "../provider";

describe("Cloudflare Workers AI Configuration", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("reads CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID without exposing them", () => {
    process.env.CLOUDFLARE_API_TOKEN = "cfut_testtoken1234567890";
    process.env.CLOUDFLARE_ACCOUNT_ID = "acc-test-1234567890abcdef";
    expect(getCloudflareApiToken()).toBe("cfut_testtoken1234567890");
    expect(getCloudflareAccountId()).toBe("acc-test-1234567890abcdef");
    expect(isCloudflareConfigured()).toBe(true);
  });

  it("throws clear configuration error if CLOUDFLARE_API_TOKEN or CLOUDFLARE_ACCOUNT_ID is missing", () => {
    delete process.env.CLOUDFLARE_API_TOKEN;
    delete process.env.CLOUDFLARE_API_KEY;
    delete process.env.CLOUDFLARE_ACCOUNT_ID;
    expect(() => assertCloudflareConfigured()).toThrow(
      "Chưa cấu hình CLOUDFLARE_API_TOKEN và CLOUDFLARE_ACCOUNT_ID"
    );

    process.env.CLOUDFLARE_ACCOUNT_ID = "acc123";
    expect(() => assertCloudflareConfigured()).toThrow(
      "Chưa cấu hình biến môi trường CLOUDFLARE_API_TOKEN"
    );

    process.env.CLOUDFLARE_API_TOKEN = "cfut_abc";
    delete process.env.CLOUDFLARE_ACCOUNT_ID;
    expect(() => assertCloudflareConfigured()).toThrow(
      "Chưa cấu hình biến môi trường CLOUDFLARE_ACCOUNT_ID"
    );
  });

  it("builds OpenAI-compatible baseURL and health check URL from account ID", () => {
    process.env.CLOUDFLARE_ACCOUNT_ID = "acc999";
    delete process.env.CLOUDFLARE_AI_BASE_URL;
    expect(getCloudflareBaseUrl()).toBe(
      "https://api.cloudflare.com/client/v4/accounts/acc999/ai/v1"
    );
    expect(getCloudflareHealthCheckUrl()).toBe(
      "https://api.cloudflare.com/client/v4/accounts/acc999/ai/models/search?per_page=1"
    );

    process.env.CLOUDFLARE_AI_BASE_URL = "https://gateway.ai.cloudflare.com/v1/acc999/gw/workers-ai/v1///";
    expect(getCloudflareBaseUrl()).toBe(
      "https://gateway.ai.cloudflare.com/v1/acc999/gw/workers-ai/v1"
    );
  });

  it("returns default Gemma 4 26B A4B primary and GPT-OSS-20B fallback models", () => {
    delete process.env.CLOUDFLARE_CHAT_MODEL;
    delete process.env.CLOUDFLARE_VOCAB_MODEL;
    delete process.env.CLOUDFLARE_FALLBACK_MODEL;
    delete process.env.CLOUDFLARE_MODEL;
    delete process.env.AI_MODEL;

    expect(getCloudflareChatModel()).toBe(DEFAULT_CLOUDFLARE_CHAT_MODEL);
    expect(getCloudflareVocabModel()).toBe(DEFAULT_CLOUDFLARE_VOCAB_MODEL);
    expect(getCloudflareFallbackModel()).toBe(DEFAULT_CLOUDFLARE_FALLBACK_MODEL);
  });

  it("orders models [Gemma 4 primary, GPT-OSS-20B fallback] for features", () => {
    const chatModels = getCloudflareModelsForFeature("chat");
    expect(chatModels[0]).toBe("@cf/google/gemma-4-26b-a4b-it");
    expect(chatModels[1]).toBe("@cf/openai/gpt-oss-20b");

    const vocabModels = getCloudflareModelsForFeature("vocab");
    expect(vocabModels[0]).toBe("@cf/google/gemma-4-26b-a4b-it");
    expect(vocabModels[1]).toBe("@cf/openai/gpt-oss-20b");
  });

  it("sanitizes Cloudflare tokens, sk- keys, and Bearer tokens from error strings", () => {
    const rawError =
      "Error communicating with Cloudflare cfut_fakeTokenValue1234567890abcdef failed with Bearer cfat_secret123";
    const sanitized = sanitizeErrorMessage(rawError);
    expect(sanitized).not.toContain("cfut_fakeTokenValue1234567890abcdef");
    expect(sanitized).not.toContain("cfat_secret123");
    expect(sanitized).toContain("cfut_***");
    expect(sanitized).toContain("Bearer ***");
  });
});

describe("Cloudflare AI Provider & Fallback Logic", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.CLOUDFLARE_API_TOKEN = "cfut_mock_token_for_test";
    process.env.CLOUDFLARE_ACCOUNT_ID = "acc-mock-test-123456";
  });

  afterEach(() => {
    resetCloudflareClient(null);
    process.env = originalEnv;
  });

  it("sanitizes assistant null content and extra reasoning fields for Cloudflare schema", () => {
    const dirtyMessages = [
      { role: "user", content: "Tôi có bao nhiêu từ?" },
      {
        role: "assistant",
        content: null,
        reasoning_content: "Thinking...",
        refusal: null,
        annotations: null,
        tool_calls: [
          {
            id: "call_1",
            type: "function",
            function: { name: "get_vocabulary_overview", arguments: "{}" },
          },
        ],
      },
      { role: "tool", tool_call_id: "call_1", content: '{"totalWords":45}' },
    ] as unknown as Parameters<typeof sanitizeChatMessages>[0];

    const cleaned = sanitizeChatMessages(dirtyMessages);
    expect(cleaned[1]).toEqual({
      role: "assistant",
      content: "",
      tool_calls: [
        {
          id: "call_1",
          type: "function",
          function: { name: "get_vocabulary_overview", arguments: "{}" },
        },
      ],
    });
    expect("reasoning_content" in cleaned[1]).toBe(false);
    expect("refusal" in cleaned[1]).toBe(false);
  });

  it("identifies retryable HTTP and model errors", () => {
    expect(isRetryableModelError({ status: 429 })).toBe(true);
    expect(isRetryableModelError({ status: 502 })).toBe(true);
    expect(isRetryableModelError({ status: 503 })).toBe(true);
    expect(isRetryableModelError(new Error("temporarily rate-limited upstream"))).toBe(true);
    expect(isRetryableModelError(new Error("Neurons daily quota exceeded"))).toBe(true);
    expect(isRetryableModelError(new Error("Request timed out"))).toBe(true);
    expect(isRetryableModelError({ status: 400 })).toBe(false);
  });

  it("retries same model when transient 429 occurs", async () => {
    const mockClient = getCloudflareClient();
    resetCloudflareClient(mockClient);

    const createSpy = vi.spyOn(mockClient.chat.completions, "create");

    createSpy
      .mockRejectedValueOnce({
        status: 429,
        message: "@cf/google/gemma-4-26b-a4b-it is temporarily rate-limited",
      })
      .mockResolvedValueOnce({
        id: "call-ok",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: "Xin chào từ Gemma 4 trên Cloudflare sau retry!",
            },
            finish_reason: "stop",
          },
        ],
      } as unknown as ChatCompletion);

    const result = await executeChatCompletionWithFallback({
      messages: [{ role: "user", content: "Xin chào" }],
      modelsOverride: ["@cf/google/gemma-4-26b-a4b-it"],
      maxRetriesPerModel: 1,
    });

    expect(createSpy).toHaveBeenCalledTimes(2);
    expect(result.model).toBe("@cf/google/gemma-4-26b-a4b-it");
    expect(result.completion.choices[0].message.content).toBe(
      "Xin chào từ Gemma 4 trên Cloudflare sau retry!"
    );
    expect(result.isFallback).toBe(false);

    createSpy.mockRestore();
  });

  it("switches to GPT-OSS-20B fallback when Gemma 4 is exhausted", async () => {
    const mockClient = getCloudflareClient();
    resetCloudflareClient(mockClient);

    const createSpy = vi.spyOn(mockClient.chat.completions, "create");

    createSpy
      .mockRejectedValueOnce({
        status: 429,
        message: "@cf/google/gemma-4-26b-a4b-it rate limited",
      })
      .mockResolvedValueOnce({
        id: "call-ok",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: "Xin chào từ model dự phòng GPT-OSS-20B!",
            },
            finish_reason: "stop",
          },
        ],
      } as unknown as ChatCompletion);

    const result = await executeChatCompletionWithFallback({
      messages: [{ role: "user", content: "Xin chào" }],
      modelsOverride: [
        "@cf/google/gemma-4-26b-a4b-it",
        "@cf/openai/gpt-oss-20b",
      ],
      maxRetriesPerModel: 0,
    });

    expect(createSpy).toHaveBeenCalledTimes(2);
    expect(result.model).toBe("@cf/openai/gpt-oss-20b");
    expect(result.completion.choices[0].message.content).toBe(
      "Xin chào từ model dự phòng GPT-OSS-20B!"
    );
    expect(result.isFallback).toBe(true);

    createSpy.mockRestore();
  });

  it("handles multi-tool calls in a single turn", async () => {
    const mockClient = getCloudflareClient();
    resetCloudflareClient(mockClient);

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
      tools: [
        {
          type: "function",
          function: {
            name: "get_learning_progress",
            description: "Progress",
            parameters: { type: "object", properties: {} },
          },
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
  });
});
