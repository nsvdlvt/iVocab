// src/lib/ai/constants.ts
import {
  DEFAULT_OPENROUTER_MODELS,
  DEFAULT_OPENROUTER_CHAT_MODEL,
  DEFAULT_OPENROUTER_VOCAB_MODEL,
  DEFAULT_OPENROUTER_FALLBACK_MODEL,
  getOpenRouterApiKey,
  getOpenRouterBaseUrl,
  getOpenRouterModelsForFeature,
  getOpenRouterModels,
  type AIFeature,
} from "./openrouter/config";

export {
  DEFAULT_OPENROUTER_MODELS,
  DEFAULT_OPENROUTER_CHAT_MODEL,
  DEFAULT_OPENROUTER_VOCAB_MODEL,
  DEFAULT_OPENROUTER_FALLBACK_MODEL,
};

export const DEFAULT_MODELAPI_MODELS = [
  "gpt-5.6-luna",
  "gpt-6-luna",
  "gpt-5.6-terra",
  "gpt-6-sol",
  "gpt-5.6-sol",
  "gpt-6.1-sol",
  "gpt-6-astra",
];

export const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
export const DEFAULT_BASE_URL = "https://openrouter.ai/api/v1";
export const OPENAI_DEFAULT_BASE_URL = "https://api.openai.com/v1";

export type AIProvider = "openrouter" | "modelapi" | "openai" | "custom";

export function isUsingOpenRouter(): boolean {
  if (getOpenRouterApiKey()) return true;
  if (process.env.AI_PROVIDER === "openrouter") return true;

  const baseUrl =
    process.env.OPENROUTER_BASE_URL ||
    process.env.OPENAI_BASE_URL ||
    process.env.AI_BASE_URL;
  if (baseUrl && baseUrl.includes("openrouter.ai")) return true;

  const key =
    process.env.OPENAI_API_KEY ||
    process.env.AI_API_KEY ||
    "";
  if (key.startsWith("sk-or-")) return true;

  return false;
}

export function getAiProvider(): AIProvider {
  if (isUsingOpenRouter()) return "openrouter";

  const baseUrl = process.env.OPENAI_BASE_URL || process.env.AI_BASE_URL;
  if (baseUrl && baseUrl.includes("modelapi.vn")) return "modelapi";
  if (process.env.MODELAPI_API_KEY) return "modelapi";

  if (baseUrl && baseUrl.includes("api.openai.com")) return "openai";
  if (process.env.AI_PROVIDER === "openai") return "openai";

  return "custom";
}

export function getAiApiKey(): string {
  const openRouterKey = getOpenRouterApiKey();
  if (openRouterKey) return openRouterKey;

  const key =
    process.env.MODELAPI_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.AI_API_KEY;

  return key?.trim() || "";
}

export function getAiBaseUrl(): string {
  if (isUsingOpenRouter()) {
    return getOpenRouterBaseUrl();
  }

  const url =
    process.env.OPENAI_BASE_URL ||
    process.env.AI_BASE_URL ||
    DEFAULT_BASE_URL;

  return url.replace(/\/+$/, "");
}

export function getAiHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.vocabee.site";
  headers["HTTP-Referer"] = siteUrl;
  headers["X-Title"] = "Vocabee AI Assistant";
  return headers;
}

export function getAiModel(feature?: AIFeature): string {
  if (isUsingOpenRouter()) {
    return getOpenRouterModelsForFeature(feature)[0];
  }

  if (process.env.OPENROUTER_MODEL) {
    return process.env.OPENROUTER_MODEL.trim();
  }
  if (process.env.AI_MODEL) {
    return process.env.AI_MODEL.trim();
  }

  return (
    process.env.OPENAI_MODEL?.trim() ||
    process.env.GEMINI_MODEL?.trim() ||
    DEFAULT_OPENROUTER_CHAT_MODEL
  );
}

export function getAiFallbackModels(feature?: AIFeature): string[] {
  if (isUsingOpenRouter()) {
    return getOpenRouterModelsForFeature(feature);
  }
  return DEFAULT_MODELAPI_MODELS;
}

export const DEFAULT_AI_MODELS = isUsingOpenRouter()
  ? getOpenRouterModels()
  : DEFAULT_MODELAPI_MODELS;

// Alias for backwards compatibility
export const DEFAULT_GEMINI_MODELS = DEFAULT_AI_MODELS;

export const AI_BASE_URL = getAiBaseUrl();

export const AI_MODEL = getAiModel();
