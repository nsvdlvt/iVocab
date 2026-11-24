// src/lib/ai/openrouter/config.ts

/**
 * OpenRouter AI Provider Configuration
 * Centralized, secure configuration for Vocabee's OpenRouter integration.
 * NEVER expose OPENROUTER_API_KEY to client bundles or browser responses.
 */

export const DEFAULT_OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

// Primary and Fallback Models specified in project requirements
export const DEFAULT_OPENROUTER_CHAT_MODEL = "google/gemma-4-26b-a4b-it:free";
export const DEFAULT_OPENROUTER_VOCAB_MODEL = "google/gemma-4-26b-a4b-it:free";
export const DEFAULT_OPENROUTER_FALLBACK_MODEL = "nvidia/nemotron-3.5-lightning:free";

export const DEFAULT_OPENROUTER_MODELS: readonly string[] = [
  DEFAULT_OPENROUTER_CHAT_MODEL,
  DEFAULT_OPENROUTER_FALLBACK_MODEL,
];

export const DEFAULT_OPENROUTER_TIMEOUT_MS = 45000;
export const DEFAULT_MAX_AGENT_STEPS = 5;
export const DEFAULT_MAX_FALLBACK_RETRIES = 2;

export type AIFeature =
  | "chat"
  | "agent"
  | "vocab"
  | "grammar"
  | "quiz"
  | "sentence"
  | "import"
  | "writing"
  | "general";

/**
 * Returns the OpenRouter API key from server environment.
 * Never log or expose this value.
 */
export function getOpenRouterApiKey(): string {
  const key = process.env.OPENROUTER_API_KEY;
  return key?.trim() || "";
}

/**
 * Asserts that OpenRouter has been configured with an API key.
 * Throws a clear, descriptive configuration error if missing.
 */
export function assertOpenRouterConfigured(): string {
  const key = getOpenRouterApiKey();
  if (!key) {
    throw new Error(
      "Chưa cấu hình biến môi trường OPENROUTER_API_KEY. Vui lòng thêm OPENROUTER_API_KEY vào .env.local trên server."
    );
  }
  return key;
}

/**
 * Returns the OpenRouter base URL.
 */
export function getOpenRouterBaseUrl(): string {
  const url = process.env.OPENROUTER_BASE_URL || DEFAULT_OPENROUTER_BASE_URL;
  return url.replace(/\/+$/, "");
}

/**
 * Returns the primary Chat model.
 */
export function getOpenRouterChatModel(): string {
  if (process.env.OPENROUTER_CHAT_MODEL) {
    return process.env.OPENROUTER_CHAT_MODEL.trim();
  }
  if (process.env.OPENROUTER_MODEL) {
    return process.env.OPENROUTER_MODEL.trim();
  }
  const aiModel = process.env.AI_MODEL?.trim();
  if (aiModel && !aiModel.startsWith("gpt-5.") && !aiModel.startsWith("gpt-6")) {
    return aiModel;
  }
  return DEFAULT_OPENROUTER_CHAT_MODEL;
}

/**
 * Returns the primary Vocabulary & Grammar model.
 */
export function getOpenRouterVocabModel(): string {
  return (
    process.env.OPENROUTER_VOCAB_MODEL?.trim() ||
    DEFAULT_OPENROUTER_VOCAB_MODEL
  );
}

/**
 * Returns the Fallback model for technical failure recovery.
 */
export function getOpenRouterFallbackModel(): string {
  return (
    process.env.OPENROUTER_FALLBACK_MODEL?.trim() ||
    DEFAULT_OPENROUTER_FALLBACK_MODEL
  );
}

/**
 * Returns the prioritized list of OpenRouter models for a specific feature.
 * Primary model is selected based on feature, followed by fallback model.
 */
export function getOpenRouterModelsForFeature(feature?: AIFeature): string[] {
  let primary: string;

  switch (feature) {
    case "vocab":
    case "grammar":
    case "quiz":
    case "sentence":
    case "import":
    case "writing":
      primary = getOpenRouterVocabModel();
      break;
    case "chat":
    case "agent":
    case "general":
    default:
      primary = getOpenRouterChatModel();
      break;
  }

  const fallback = getOpenRouterFallbackModel();
  const models = [primary];

  if (fallback && fallback !== primary) {
    models.push(fallback);
  }

  // Also include any extra models from OPENROUTER_MODELS if explicitly provided
  const rawExtra = process.env.OPENROUTER_MODELS;
  if (rawExtra && rawExtra.trim().length > 0) {
    const parsed = rawExtra
      .split(",")
      .map((m) => m.trim())
      .filter((m) => Boolean(m) && !m.startsWith("#"));

    for (const m of parsed) {
      if (!models.includes(m)) {
        models.push(m);
      }
    }
  }

  return models;
}

/**
 * Returns general prioritized list of OpenRouter models (backwards compatibility).
 */
export function getOpenRouterModels(): string[] {
  return getOpenRouterModelsForFeature("general");
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

  if (message.includes("free-models-per-day")) {
    return "Tài khoản OpenRouter đã dùng hết hạn mức 50 yêu cầu miễn phí trong ngày (free-models-per-day). Vui lòng thêm $5-10 credit vào OpenRouter để nâng hạn mức lên 1.000 lượt/ngày hoặc chờ reset lúc 00:00 UTC.";
  }

  return message;
}
