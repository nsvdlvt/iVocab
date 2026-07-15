import { request as responsesRequest } from "@/lib/ai/responsesClient";
import { AIAbortError, AIResponseError, AINetworkError } from "@/lib/ai/errors";

export async function requestTextResponse(prompt: string, signal?: AbortSignal): Promise<string> {
  const response = await responsesRequest<{ content?: string }>({ input: prompt }, signal);
  return typeof response === "string" ? response : response.content ?? JSON.stringify(response);
}

export function extractJsonPayload(rawText: string): unknown {
  const cleaned = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("[");
    const end = cleaned.lastIndexOf("]");
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }

    const objectStart = cleaned.indexOf("{");
    const objectEnd = cleaned.lastIndexOf("}");
    if (objectStart !== -1 && objectEnd !== -1 && objectEnd > objectStart) {
      return JSON.parse(cleaned.slice(objectStart, objectEnd + 1));
    }

    throw new AIResponseError("Phản hồi AI không phải JSON hợp lệ.");
  }
}

export function normalizeAiTransportError(error: unknown): never {
  if (error instanceof AIAbortError || error instanceof AINetworkError || error instanceof AIResponseError) {
    throw error;
  }
  const message = error instanceof Error ? error.message : String(error);
  throw new AIResponseError(`Unexpected error during request: ${message}`);
}
