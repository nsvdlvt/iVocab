import { request as responsesRequest } from "@/lib/ai/responsesClient";
import { AIAbortError, AIResponseError, AINetworkError } from "@/lib/ai/errors";

export async function requestTextResponse(prompt: string, signal?: AbortSignal): Promise<string> {
  const response = await responsesRequest<string | { content?: string }>({ input: prompt }, signal);
  return typeof response === "string" ? response : response.content ?? JSON.stringify(response);
}

export function extractJsonPayload(rawText: string): unknown {
  // Strip reasoning blocks from reasoning models (e.g. DeepSeek R1, Qwen, etc.)
  let cleaned = rawText.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

  // Strip markdown code blocks
  cleaned = cleaned.replace(/```(?:json)?\s*([\s\S]*?)\s*```/gi, "$1").trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("[");
    const end = cleaned.lastIndexOf("]");
    if (start !== -1 && end !== -1 && end > start) {
      try {
        parsed = JSON.parse(cleaned.slice(start, end + 1));
      } catch {}
    }

    if (!parsed) {
      const objectStart = cleaned.indexOf("{");
      const objectEnd = cleaned.lastIndexOf("}");
      if (objectStart !== -1 && objectEnd !== -1 && objectEnd > objectStart) {
        try {
          parsed = JSON.parse(cleaned.slice(objectStart, objectEnd + 1));
        } catch {}
      }
    }

    if (!parsed) {
      throw new AIResponseError("Phản hồi AI không phải JSON hợp lệ.");
    }
  }

  // Handle wrapped arrays like { format: "json_array", value: [...] } or { words: [...] } or { data: [...] }
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    const record = parsed as Record<string, unknown>;
    const candidateKeys = [
      "value",
      "words",
      "vocabulary",
      "vocabularies",
      "items",
      "data",
      "result",
      "cards",
      "list",
    ];

    for (const key of candidateKeys) {
      if (Array.isArray(record[key])) {
        return record[key];
      }
    }
  }

  return parsed;
}

export function normalizeAiTransportError(error: unknown): never {
  if (error instanceof AIAbortError || error instanceof AINetworkError || error instanceof AIResponseError) {
    throw error;
  }
  const message = error instanceof Error ? error.message : String(error);
  throw new AIResponseError(`Unexpected error during request: ${message}`);
}
