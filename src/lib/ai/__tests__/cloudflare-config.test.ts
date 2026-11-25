import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  isUsingCloudflare,
  isAiConfigured,
  getAiProvider,
  getAiApiKey,
  getAiAccountId,
  getAiBaseUrl,
  getAiHeaders,
  getAiModel,
  getAiFallbackModels,
  DEFAULT_CLOUDFLARE_MODELS,
  DEFAULT_CLOUDFLARE_CHAT_MODEL,
  DEFAULT_CLOUDFLARE_FALLBACK_MODEL,
} from "../constants";

describe("Cloudflare Workers AI Configuration", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.CLOUDFLARE_API_TOKEN;
    delete process.env.CLOUDFLARE_API_KEY;
    delete process.env.CLOUDFLARE_ACCOUNT_ID;
    delete process.env.CLOUDFLARE_AI_BASE_URL;
    delete process.env.CLOUDFLARE_CHAT_MODEL;
    delete process.env.CLOUDFLARE_VOCAB_MODEL;
    delete process.env.CLOUDFLARE_FALLBACK_MODEL;
    delete process.env.CLOUDFLARE_MODEL;
    delete process.env.CLOUDFLARE_MODELS;
    delete process.env.AI_MODEL;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("detects Cloudflare Workers AI as active provider when configured", () => {
    process.env.CLOUDFLARE_API_TOKEN = "cfut_test_token_123456";
    process.env.CLOUDFLARE_ACCOUNT_ID = "acc1234567890abcdef";

    expect(isUsingCloudflare()).toBe(true);
    expect(isAiConfigured()).toBe(true);
    expect(getAiProvider()).toBe("cloudflare");
    expect(getAiApiKey()).toBe("cfut_test_token_123456");
    expect(getAiAccountId()).toBe("acc1234567890abcdef");
    expect(getAiBaseUrl()).toBe(
      "https://api.cloudflare.com/client/v4/accounts/acc1234567890abcdef/ai/v1"
    );
    expect(getAiModel()).toBe(DEFAULT_CLOUDFLARE_CHAT_MODEL);
    expect(getAiFallbackModels()).toEqual(DEFAULT_CLOUDFLARE_MODELS);
  });

  it("requires both CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID", () => {
    process.env.CLOUDFLARE_API_TOKEN = "cfut_only_token";
    expect(isAiConfigured()).toBe(false);

    delete process.env.CLOUDFLARE_API_TOKEN;
    process.env.CLOUDFLARE_ACCOUNT_ID = "acc123";
    expect(isAiConfigured()).toBe(false);
  });

  it("respects custom CLOUDFLARE_MODEL", () => {
    process.env.CLOUDFLARE_API_TOKEN = "cfut_abc";
    process.env.CLOUDFLARE_ACCOUNT_ID = "acc123";
    process.env.CLOUDFLARE_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

    expect(getAiModel()).toBe("@cf/meta/llama-3.3-70b-instruct-fp8-fast");
  });

  it("respects custom @cf/ AI_MODEL and ignores legacy non-Cloudflare model names", () => {
    process.env.CLOUDFLARE_API_TOKEN = "cfut_abc";
    process.env.CLOUDFLARE_ACCOUNT_ID = "acc123";
    process.env.AI_MODEL = "gpt-5.6-luna";

    expect(getAiModel()).toBe(DEFAULT_CLOUDFLARE_CHAT_MODEL);

    process.env.AI_MODEL = "@cf/openai/gpt-oss-20b";
    expect(getAiModel()).toBe("@cf/openai/gpt-oss-20b");
  });

  it("prioritizes Gemma 4 26B A4B as primary and GPT-OSS-20B as fallback", () => {
    expect(DEFAULT_CLOUDFLARE_CHAT_MODEL).toBe("@cf/google/gemma-4-26b-a4b-it");
    expect(DEFAULT_CLOUDFLARE_FALLBACK_MODEL).toBe("@cf/openai/gpt-oss-20b");
    expect(getAiFallbackModels()).toEqual([
      "@cf/google/gemma-4-26b-a4b-it",
      "@cf/openai/gpt-oss-20b",
    ]);
  });

  it("returns empty custom headers for Cloudflare Workers AI", () => {
    expect(getAiHeaders()).toEqual({});
  });
});
