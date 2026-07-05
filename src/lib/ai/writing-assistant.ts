// src/lib/ai/writing-assistant.ts

import { request as responsesRequest } from "@/lib/ai/responsesClient"
import { z } from "zod"
import { LRUCache } from "@/lib/utils/lruCache"
import { AIValidationError } from "@/lib/ai/errors"
import { conversationMemory } from "@/lib/ai/conversationMemory"

type HelperType =
  | "hint"
  | "example"
  | "another-example"
  | "explain"
  | "generate-more"

export type WritingType = "sentence" | "paragraph" | "story" | "essay"

export interface WritingAssistantRequest {
  type: HelperType
  targetWord: string
  language?: string
  // future‑proofing: specify the writing context (default: sentence)
  writingType?: WritingType
  // Additional context can be added in the future
}

// In‑memory LRU cache for completed helper responses
const helperCache = new LRUCache<string, unknown>(200)

// Map to deduplicate pending requests (key = cacheKey)
const pendingRequests = new Map<string, Promise<unknown>>()
// Map to track AbortControllers per word (key = word|lang)
const abortControllers = new Map<string, AbortController>()

// Zod schemas for validation
const stringSchema = z.string()
const generateMoreSchema = z.array(z.string()).length(3)

function buildPrompt(req: WritingAssistantRequest): string {
  const { type, targetWord } = req;
  switch (type) {
    case "hint":
      return `Hãy đưa ra một gợi ý ngắn gọn bằng tiếng Việt để giúp người học đặt câu đúng với từ "${targetWord}". Không đưa ra cả câu hoàn chỉnh, chỉ đưa ra một gợi ý/hướng dẫn viết.`;
    case "example":
      return `Give ONE natural example sentence in English that correctly uses the word "${targetWord}". Return only the sentence as plain text in English.`;
    case "another-example":
      return `Provide a DIFFERENT natural example sentence in English using the word "${targetWord}". Return only the sentence as plain text in English.`;
    case "explain":
      return `Hãy giải thích chi tiết bằng tiếng Việt tại sao câu của người học chưa đúng hoặc chưa tự nhiên, tại sao câu đề xuất sửa đổi lại tốt hơn, và nêu ra các quy tắc ngữ pháp/từ vựng liên quan. Không trả về JSON.`;
    case "generate-more":
      return `Generate THREE additional example sentences in English that use the word "${targetWord}". The sentences should increase in complexity from simple to more advanced. Return a JSON array of three strings.`;
    default:
      return "";
  }
}

/**
 * Core helper that returns either a string response or an array of strings (for generate‑more).
 * It handles:
 *   - per‑word abort cancellation (newer request wins)
 *   - pending request deduplication (old pending ones are cancelled)
 *   - LRU caching of completed responses
 *   - lightweight conversation memory tracking
 */
export async function getWritingAssistantResponse(
  req: WritingAssistantRequest,
  externalAbortSignal?: AbortSignal
): Promise<string | string[]> {
  const cacheKey = `${req.type}|${req.targetWord}|${req.language ?? "en"}`
  const wordKey = `${req.targetWord}|${req.language ?? "en"}`

  // Return cached result if present
  const cached = helperCache.get(cacheKey)
  if (cached) {
    return cached as string | string[]
  }

  // Cancel any previous pending request for this word (newest wins)
  const existingController = abortControllers.get(wordKey)
  if (existingController) {
    existingController.abort()
    abortControllers.delete(wordKey)
  }

  // Remove any pending promise that might exist for this word (different helper type)
  // We keep pendingRequests indexed by cacheKey, so we clear all entries that share the same wordKey.
  for (const key of pendingRequests.keys()) {
    if (key.includes(`|${req.targetWord}|${req.language ?? "en"}`)) {
      pendingRequests.delete(key)
    }
  }

  const controller = new AbortController()
  abortControllers.set(wordKey, controller)

  // Combine external abort signal with our internal controller
  if (externalAbortSignal) {
    if (externalAbortSignal.aborted) controller.abort()
    else externalAbortSignal.addEventListener("abort", () => controller.abort())
  }

  const requestPromise = (async () => {
    const prompt = buildPrompt(req)
    // Record user side of the conversation
    conversationMemory.addUser(req.targetWord, prompt, req.language)

    let rawResponse: unknown
    try {
      rawResponse = await responsesRequest({ input: prompt }, controller.signal)
    } catch (e: unknown) {
      // Clean up on error
      abortControllers.delete(wordKey)
      pendingRequests.delete(cacheKey)
      throw e
    }

    // Record assistant response in conversation memory (stringified for uniformity)
    const assistantContent = typeof rawResponse === "string" ? rawResponse : JSON.stringify(rawResponse)
    conversationMemory.addAssistant(req.targetWord, assistantContent, req.language)

    // Parse response (may be JSON)
    let parsed: unknown = rawResponse
    if (typeof rawResponse === "string") {
      try {
        parsed = JSON.parse(rawResponse)
      } catch {
        // keep as string if not JSON
      }
    }

    // Validate according to helper type
    try {
      switch (req.type) {
        case "hint":
        case "example":
        case "another-example":
        case "explain":
          stringSchema.parse(parsed)
          break
        case "generate-more":
          generateMoreSchema.parse(parsed)
          break
      }
    } catch {
      abortControllers.delete(wordKey)
      pendingRequests.delete(cacheKey)
      throw new AIValidationError(`Invalid AI response for ${req.type}`)
    }

    // Cache validated result
    helperCache.set(cacheKey, parsed)
    // Cleanup tracking structures
    abortControllers.delete(wordKey)
    pendingRequests.delete(cacheKey)
    return parsed as string | string[]
  })()

  // Store the pending promise for possible cancellation by later requests
  pendingRequests.set(cacheKey, requestPromise)
  return requestPromise
}

/**
 * Prefetch the most likely helper (Hint) for a given word.
 * Called after sentence evaluation completes. It runs silently and populates the cache.
 */
export async function prefetchHelper(
  targetWord: string,
  language = "en",
  writingType: WritingType = "sentence"
): Promise<void> {
  // Fire‑and‑forget; ignore errors – they will be handled on the real request.
  try {
    await getWritingAssistantResponse(
      { type: "hint", targetWord, language, writingType },
      undefined
    )
  } catch {
    // Silently swallow – cache may stay empty.
  }
}
