import { AI_MODEL, DEFAULT_GEMINI_MODELS } from "@/lib/ai/constants";
import { AIResponseError, AIAbortError, AINetworkError } from "@/lib/ai/errors";
import crypto from "crypto";

export interface InputPart {
  type: "input_text" | "input_image" | "input_file";
  text?: string;
  image_url?: string;
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

interface GeminiPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
  thought?: boolean;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: GeminiPart[];
    };
  }>;
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
}

export async function request<T = unknown>(
  payload: Omit<ResponsesRequestPayload, "model"> & { model?: string },
  abortSignal?: AbortSignal
): Promise<T> {
  const apiKey = (process.env.GEMINI_API_KEY ?? process.env.OPENAI_API_KEY)?.trim();
  if (!apiKey) {
    throw new AINetworkError("Thiếu cấu hình GEMINI_API_KEY trong biến môi trường (.env.local)");
  }

  const requestedModel = payload.model ?? AI_MODEL;
  const modelsToTry = [
    requestedModel,
    ...DEFAULT_GEMINI_MODELS.filter((m) => m !== requestedModel),
  ];

  // Convert input to Gemini contents parts
  const parts: GeminiPart[] = [];
  const textObj = payload.text as { format?: { type?: string } } | undefined;
  let isJsonExpected =
    textObj?.format?.type === "json_object" ||
    textObj?.format?.type === "json_schema";

  if (typeof payload.input === "string") {
    parts.push({ text: payload.input });
    if (
      payload.input.includes("strict JSON") ||
      payload.input.includes("JSON array") ||
      payload.input.includes("JSON object") ||
      payload.input.includes("Return **strict JSON")
    ) {
      isJsonExpected = true;
    }
  } else if (Array.isArray(payload.input)) {
    for (const part of payload.input) {
      if (part.type === "input_text" && part.text) {
        parts.push({ text: part.text });
        if (
          part.text.includes("strict JSON") ||
          part.text.includes("JSON array") ||
          part.text.includes("Return **strict JSON")
        ) {
          isJsonExpected = true;
        }
      } else if (part.type === "input_image" && part.image_url) {
        let mimeType = "image/jpeg";
        let base64Data = part.image_url;

        const match = part.image_url.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          mimeType = match[1];
          base64Data = match[2];
        }

        parts.push({
          inlineData: {
            mimeType,
            data: base64Data,
          },
        });
      }
    }
  }

  if (parts.length === 0) {
    throw new AIResponseError("Không có nội dung để gửi tới AI.");
  }

  const requestBody = {
    contents: [
      {
        role: "user",
        parts,
      },
    ],
    generationConfig: {
      temperature: 0.3,
      ...(isJsonExpected ? { responseMimeType: "application/json" } : {}),
    },
  };

  const bodyJson = JSON.stringify(requestBody);
  const bodyHash = crypto.createHash("sha256").update(bodyJson).digest("hex");
  const callerFile = getCallerFile();

  if (process.env.NODE_ENV === "development") {
    console.log("[responsesClient:gemini] Outbound payload", {
      callerFile,
      modelsToTry,
      partsCount: parts.length,
      isJsonExpected,
      requestBodyHash: bodyHash,
    });
  }

  let lastError: unknown = null;

  for (const model of modelsToTry) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model
    )}:generateContent?key=${encodeURIComponent(apiKey)}`;

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
          },
          body: bodyJson,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const txt = await response.text();
          let parsedErrorMsg = txt;
          try {
            const errObj = JSON.parse(txt) as GeminiResponse;
            if (errObj.error?.message) {
              parsedErrorMsg = errObj.error.message;
            }
          } catch {
            // keep raw txt
          }

          const error = new AIResponseError(`Gemini API error (${response.status}) on model ${model}: ${parsedErrorMsg}`);

          // Fallback to next model if model unavailable / deprecated / high demand
          if (
            response.status === 404 ||
            response.status === 429 ||
            response.status === 502 ||
            response.status === 503 ||
            response.status === 504
          ) {
            lastError = error;
            break; // Break inner retry loop to try next model in outer loop
          }

          if (isRetryableResponseStatus(response.status) && attempt < maxAttempts) {
            lastError = error;
            await delay(backoffMs(attempt));
            continue;
          }

          throw error;
        }

        const txt = await response.text();
        const data = JSON.parse(txt) as GeminiResponse;

        const candidateParts = data.candidates?.[0]?.content?.parts ?? [];
        const replyText = candidateParts
          .filter((part) => !part.thought && typeof part.text === "string")
          .map((part) => part.text)
          .join("")
          .trim();

        if (!replyText && candidateParts.length === 0) {
          throw new AIResponseError("Gemini không trả về nội dung hợp lệ.");
        }

        // Return reply text, compatible with string or { content: string }
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
          // If this was a model-level failure, break to try next model
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

  throw (lastError as Error) ?? new AIResponseError("Không thể kết nối hoặc nhận phản hồi từ Gemini AI.");
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
  return lower.includes("502") || lower.includes("503") || lower.includes("504") || lower.includes("high demand");
}

function backoffMs(attempt: number): number {
  return 300 * Math.pow(2, attempt - 1);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
