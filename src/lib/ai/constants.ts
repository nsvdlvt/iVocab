// src/lib/ai/constants.ts
import {
  DEFAULT_CLOUDFLARE_MODELS,
  DEFAULT_CLOUDFLARE_CHAT_MODEL,
  DEFAULT_CLOUDFLARE_VOCAB_MODEL,
  DEFAULT_CLOUDFLARE_FALLBACK_MODEL,
  getCloudflareApiToken,
  getCloudflareAccountId,
  getCloudflareBaseUrl,
  getCloudflareModelsForFeature,
  getCloudflareModels,
  isCloudflareConfigured,
  type AIFeature,
} from "./cloudflare/config";

export {
  DEFAULT_CLOUDFLARE_MODELS,
  DEFAULT_CLOUDFLARE_CHAT_MODEL,
  DEFAULT_CLOUDFLARE_VOCAB_MODEL,
  DEFAULT_CLOUDFLARE_FALLBACK_MODEL,
};

export const DEFAULT_BASE_URL = "https://api.cloudflare.com/client/v4";

export type AIProvider = "cloudflare";

export function isUsingCloudflare(): boolean {
  return true;
}

export function isAiConfigured(): boolean {
  return isCloudflareConfigured();
}

export function getAiProvider(): AIProvider {
  return "cloudflare";
}

export function getAiApiKey(): string {
  return getCloudflareApiToken();
}

export function getAiAccountId(): string {
  return getCloudflareAccountId();
}

export function getAiBaseUrl(): string {
  return getCloudflareBaseUrl();
}

export function getAiHeaders(): Record<string, string> {
  return {};
}

export function getAiModel(feature?: AIFeature): string {
  return getCloudflareModelsForFeature(feature)[0];
}

export function getAiFallbackModels(feature?: AIFeature): string[] {
  return getCloudflareModelsForFeature(feature);
}

export const DEFAULT_AI_MODELS = getCloudflareModels();

export const AI_BASE_URL = getAiBaseUrl();

export const AI_MODEL = getAiModel();
