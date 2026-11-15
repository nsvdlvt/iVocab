// src/lib/ai/openrouter/__tests__/openrouter.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { ChatCompletion } from "openai/resources/chat/completions";
import {
  getOpenRouterApiKey,
  getOpenRouterBaseUrl,
  getOpenRouterModels,
  getMaxAgentSteps,
  sanitizeErrorMessage,
  isOpenRouterConfigured,
  DEFAULT_OPENROUTER_MODELS,
} from "../config";
import {
  isRetryableModelError,
  executeChatCompletionWithFallback,
  getOpenRouterClient,
  resetOpenRouterClient,
} from "../provider";


describe("OpenRouter Configuration", () => {
  const originalEnv = process.env;

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

  it("reads OPENROUTER_BASE_URL and trims trailing slashes", () => {
    process.env.OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1///";
    expect(getOpenRouterBaseUrl()).toBe("https://openrouter.ai/api/v1");
  });

  it("parses OPENROUTER_MODELS comma-separated list in strict priority order", () => {
    process.env.OPENROUTER_MODELS =
      "google/gemma-4-26b-a4b-it:free, nvidia/nemotron-3.5-lightning:free , openrouter/free";
    const models = getOpenRouterModels();
    expect(models).toEqual([
      "google/gemma-4-26b-a4b-it:free",
      "nvidia/nemotron-3.5-lightning:free",
      "openrouter/free",
    ]);
  });

  it("falls back to DEFAULT_OPENROUTER_MODELS when OPENROUTER_MODELS is unset", () => {
    delete process.env.OPENROUTER_MODELS;
    const models = getOpenRouterModels();
    expect(models).toEqual([...DEFAULT_OPENROUTER_MODELS]);
  });

  it("sanitizes API keys and Bearer tokens from error strings", () => {
    const rawError = "Error communicating with upstream sk-or-v1-abcdef0123456789abcdef0123456789 failed with Bearer sk-secret";
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
  it("identifies retryable HTTP and model errors", () => {
    expect(isRetryableModelError({ status: 429 })).toBe(true);
    expect(isRetryableModelError({ status: 502 })).toBe(true);
    expect(isRetryableModelError({ status: 503 })).toBe(true);
    expect(isRetryableModelError(new Error("temporarily rate-limited upstream"))).toBe(true);
    expect(isRetryableModelError(new Error("provider returned error"))).toBe(true);
    expect(isRetryableModelError(new Error("Request timed out"))).toBe(true);
    expect(isRetryableModelError({ status: 400 })).toBe(false);
  });

  it("retries with fallback model when primary model fails with 429", async () => {
    const mockClient = getOpenRouterClient();
    resetOpenRouterClient(mockClient);

    const createSpy = vi.spyOn(mockClient.chat.completions, "create");

    // 1st call fails with 429 Rate Limit
    // 2nd call succeeds with fallback model
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
              content: "Xin chào từ model fallback!",
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
    });

    expect(createSpy).toHaveBeenCalledTimes(2);
    expect(result.model).toBe("nvidia/nemotron-3.5-lightning:free");
    expect(result.completion.choices[0].message.content).toBe("Xin chào từ model fallback!");

    createSpy.mockRestore();
    resetOpenRouterClient(null);
  });
});
