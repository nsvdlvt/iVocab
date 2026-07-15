import { AI_MODEL } from "@/lib/ai/constants";
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

export async function request<T = unknown>(
  payload: Omit<ResponsesRequestPayload, "model"> & { model?: string },
  abortSignal?: AbortSignal
): Promise<T> {
  const model = payload.model ?? AI_MODEL;
  const body = { ...payload, model };

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new AINetworkError("Missing OPENAI_API_KEY");
  }

  const baseURL = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
  const endpoint = `${baseURL.replace(/\/+$/, "")}/responses`;
  const bodyJson = JSON.stringify(body);
  const bodyHash = crypto.createHash("sha256").update(bodyJson).digest("hex");
  const callerFile = getCallerFile();

  const inputParts = Array.isArray(payload.input) ? payload.input : [];
  const payloadType = Array.isArray(payload.input) ? "multimodal" : "text";
  const imageSizeBytes = inputParts.reduce((total, part) => {
    if (part.type !== "input_image" || typeof part.image_url !== "string") return total;
    const base64Part = part.image_url.includes(",") ? part.image_url.split(",")[1] : part.image_url;
    return total + Buffer.byteLength(base64Part, "base64");
  }, 0);

  if (process.env.NODE_ENV === "development") {
    console.log("[responsesClient] Outbound payload", {
      callerFile,
      endpoint,
      model,
      payloadType,
      inputParts: inputParts.length,
      promptLength: typeof payload.input === "string" ? payload.input.length : inputParts.filter((part) => part.type === "input_text").reduce((sum, part) => sum + (part.text?.length ?? 0), 0),
      imageSizeBytes,
      requestBodyHash: bodyHash,
      requestBodySize: Buffer.byteLength(bodyJson, "utf8"),
      requestBody: JSON.parse(bodyJson),
    });
  }

  const maxAttempts = 3;
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(new Error("TimeoutError")), 90000);

      if (abortSignal) {
        abortSignal.addEventListener("abort", () => {
          clearTimeout(timeoutId);
          controller.abort(abortSignal.reason);
        });
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

      if (process.env.NODE_ENV === "development") {
        const headerEntries = Array.from(response.headers.entries());
        const responseBody = await response.clone().text();
        console.log("[responsesClient] HTTP response", {
          attempt,
          status: response.status,
          headers: headerEntries,
          body: responseBody,
        });
      }

      if (!response.ok) {
        const txt = await response.text();
        const error = new AIResponseError(`Responses API error ${response.status}: ${txt}`);
        if (isRetryableResponseStatus(response.status) && attempt < maxAttempts) {
          lastError = error;
          await delay(backoffMs(attempt));
          continue;
        }
        throw error;
      }

      const txt = await response.text();
      const data = JSON.parse(txt);
      let content: unknown = data;
      if (data && typeof data === "object") {
        const wrapper = data as {
          output?: Array<{ content?: Array<{ text?: string }> }>;
          content?: string;
          output_text?: string;
        };
        const first = wrapper.output?.[0];
        const txtNode = first?.content?.[0]?.text;
        if (typeof txtNode === "string") content = txtNode;
        else if (typeof wrapper.output_text === "string") content = wrapper.output_text;
        else if (typeof wrapper.content === "string") content = wrapper.content;
      }
      return content as T;
    } catch (err: unknown) {
      if (err instanceof Error && (err.name === "AbortError" || err.message === "TimeoutError")) {
        throw new AIAbortError("Request aborted or timed out");
      }
      if (err instanceof TypeError) {
        throw new AINetworkError(`Network failure: ${err.message}`);
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
        throw err;
      }
      const msg = err instanceof Error ? err.message : String(err);
      lastError = new AIResponseError(`Unexpected error during request: ${msg}`);
      if (attempt < maxAttempts) {
        await delay(backoffMs(attempt));
        continue;
      }
      throw lastError;
    }
  }

  throw (lastError as Error) ?? new AIResponseError("Request failed after multiple attempts");
}

function getCallerFile(): string {
  const stack = new Error().stack?.split("\n").slice(2) ?? [];
  for (const line of stack) {
    if (line.includes("sentence-practice.ts")) return "sentence-practice.ts";
    if (line.includes("import-vocabulary.ts")) return "import-vocabulary.ts";
  }
  return "unknown";
}

function isRetryableResponseStatus(status: number): boolean {
  return status === 502 || status === 503 || status === 504;
}

function isRetryableMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes("502") || lower.includes("503") || lower.includes("504") || lower.includes("upstream_error");
}

function backoffMs(attempt: number): number {
  return 300 * Math.pow(2, attempt - 1);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
