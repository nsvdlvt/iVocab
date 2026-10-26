import type {
  KeyVocabularyItem,
  IdiomOrPhraseItem,
  AlternativeTranslationItem,
  TranslationResponseData,
} from "@/types/translation";

interface GtxResponse {
  0?: Array<[string, ...unknown[]]>;
  2?: string;
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

export class LearningTranslationService {
  /**
   * Translates text between English and Vietnamese using Google Translate.
   * Absolutely NO AI models or providers are used.
   */
  async translate(
    text: string,
    sourceLang: "auto" | "en" | "vi" = "auto",
    targetLang: "en" | "vi" = "vi",
    includeLearningAnalysis = false,
    signal?: AbortSignal
  ): Promise<TranslationResponseData> {
    void includeLearningAnalysis;
    const cleanText = text.trim();
    if (!cleanText) {
      throw new Error("Vui lòng cung cấp văn bản cần dịch.");
    }

    let translatedText: string | null = null;
    let detectedSourceLang: "en" | "vi" | undefined;

    // Step 1: Official Google Cloud Translation API if configured
    const googleApiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
    if (googleApiKey) {
      try {
        const cloudResult = await this.translateWithGoogleCloud(
          cleanText,
          sourceLang,
          targetLang,
          googleApiKey,
          signal
        );
        if (cloudResult) {
          translatedText = cloudResult.translatedText;
          detectedSourceLang = cloudResult.detectedLang;
        }
      } catch {
        // Fall through to GTX below
      }
    }

    // Step 2: Google GTX endpoint
    if (!translatedText) {
      try {
        const gtxResult = await this.translateWithGoogleGtx(
          cleanText,
          sourceLang,
          targetLang,
          signal
        );
        if (gtxResult) {
          translatedText = gtxResult.translatedText;
          detectedSourceLang = gtxResult.detectedLang;
        }
      } catch {
        // Handle failure below
      }
    }

    // AI is strictly prohibited from translation. If Google Translate fails, throw error.
    if (!translatedText) {
      throw new Error(
        "Không thể dịch văn bản vào lúc này qua Google Translate. Vui lòng thử lại sau ít giây."
      );
    }

    // Resolve effective source language
    const effectiveSource =
      sourceLang === "auto"
        ? detectedSourceLang || (this.hasVietnameseDiacritics(cleanText) ? "vi" : "en")
        : sourceLang;

    // AI is forbidden from generating synthetic learning analysis; return clean structured arrays
    const keyVocabulary: KeyVocabularyItem[] = [];
    const idiomsAndPhrases: IdiomOrPhraseItem[] = [];
    const alternativeTranslations: AlternativeTranslationItem[] = [];

    return {
      translatedText,
      detectedSourceLang: detectedSourceLang || effectiveSource,
      sourceLang,
      targetLang,
      keyVocabulary,
      idiomsAndPhrases,
      alternativeTranslations,
    };
  }

  private hasVietnameseDiacritics(text: string): boolean {
    const vnPattern = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
    return vnPattern.test(text);
  }

  private async translateWithGoogleCloud(
    text: string,
    sourceLang: string,
    targetLang: string,
    apiKey: string,
    signal?: AbortSignal
  ): Promise<{ translatedText: string; detectedLang?: "en" | "vi" } | null> {
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
      const raw = data?.data?.translations?.[0]?.translatedText;
      const detected = data?.data?.translations?.[0]?.detectedSourceLanguage?.toLowerCase();
      const detectedLang = detected === "en" || detected === "vi" ? detected : undefined;

      if (raw && typeof raw === "string") {
        return {
          translatedText: decodeHtmlEntities(raw.trim()),
          detectedLang,
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  private async translateWithGoogleGtx(
    text: string,
    sourceLang: string,
    targetLang: string,
    signal?: AbortSignal
  ): Promise<{ translatedText: string; detectedLang?: "en" | "vi" } | null> {
    try {
      const sl = sourceLang === "auto" ? "auto" : sourceLang;
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
      const res = await fetch(url, {
        cache: "no-store",
        signal: signal ?? AbortSignal.timeout(5000),
      });

      if (!res.ok) return null;
      const data = (await res.json()) as GtxResponse;
      if (!data || !Array.isArray(data[0])) return null;

      const segments = data[0];
      const translatedText = segments
        .map((part) => (Array.isArray(part) && typeof part[0] === "string" ? part[0] : ""))
        .join("")
        .trim();

      const detectedRaw = typeof data[2] === "string" ? data[2].toLowerCase() : undefined;
      const detectedLang =
        detectedRaw === "en" || detectedRaw === "vi" ? detectedRaw : undefined;

      return {
        translatedText: decodeHtmlEntities(translatedText),
        detectedLang,
      };
    } catch {
      return null;
    }
  }
}

export const learningTranslationService = new LearningTranslationService();
