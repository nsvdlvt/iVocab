// src/lib/ai/cloudflare/config.ts

/**
 * Cloudflare Workers AI Provider Configuration
 * Centralized, secure configuration for Vocabee's Cloudflare Workers AI integration.
 * NEVER expose CLOUDFLARE_API_TOKEN to client bundles or browser responses.
 */

export const DEFAULT_CLOUDFLARE_BASE_ORIGIN = "https://api.cloudflare.com/client/v4";

// Primary and Fallback Models configured for Cloudflare Workers AI
export const DEFAULT_CLOUDFLARE_CHAT_MODEL = "@cf/google/gemma-4-26b-a4b-it";
export const DEFAULT_CLOUDFLARE_VOCAB_MODEL = "@cf/google/gemma-4-26b-a4b-it";
export const DEFAULT_CLOUDFLARE_FALLBACK_MODEL = "@cf/openai/gpt-oss-20b";

export const DEFAULT_CLOUDFLARE_MODELS: readonly string[] = [
  DEFAULT_CLOUDFLARE_CHAT_MODEL,
  DEFAULT_CLOUDFLARE_FALLBACK_MODEL,
];

export const DEFAULT_CLOUDFLARE_TIMEOUT_MS = 45000;

export type AIFeature =
  | "chat"
  | "vocab"
  | "grammar"
  | "quiz"
  | "sentence"
  | "import"
  | "writing"
  | "general";

/**
 * Returns the Cloudflare API token from server environment.
 * Never log or expose this value.
 */
export function getCloudflareApiToken(): string {
  const token = process.env.CLOUDFLARE_API_TOKEN || process.env.CLOUDFLARE_API_KEY;
  return token?.trim() || "";
}

/**
 * Returns the Cloudflare Account ID from server environment.
 */
export function getCloudflareAccountId(): string {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  return accountId?.trim() || "";
}

/**
 * Checks whether Cloudflare Workers AI has both API token and Account ID configured.
 */
export function isCloudflareConfigured(): boolean {
  return getCloudflareApiToken().length > 0 && getCloudflareAccountId().length > 0;
}

/**
 * Asserts that Cloudflare Workers AI has been configured with both token and account ID.
 * Throws a clear, descriptive configuration error if missing.
 */
export function assertCloudflareConfigured(): { apiToken: string; accountId: string } {
  const apiToken = getCloudflareApiToken();
  const accountId = getCloudflareAccountId();

  if (!apiToken && !accountId) {
    throw new Error(
      "Chưa cấu hình CLOUDFLARE_API_TOKEN và CLOUDFLARE_ACCOUNT_ID. Vui lòng thêm vào .env.local trên server."
    );
  }
  if (!apiToken) {
    throw new Error(
      "Chưa cấu hình biến môi trường CLOUDFLARE_API_TOKEN. Vui lòng thêm vào .env.local trên server."
    );
  }
  if (!accountId) {
    throw new Error(
      "Chưa cấu hình biến môi trường CLOUDFLARE_ACCOUNT_ID. Vui lòng thêm vào .env.local trên server."
    );
  }

  return { apiToken, accountId };
}

/**
 * Returns the OpenAI-compatible Cloudflare Workers AI base URL.
 */
export function getCloudflareBaseUrl(): string {
  const override = process.env.CLOUDFLARE_AI_BASE_URL?.trim();
  if (override) {
    return override.replace(/\/+$/, "");
  }

  const accountId = getCloudflareAccountId();
  if (!accountId) {
    return `${DEFAULT_CLOUDFLARE_BASE_ORIGIN}/accounts/unconfigured/ai/v1`;
  }

  return `${DEFAULT_CLOUDFLARE_BASE_ORIGIN}/accounts/${accountId}/ai/v1`;
}

/**
 * Returns the Cloudflare Workers AI catalog search endpoint for health checks.
 * (Cloudflare's /ai/v1/models does not support GET, whereas /ai/models/search does.)
 */
export function getCloudflareHealthCheckUrl(): string {
  const accountId = getCloudflareAccountId();
  if (!accountId) {
    return "";
  }
  return `${DEFAULT_CLOUDFLARE_BASE_ORIGIN}/accounts/${accountId}/ai/models/search?per_page=1`;
}

/**
 * Returns the primary Chat/Agent model.
 */
export function getCloudflareChatModel(): string {
  if (process.env.CLOUDFLARE_CHAT_MODEL?.trim()) {
    return process.env.CLOUDFLARE_CHAT_MODEL.trim();
  }
  if (process.env.CLOUDFLARE_MODEL?.trim()) {
    return process.env.CLOUDFLARE_MODEL.trim();
  }
  const aiModel = process.env.AI_MODEL?.trim();
  if (aiModel && (aiModel.startsWith("@cf/") || aiModel.startsWith("@hf/"))) {
    return aiModel;
  }
  return DEFAULT_CLOUDFLARE_CHAT_MODEL;
}

/**
 * Returns the primary Vocabulary & Grammar model.
 */
export function getCloudflareVocabModel(): string {
  if (process.env.CLOUDFLARE_VOCAB_MODEL?.trim()) {
    return process.env.CLOUDFLARE_VOCAB_MODEL.trim();
  }
  if (process.env.CLOUDFLARE_MODEL?.trim()) {
    return process.env.CLOUDFLARE_MODEL.trim();
  }
  return DEFAULT_CLOUDFLARE_VOCAB_MODEL;
}

/**
 * Returns the Fallback model for technical failure recovery.
 */
export function getCloudflareFallbackModel(): string {
  return (
    process.env.CLOUDFLARE_FALLBACK_MODEL?.trim() ||
    DEFAULT_CLOUDFLARE_FALLBACK_MODEL
  );
}

/**
 * Returns the prioritized list of Cloudflare Workers AI models for a specific feature.
 * Primary model is selected based on feature, followed by fallback model.
 */
export function getCloudflareModelsForFeature(feature?: AIFeature): string[] {
  let primary: string;

  switch (feature) {
    case "vocab":
    case "grammar":
    case "quiz":
    case "sentence":
    case "import":
    case "writing":
      primary = getCloudflareVocabModel();
      break;
    case "chat":
    case "general":
    default:
      primary = getCloudflareChatModel();
      break;
  }

  const fallback = getCloudflareFallbackModel();
  const models = [primary];

  if (fallback && fallback !== primary) {
    models.push(fallback);
  }

  const rawExtra = process.env.CLOUDFLARE_MODELS;
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
 * Returns general prioritized list of Cloudflare Workers AI models.
 */
export function getCloudflareModels(): string[] {
  return getCloudflareModelsForFeature("general");
}

/**
 * Returns request timeout in milliseconds.
 */
export function getCloudflareTimeout(): number {
  const envTimeout = process.env.CLOUDFLARE_TIMEOUT_MS;
  if (envTimeout) {
    const parsed = parseInt(envTimeout, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return DEFAULT_CLOUDFLARE_TIMEOUT_MS;
}

/**
 * Sanitizes an error message or object to ensure no API tokens or credentials leak.
 */
export function sanitizeErrorMessage(error: unknown): string {
  if (!error) return "Unknown error";
  let message = error instanceof Error ? error.message : String(error);

  // Mask Cloudflare tokens, generic sk- keys, and Bearer tokens
  message = message.replace(/cfut_[a-zA-Z0-9_\-]+/g, "cfut_***");
  message = message.replace(/cfat_[a-zA-Z0-9_\-]+/g, "cfat_***");
  message = message.replace(/sk-[a-zA-Z0-9_\-]{8,}/g, "sk-***");
  message = message.replace(/Bearer\s+[a-zA-Z0-9_\-\.]+/gi, "Bearer ***");

  const lower = message.toLowerCase();
  if (lower.includes("neuron") && (lower.includes("limit") || lower.includes("quota"))) {
    return "Tài khoản Cloudflare Workers AI đã đạt giới hạn Neurons miễn phí trong ngày hoặc hạn mức rate limit. Vui lòng thử lại sau.";
  }

  return message;
}
