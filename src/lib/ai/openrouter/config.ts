// src/lib/ai/openrouter/config.ts

/**
 * OpenRouter AI Provider Configuration
 * Centralized, secure configuration for OpenRouter integration.
 * NEVER expose OPENROUTER_API_KEY to client bundles or browser responses.
 */

export const DEFAULT_OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

export const DEFAULT_OPENROUTER_MODELS: readonly string[] = [
  "google/gemma-4-26b-a4b-it:free",
  "nvidia/nemotron-3.5-lightning:free",
  "openrouter/free",
];

export const DEFAULT_OPENROUTER_TIMEOUT_MS = 45000;
export const DEFAULT_MAX_AGENT_STEPS = 5;
export const DEFAULT_MAX_FALLBACK_RETRIES = 3;

/**
 * Returns the OpenRouter API key from server environment.
 * Never log or expose this value.
 */
export function getOpenRouterApiKey(): string {
  const key = process.env.OPENROUTER_API_KEY;
  return key?.trim() || "";
}

/**
 * Returns the OpenRouter base URL.
 */
export function getOpenRouterBaseUrl(): string {
  const url = process.env.OPENROUTER_BASE_URL || DEFAULT_OPENROUTER_BASE_URL;
  return url.replace(/\/+$/, "");
}

/**
 * Returns the prioritized list of OpenRouter models.
 * Parses OPENROUTER_MODELS from comma-separated string if provided.
 */
export function getOpenRouterModels(): string[] {
  const raw = process.env.OPENROUTER_MODELS;
  if (raw && raw.trim().length > 0) {
    const parsed = raw
      .split(",")
      .map((m) => m.trim())
      .filter((m) => Boolean(m) && !m.startsWith("#"));

    if (parsed.length > 0) {
      return parsed;
    }
  }

  return [...DEFAULT_OPENROUTER_MODELS];
}

/**
 * Returns request timeout in milliseconds.
 */
export function getOpenRouterTimeout(): number {
  const envTimeout = process.env.OPENROUTER_TIMEOUT_MS;
  if (envTimeout) {
    const parsed = parseInt(envTimeout, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return DEFAULT_OPENROUTER_TIMEOUT_MS;
}

/**
 * Returns the maximum number of multi-step agent tool execution steps.
 */
export function getMaxAgentSteps(): number {
  const envSteps = process.env.AI_MAX_STEPS || process.env.OPENROUTER_MAX_STEPS;
  if (envSteps) {
    const parsed = parseInt(envSteps, 10);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 10) {
      return parsed;
    }
  }
  return DEFAULT_MAX_AGENT_STEPS;
}

/**
 * Checks whether OpenRouter has been configured with an API key.
 */
export function isOpenRouterConfigured(): boolean {
  return getOpenRouterApiKey().length > 0;
}

/**
 * Sanitizes an error message or object to ensure no API keys or credentials leak.
 */
export function sanitizeErrorMessage(error: unknown): string {
  if (!error) return "Unknown error";
  let message = error instanceof Error ? error.message : String(error);

  // Mask any sk- or Bearer tokens
  message = message.replace(/sk-[a-zA-Z0-9_\-]{8,}/g, "sk-***");
  message = message.replace(/Bearer\s+[a-zA-Z0-9_\-\.]+/gi, "Bearer ***");

  return message;
}
