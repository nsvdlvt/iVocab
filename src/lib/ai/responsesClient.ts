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
        status: response.status,
        headers: headerEntries,
        body: responseBody,
      });
    }

    if (!response.ok) {
      const txt = await response.text();
      throw new AIResponseError(`Responses API error ${response.status}: ${txt}`);
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
      throw err;
    }
    const msg = err instanceof Error ? err.message : String(err);
    throw new AIResponseError(`Unexpected error during request: ${msg}`);
  }
}

function getCallerFile(): string {
  const stack = new Error().stack?.split("\n").slice(2) ?? [];
  for (const line of stack) {
    if (line.includes("sentence-practice.ts")) return "sentence-practice.ts";
    if (line.includes("import-vocabulary.ts")) return "import-vocabulary.ts";
  }
  return "unknown";
}
