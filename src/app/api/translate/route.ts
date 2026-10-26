import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const TranslateRequestSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "Vui lòng cung cấp văn bản cần dịch.")
    .max(5000, "Văn bản không được vượt quá 5000 ký tự."),
  sourceLang: z.enum(["auto", "en", "vi"]).default("auto"),
  targetLang: z.enum(["vi", "en"]).default("vi"),
});

// In-memory LRU cache to prevent duplicate external requests
const translationCache = new Map<string, { translation: string; detectedLang?: string; timestamp: number }>();
const CACHE_MAX_SIZE = 500;
const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

function getCache(key: string) {
  const item = translationCache.get(key);
  if (!item) return null;
  if (Date.now() - item.timestamp > CACHE_TTL_MS) {
    translationCache.delete(key);
    return null;
  }
  return item;
}

function setCache(key: string, translation: string, detectedLang?: string) {
  if (translationCache.size >= CACHE_MAX_SIZE) {
    const oldestKey = translationCache.keys().next().value;
    if (oldestKey) translationCache.delete(oldestKey);
  }
  translationCache.set(key, { translation, detectedLang, timestamp: Date.now() });
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

/**
 * Translates text using official Google Cloud Translation API if GOOGLE_TRANSLATE_API_KEY is configured.
 */
async function translateWithGoogleCloud(
  text: string,
  sourceLang: string,
  targetLang: string,
  apiKey: string,
  signal?: AbortSignal
): Promise<{ translation: string; detectedLang?: string } | null> {
  try {
    const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
    const body: Record<string, string> = {
      q: text,
      target: targetLang,
      format: "text",
    };
    if (sourceLang !== "auto") {
      body.source = sourceLang;
    }

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: signal ?? AbortSignal.timeout(6000),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const translation = data?.data?.translations?.[0]?.translatedText;
    const detectedLang = data?.data?.translations?.[0]?.detectedSourceLanguage;

    if (translation && typeof translation === "string") {
      return { translation: decodeHtmlEntities(translation.trim()), detectedLang };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Translates text using Google GTX endpoint (fast ~100ms, standard Google Translate proxy).
 * Uses POST with application/x-www-form-urlencoded to prevent HTTP 414 (URI Too Long) on large selections.
 */
async function translateWithGoogleGtx(
  text: string,
  sourceLang: string,
  targetLang: string,
  signal?: AbortSignal
): Promise<{ translation: string; detectedLang?: string } | null> {
  try {
    const sl = sourceLang === "auto" ? "auto" : sourceLang;
    const tl = targetLang;
    const endpoint = "https://translate.googleapis.com/translate_a/single";
    const body = new URLSearchParams({
      client: "gtx",
      sl,
      tl,
      dt: "t",
      q: text,
    }).toString();

    let response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
      signal: signal ?? AbortSignal.timeout(6000),
    });

    // Fallback to GET for small texts if POST is rejected by certain network environments
    if (!response.ok && text.length < 500) {
      const getUrl = `${endpoint}?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(text)}`;
      response = await fetch(getUrl, {
        cache: "no-store",
        signal: signal ?? AbortSignal.timeout(6000),
      });
    }

    if (!response.ok) return null;

    const data = (await response.json()) as unknown;
    if (!Array.isArray(data) || !Array.isArray(data[0])) return null;

    const rawTranslation = (data[0] as unknown[])
      .map((part) => (Array.isArray(part) && typeof part[0] === "string" ? part[0] : ""))
      .join("")
      .trim();

    const translation = decodeHtmlEntities(rawTranslation);
    const detectedLang = typeof data[2] === "string" ? data[2] : undefined;

    return translation ? { translation, detectedLang } : null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json().catch(() => null);
    const parsed = TranslateRequestSchema.safeParse(rawBody);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Dữ liệu yêu cầu dịch không hợp lệ.";
      return NextResponse.json({ success: false, error: firstError }, { status: 400 });
    }

    const { text, sourceLang, targetLang } = parsed.data;
    const cacheKey = `${sourceLang}:${targetLang}:${text}`;

    const cached = getCache(cacheKey);
    if (cached) {
      return NextResponse.json({
        success: true,
        translation: cached.translation,
        detectedSourceLang: cached.detectedLang,
        originalText: text,
        fromCache: true,
      });
    }

    let result: { translation: string; detectedLang?: string } | null = null;

    // 1. If Google Cloud Translate API key is configured, use official Google Cloud endpoint
    const googleApiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
    if (googleApiKey) {
      result = await translateWithGoogleCloud(
        text,
        sourceLang,
        targetLang,
        googleApiKey,
        request.signal
      );
    }

    // 2. Otherwise use Google GTX endpoint (standard fast Google Translate proxy)
    if (!result) {
      result = await translateWithGoogleGtx(
        text,
        sourceLang,
        targetLang,
        request.signal
      );
    }

    // AI is strictly prohibited from translation. If Google Translate is unavailable, return clear 502 error.
    if (!result || !result.translation) {
      return NextResponse.json(
        {
          success: false,
          error: "Không thể dịch văn bản lúc này qua Google Translate. Vui lòng kiểm tra kết nối mạng hoặc cấu hình GOOGLE_TRANSLATE_API_KEY.",
        },
        { status: 502 }
      );
    }

    setCache(cacheKey, result.translation, result.detectedLang);

    return NextResponse.json({
      success: true,
      translation: result.translation,
      detectedSourceLang: result.detectedLang,
      originalText: text,
      provider: googleApiKey ? "google-cloud" : "google-gtx",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Đã xảy ra lỗi khi dịch văn bản.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
