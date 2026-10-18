import { AI_MODEL, DEFAULT_AI_MODELS, getAiApiKey, getAiBaseUrl } from "@/lib/ai/constants";
import { AIResponseError, AIAbortError, AINetworkError } from "@/lib/ai/errors";
import crypto from "crypto";

export interface InputPart {
  type: "input_text" | "input_image" | "input_file" | string;
  text?: string;
  image_url?: string;
  image_base64?: string;
  file_id?: string;
  detail?: "low" | "high" | "auto";
}

export interface ResponsesRequestPayload {
  model?: string;
  input: string | InputPart[];
  text?: {
    format?: {
      type: "json_object" | "json_schema";
      name?: string;
      strict?: boolean;
      schema?: unknown;
    };
  };
  [key: string]: unknown;
}

interface OpenAIChatResponse {
  choices?: Array<{
    message?: {
      role?: string;
      content?: string;
    };
    finish_reason?: string;
  }>;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
  output_text?: string;
  content?: string;
  error?: {
    code?: number | string;
    message?: string;
    type?: string;
  };
}

export async function request<T = unknown>(
  payload: Omit<ResponsesRequestPayload, "model"> & { model?: string },
  abortSignal?: AbortSignal
): Promise<T> {
  const apiKey = getAiApiKey();
  const baseURL = getAiBaseUrl();

  let requestedModel = payload.model ?? AI_MODEL;
  if (requestedModel.startsWith("gemini-")) {
    requestedModel = AI_MODEL;
  }

  const modelsToTry = [
    requestedModel,
    ...DEFAULT_AI_MODELS.filter((m) => m !== requestedModel),
  ];

  // Convert input to OpenAI chat messages format
  const messages: Array<{ role: string; content: unknown }> = [];

  if (typeof payload.input === "string") {
    messages.push({ role: "user", content: payload.input });
  } else if (Array.isArray(payload.input)) {
    const userContentParts: Array<Record<string, unknown>> = [];
    for (const part of payload.input) {
      if ((part.type === "input_text" || part.type === "text") && part.text) {
        userContentParts.push({ type: "text", text: part.text });
      } else if (
        (part.type === "input_image" || part.type === "image_url") &&
        (part.image_url || part.image_base64)
      ) {
        userContentParts.push({
          type: "image_url",
          image_url: { url: part.image_url || part.image_base64! },
        });
      }
    }
    messages.push({
      role: "user",
      content: userContentParts.length > 0 ? userContentParts : String(payload.input),
    });
  }

  if (messages.length === 0) {
    throw new AIResponseError("Không có nội dung để gửi tới AI.");
  }

  const callerFile = getCallerFile();
  let lastError: unknown = null;

  for (const model of modelsToTry) {
    const endpoint = `${baseURL}/chat/completions`;
    const requestBody: Record<string, unknown> = {
      model,
      messages,
      temperature: 0.3,
    };

    const bodyJson = JSON.stringify(requestBody);
    const bodyHash = crypto.createHash("sha256").update(bodyJson).digest("hex");

    if (process.env.NODE_ENV === "development") {
      console.log("[responsesClient:modelapi] Outbound payload", {
        callerFile,
        endpoint,
        model,
        requestBodyHash: bodyHash,
      });
    }

    const maxAttempts = 2;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(new Error("TimeoutError")), 60000);

        if (abortSignal) {
          if (abortSignal.aborted) {
            clearTimeout(timeoutId);
            controller.abort(abortSignal.reason);
          } else {
            abortSignal.addEventListener("abort", () => {
              clearTimeout(timeoutId);
              controller.abort(abortSignal.reason);
            });
          }
        }

        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: bodyJson,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const txt = await response.text();
          let parsedErrorMsg = txt;
          try {
            const errObj = JSON.parse(txt) as OpenAIChatResponse;
            if (errObj.error?.message) {
              parsedErrorMsg = errObj.error.message;
            }
          } catch {
            // keep raw txt
          }

          const error = new AIResponseError(`API error (${response.status}) on model ${model}: ${parsedErrorMsg}`);

          // Fallback to next model if model unavailable / deprecated / high demand
          if (
            response.status === 404 ||
            response.status === 429 ||
            response.status === 502 ||
            response.status === 503 ||
            response.status === 504
          ) {
            lastError = error;
            break; // Break inner retry loop to try next model
          }

          if (isRetryableResponseStatus(response.status) && attempt < maxAttempts) {
            lastError = error;
            await delay(backoffMs(attempt));
            continue;
          }

          throw error;
        }

        const txt = await response.text();
        const data = JSON.parse(txt) as OpenAIChatResponse;

        // Parse content from chat completions choice or responses fallback
        const replyText =
          data.choices?.[0]?.message?.content ??
          data.output?.[0]?.content?.[0]?.text ??
          data.output_text ??
          (typeof data.content === "string" ? data.content : null);

        if (!replyText && typeof txt === "string") {
          return txt as unknown as T;
        }

        if (replyText === null || replyText === undefined) {
          throw new AIResponseError("AI không trả về nội dung hợp lệ.");
        }

        return replyText as unknown as T;
      } catch (err: unknown) {
        if (err instanceof Error && (err.name === "AbortError" || err.message === "TimeoutError")) {
          throw new AIAbortError("Yêu cầu AI bị gián đoạn hoặc quá thời gian xử lý.");
        }
        if (err instanceof TypeError) {
          throw new AINetworkError(`Lỗi kết nối mạng: ${err.message}`);
        }
        if (err instanceof AIResponseError || err instanceof AINetworkError || err instanceof AIAbortError) {
          lastError = err;
          if (err instanceof AIAbortError || err instanceof AINetworkError) {
            throw err;
          }
          if (attempt < maxAttempts && isRetryableMessage(err.message)) {
            await delay(backoffMs(attempt));
            continue;
          }
          break;
        }
        const msg = err instanceof Error ? err.message : String(err);
        lastError = new AIResponseError(`Unexpected error during AI request: ${msg}`);
        if (attempt < maxAttempts) {
          await delay(backoffMs(attempt));
          continue;
        }
        break;
      }
    }
  }

  throw (lastError as Error) ?? new AIResponseError("Không thể kết nối hoặc nhận phản hồi từ AI API.");
}

function getCallerFile(): string {
  const stack = new Error().stack?.split("\n").slice(2) ?? [];
  for (const line of stack) {
    if (line.includes("sentence-practice.ts")) return "sentence-practice.ts";
    if (line.includes("import-vocabulary.ts")) return "import-vocabulary.ts";
    if (line.includes("writing-assistant.ts")) return "writing-assistant.ts";
    if (line.includes("quiz.ts")) return "quiz.ts";
  }
  return "unknown";
}

function isRetryableResponseStatus(status: number): boolean {
  return status === 502 || status === 503 || status === 504;
}

function isRetryableMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes("502") || lower.includes("503") || lower.includes("504") || lower.includes("high demand") || lower.includes("no available channel");
}

function backoffMs(attempt: number): number {
  return 300 * Math.pow(2, attempt - 1);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
