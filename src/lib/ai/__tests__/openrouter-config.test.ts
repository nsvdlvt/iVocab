import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  isUsingOpenRouter,
  getAiProvider,
  getAiApiKey,
  getAiBaseUrl,
  getAiHeaders,
  getAiModel,
  getAiFallbackModels,
  OPENROUTER_BASE_URL,
  DEFAULT_OPENROUTER_MODELS,
  DEFAULT_MODELAPI_MODELS,
} from "../constants";

describe("OpenRouter & AI Configuration", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset process.env before each test
    process.env = { ...originalEnv };
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.OPENROUTER_CHAT_MODEL;
    delete process.env.OPENROUTER_VOCAB_MODEL;
    delete process.env.OPENROUTER_FALLBACK_MODEL;
    delete process.env.OPENROUTER_MODEL;
    delete process.env.OPENROUTER_MODELS;
    delete process.env.OPENROUTER_BASE_URL;
    delete process.env.AI_PROVIDER;
    delete process.env.AI_MODEL;
    delete process.env.MODELAPI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_BASE_URL;
    delete process.env.OPENAI_MODEL;
    delete process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_MODEL;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("detects OpenRouter when OPENROUTER_API_KEY is present", () => {
    process.env.OPENROUTER_API_KEY = "sk-or-v1-test-key-123456";

    expect(isUsingOpenRouter()).toBe(true);
    expect(getAiProvider()).toBe("openrouter");
    expect(getAiApiKey()).toBe("sk-or-v1-test-key-123456");
    expect(getAiBaseUrl()).toBe(OPENROUTER_BASE_URL);
    expect(getAiModel()).toBe("google/gemma-4-26b-a4b-it:free");
    expect(getAiFallbackModels()).toEqual(DEFAULT_OPENROUTER_MODELS);
  });

  it("detects OpenRouter when OPENAI_API_KEY starts with sk-or-", () => {
    process.env.OPENAI_API_KEY = "sk-or-v1-test-key-999";

    expect(isUsingOpenRouter()).toBe(true);
    expect(getAiProvider()).toBe("openrouter");
    expect(getAiApiKey()).toBe("sk-or-v1-test-key-999");
    expect(getAiBaseUrl()).toBe(OPENROUTER_BASE_URL);
  });

  it("respects custom OPENROUTER_MODEL", () => {
    process.env.OPENROUTER_API_KEY = "sk-or-v1-abc";
    process.env.OPENROUTER_MODEL = "deepseek/deepseek-chat";

    expect(getAiModel()).toBe("deepseek/deepseek-chat");
  });

  it("respects custom AI_MODEL with OpenRouter", () => {
    process.env.OPENROUTER_API_KEY = "sk-or-v1-abc";
    process.env.AI_MODEL = "openai/gpt-4o-mini";

    expect(getAiModel()).toBe("openai/gpt-4o-mini");
  });

  it("provides correct OpenRouter headers for ranking/analytics", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://ivocab.test";
    const headers = getAiHeaders();

    expect(headers["HTTP-Referer"]).toBe("https://ivocab.test");
    expect(headers["X-Title"]).toBe("Vocabee AI Assistant");
  });

  it("safely ignores legacy modelapi models (gpt-5.6-luna) if switching to OpenRouter", () => {
    process.env.OPENROUTER_API_KEY = "sk-or-v1-abc";
    process.env.OPENAI_MODEL = "gpt-5.6-luna"; // old setting in .env.local

    // Should default to OpenRouter model, not the invalid gpt-5.6-luna
    expect(getAiModel()).toBe("google/gemma-4-26b-a4b-it:free");
  });

  it("falls back to ModelAPI when MODELAPI_API_KEY is present without OpenRouter", () => {
    process.env.MODELAPI_API_KEY = "sk-modelapi-123";
    process.env.OPENAI_BASE_URL = "https://api.modelapi.vn/v1";

    expect(isUsingOpenRouter()).toBe(false);
    expect(getAiProvider()).toBe("modelapi");
    expect(getAiApiKey()).toBe("sk-modelapi-123");
    expect(getAiBaseUrl()).toBe("https://api.modelapi.vn/v1");
    expect(getAiFallbackModels()).toEqual(DEFAULT_MODELAPI_MODELS);
  });
});
