// src/lib/ai/constants.ts
export const DEFAULT_AI_MODELS = [
  "gpt-5.6-luna",
  "gpt-6-luna",
  "gpt-5.6-terra",
  "gpt-6-sol",
  "gpt-5.6-sol",
  "gpt-6.1-sol",
  "gpt-6-astra",
];

// Alias for backwards compatibility
export const DEFAULT_GEMINI_MODELS = DEFAULT_AI_MODELS;

export const DEFAULT_BASE_URL = "https://api.modelapi.vn/v1";

export function getAiApiKey(): string {
  const key =
    process.env.MODELAPI_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.AI_API_KEY;

  return key?.trim() || "";
}

export function getAiBaseUrl(): string {
  const url =
    process.env.OPENAI_BASE_URL ||
    process.env.AI_BASE_URL ||
    DEFAULT_BASE_URL;
  return url.replace(/\/+$/, "");
}

export const AI_BASE_URL = getAiBaseUrl();

export const AI_MODEL =
  process.env.AI_MODEL ||
  process.env.OPENAI_MODEL ||
  process.env.GEMINI_MODEL ||
  "gpt-5.6-luna";
