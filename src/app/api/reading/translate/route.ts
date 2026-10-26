import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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
 * Translates reading text using official Google Cloud Translation API if GOOGLE_TRANSLATE_API_KEY is configured.
 */
async function translateWithGoogleCloud(
  text: string,
  apiKey: string,
  signal?: AbortSignal
): Promise<string | null> {
  try {
    const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
    const body = {
      q: text,
      source: "en",
      target: "vi",
      format: "text",
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: signal ?? AbortSignal.timeout(6000),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const translation = data?.data?.translations?.[0]?.translatedText;

    if (translation && typeof translation === "string") {
      return decodeHtmlEntities(translation.trim());
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Translates reading text using Google GTX endpoint (standard fast proxy).
 */
async function translateWithGoogleGtx(text: string, signal?: AbortSignal): Promise<string | null> {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(url, {
      cache: "no-store",
      signal: signal ?? AbortSignal.timeout(8000),
    });

    if (!response.ok) return null;

    const data = (await response.json()) as unknown;
    if (!Array.isArray(data) || !Array.isArray(data[0])) return null;

    const rawTranslation = (data[0] as unknown[])
      .map((part) => (Array.isArray(part) && typeof part[0] === "string" ? part[0] : ""))
      .join("")
      .trim();

    return rawTranslation ? decodeHtmlEntities(rawTranslation) : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as { text?: string } | null;
    const text = body?.text?.trim();

    if (!text) {
      return NextResponse.json(
        { error: "Vui lòng cung cấp văn bản cần dịch." },
        { status: 400 }
      );
    }

    if (text.length > 5000) {
      return NextResponse.json(
        { error: "Đoạn văn quá dài (tối đa 5000 ký tự)." },
        { status: 400 }
      );
    }

    let translation: string | null = null;
    let provider = "google-gtx";

    // 1. Try official Google Cloud Translation API if configured in environment
    const googleApiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
    if (googleApiKey) {
      translation = await translateWithGoogleCloud(text, googleApiKey, request.signal);
      if (translation) {
        provider = "google-cloud";
      }
    }

    // 2. Otherwise try Google GTX endpoint
    if (!translation) {
      translation = await translateWithGoogleGtx(text, request.signal);
      provider = "google-gtx";
    }

    // AI is strictly prohibited from translation. Return 502 if Google Translate fails.
    if (!translation) {
      return NextResponse.json(
        { error: "Không thể dịch đoạn văn bản này vào lúc này qua Google Translate. Vui lòng thử lại sau." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      translation,
      provider,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Translation error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
