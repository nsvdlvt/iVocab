import { getAiApiKey } from "@/lib/ai/constants";
import { request } from "@/lib/ai/responsesClient";
import { translationCache } from "./cache";

/**
 * Server-side helper to translate English text/definitions to natural Vietnamese.
 * Features 2-tier fallback with caching:
 * 1. High-speed Google GTX translation (instant ~100ms, supports any sentence length).
 * 2. AI translation fallback (when Google GTX is unavailable).
 */
export async function translateToVietnamese(
  text: string,
  signal?: AbortSignal
): Promise<string | null> {
  const clean = text.trim();
  if (!clean) return null;

  // 1. Check in-memory translation cache
  if (translationCache.has(clean)) {
    return translationCache.get(clean) || null;
  }

  // 2. High-speed Google GTX translation first (handles words, definitions, sentences)
  try {
    const gtxSignal = signal ?? AbortSignal.timeout(3500);
    const gtx = await translateWithGoogleGtx(clean, gtxSignal);
    if (gtx) {
      translationCache.set(clean, gtx);
      return gtx;
    }
  } catch {
    // Fall through to AI fallback below
  }

  // 3. Fallback to AI translation if Google GTX fails
  if (getAiApiKey()) {
    try {
      const prompt = `Dịch câu hoặc định nghĩa từ điển tiếng Anh sau sang tiếng Việt ngắn gọn, tự nhiên, chính xác cho người học tiếng Anh:\n"${clean}"\nChỉ trả về bản dịch tiếng Việt, không kèm giải thích hay ngoặc kép.`;
      const aiSignal = signal ?? AbortSignal.timeout(5000);
      const reply = await request<string>(
        {
          input: prompt,
        },
        aiSignal
      );

      const cleanedReply = reply?.trim().replace(/^["']|["']$/g, "");
      if (cleanedReply && cleanedReply.length > 0) {
        translationCache.set(clean, cleanedReply);
        return cleanedReply;
      }
    } catch {
      // Return null
    }
  }

  return null;
}

async function translateWithGoogleGtx(text: string, signal?: AbortSignal): Promise<string | null> {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url, {
      cache: "no-store",
      signal: signal ?? AbortSignal.timeout(3500),
    });

    if (!res.ok) return null;
    const data = (await res.json()) as unknown;
    if (!Array.isArray(data) || !Array.isArray(data[0])) return null;

    const result = (data[0] as unknown[])
      .map((part) => (Array.isArray(part) && typeof part[0] === "string" ? part[0] : ""))
      .join("")
      .trim();

    return result || null;
  } catch {
    return null;
  }
}
