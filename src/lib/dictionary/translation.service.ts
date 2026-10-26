import { translationCache } from "./cache";

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
 * Translates English text/definitions to natural Vietnamese using official Google Cloud Translation API.
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
      signal: signal ?? AbortSignal.timeout(4000),
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
 * Server-side helper to translate English text/definitions to natural Vietnamese using Google Translate.
 * Uses Google Cloud Translation API when configured, or standard Google GTX proxy.
 * Absolutely NO AI API or models are used.
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

  // 2. Official Google Cloud Translation API if configured
  const googleApiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (googleApiKey) {
    try {
      const cloudSignal = signal ?? AbortSignal.timeout(4000);
      const cloudResult = await translateWithGoogleCloud(clean, googleApiKey, cloudSignal);
      if (cloudResult) {
        translationCache.set(clean, cloudResult);
        return cloudResult;
      }
    } catch {
      // Fall through to GTX below
    }
  }

  // 3. High-speed Google GTX translation (handles words, definitions, sentences)
  try {
    const gtxSignal = signal ?? AbortSignal.timeout(3500);
    const gtx = await translateWithGoogleGtx(clean, gtxSignal);
    if (gtx) {
      translationCache.set(clean, gtx);
      return gtx;
    }
  } catch {
    // Return null, strictly no AI fallback
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

    return result ? decodeHtmlEntities(result) : null;
  } catch {
    return null;
  }
}
