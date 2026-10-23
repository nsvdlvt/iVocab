import { getAiApiKey } from "@/lib/ai/constants";
import { requestTextResponse, extractJsonPayload } from "@/lib/ai/json-response";
import { translationCache } from "@/lib/dictionary/cache";
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

export class LearningTranslationService {
  /**
   * Translates text between English and Vietnamese, optionally generating learning insights.
   */
  async translate(
    text: string,
    sourceLang: "auto" | "en" | "vi" = "auto",
    targetLang: "en" | "vi" = "vi",
    includeLearningAnalysis = true,
    signal?: AbortSignal
  ): Promise<TranslationResponseData> {
    const cleanText = text.trim();
    if (!cleanText) {
      throw new Error("Vui lòng cung cấp văn bản cần dịch.");
    }

    // Step 1: Perform translation via Google GTX first (fast ~100ms)
    let translatedText: string | null = null;
    let detectedSourceLang: "en" | "vi" | undefined;

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
      // Fall through to AI fallback below
    }

    // Step 2: Fallback to AI if Google GTX failed
    if (!translatedText) {
      const aiResult = await this.translateWithAi(
        cleanText,
        sourceLang,
        targetLang,
        signal
      );
      translatedText = aiResult.translatedText;
      detectedSourceLang = aiResult.detectedLang;
    }

    if (!translatedText) {
      throw new Error(
        "Không thể dịch văn bản vào lúc này. Vui lòng thử lại sau ít giây."
      );
    }

    // Resolve effective source language
    const effectiveSource =
      sourceLang === "auto"
        ? detectedSourceLang || (this.hasVietnameseDiacritics(cleanText) ? "vi" : "en")
        : sourceLang;

    // Step 3: Extract learning insights (Vocabulary, Idioms, Nuances) if requested
    let keyVocabulary: KeyVocabularyItem[] = [];
    let idiomsAndPhrases: IdiomOrPhraseItem[] = [];
    let alternativeTranslations: AlternativeTranslationItem[] = [];

    if (includeLearningAnalysis && getAiApiKey()) {
      try {
        const analysis = await this.extractLearningAnalysis(
          cleanText,
          translatedText,
          effectiveSource,
          signal
        );
        keyVocabulary = analysis.keyVocabulary;
        idiomsAndPhrases = analysis.idiomsAndPhrases;
        alternativeTranslations = analysis.alternativeTranslations;
      } catch (analysisErr) {
        // Non-blocking: If analysis fails, core translation is still returned
        console.warn(
          "[LearningTranslationService] Learning analysis warning:",
          analysisErr
        );
      }
    }

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
        signal: signal ?? AbortSignal.timeout(4000),
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
        translatedText,
        detectedLang,
      };
    } catch {
      return null;
    }
  }

  private async translateWithAi(
    text: string,
    sourceLang: string,
    targetLang: string,
    signal?: AbortSignal
  ): Promise<{ translatedText: string; detectedLang?: "en" | "vi" }> {
    const srcDesc =
      sourceLang === "en"
        ? "tiếng Anh"
        : sourceLang === "vi"
        ? "tiếng Việt"
        : "tự động nhận diện";
    const tgtDesc = targetLang === "vi" ? "tiếng Việt" : "tiếng Anh";

    const prompt = `Bạn là dịch giả song ngữ Anh - Việt chuyên nghiệp.
Hãy dịch chính xác đoạn văn bản sau từ ${srcDesc} sang ${tgtDesc}.
Giữ nguyên định dạng xuống dòng và phân đoạn.
Chỉ trả về văn bản đã dịch, không kèm lời mở đầu, không kèm dấu ngoặc kép thừa.

Văn bản:
${text}`;

    const raw = await requestTextResponse(prompt, signal);
    const cleaned = raw.trim().replace(/^["']|["']$/g, "");
    const detectedLang = this.hasVietnameseDiacritics(text) ? "vi" : "en";

    return {
      translatedText: cleaned,
      detectedLang,
    };
  }

  private async extractLearningAnalysis(
    sourceText: string,
    translatedText: string,
    sourceLang: "en" | "vi",
    signal?: AbortSignal
  ): Promise<{
    keyVocabulary: KeyVocabularyItem[];
    idiomsAndPhrases: IdiomOrPhraseItem[];
    alternativeTranslations: AlternativeTranslationItem[];
  }> {
    // If text is too short (1 word), return minimal analysis
    const wordCount = sourceText.split(/\s+/).length;
    if (wordCount < 2) {
      return {
        keyVocabulary: [
          {
            word: sourceText,
            meaning: translatedText,
          },
        ],
        idiomsAndPhrases: [],
        alternativeTranslations: [],
      };
    }

    const prompt = `Phân tích từ vựng và thành ngữ cho người học tiếng Anh dựa trên đoạn văn bản dịch song ngữ sau:

[VĂN BẢN GỐC (${sourceLang})]:
${sourceText}

[BẢN DỊCH]:
${translatedText}

Yêu cầu phân tích và trả về DUY NHẤT một JSON hợp lệ tuân thủ cấu trúc sau:
{
  "keyVocabulary": [
    {
      "word": "từ tiếng Anh nguyên thể hoặc cụm từ trọng tâm",
      "meaning": "nghĩa tiếng Việt trong ngữ cảnh này",
      "ipa": "phiên âm IPA nếu có (ví dụ: /ˈelɪkwənt/)",
      "partOfSpeech": "noun / verb / adjective / adverb / phrase",
      "example": "ví dụ ngắn chứa từ này",
      "note": "lưu ý ngữ cảnh, collocation hoặc giới từ đi kèm nếu có"
    }
  ],
  "idiomsAndPhrases": [
    {
      "phrase": "thành ngữ hoặc cụm phrasal verb nếu có trong đoạn",
      "meaning": "nghĩa tiếng Việt",
      "explanation": "giải thích ngắn về cách dùng hoặc nguồn gốc"
    }
  ],
  "alternativeTranslations": [
    {
      "phrase": "từ hoặc cụm từ có nhiều cách hiểu khác nhau",
      "alternatives": ["cách dịch thay thế 1", "cách dịch thay thế 2"],
      "nuance": "giải thích sự khác biệt sắc thái hoặc ngữ cảnh sử dụng"
    }
  ]
}

Quy tắc:
1. "keyVocabulary": chọn từ 2 đến 5 từ/cụm từ hữu ích nhất cho người học.
2. "idiomsAndPhrases": chỉ đưa vào nếu thực sự có thành ngữ, cụm động từ hoặc cấu trúc cố định. Nếu không có, để mảng rỗng [].
3. "alternativeTranslations": chỉ đưa vào nếu có từ đa nghĩa dễ gây nhầm lẫn. Nếu không có, để mảng rỗng [].
4. Tuyệt đối không bọc markdown ngoài JSON, chỉ trả về JSON thuần túy.`;

    const rawResponse = await requestTextResponse(prompt, signal);
    const parsed = extractJsonPayload(rawResponse) as {
      keyVocabulary?: KeyVocabularyItem[];
      idiomsAndPhrases?: IdiomOrPhraseItem[];
      alternativeTranslations?: AlternativeTranslationItem[];
    };

    return {
      keyVocabulary: Array.isArray(parsed?.keyVocabulary)
        ? parsed.keyVocabulary.map((v) => ({
            word: String(v.word || "").trim(),
            meaning: String(v.meaning || "").trim(),
            ipa: v.ipa ? String(v.ipa).trim() : undefined,
            partOfSpeech: v.partOfSpeech ? String(v.partOfSpeech).trim() : undefined,
            example: v.example ? String(v.example).trim() : undefined,
            note: v.note ? String(v.note).trim() : undefined,
          })).filter((v) => v.word && v.meaning)
        : [],
      idiomsAndPhrases: Array.isArray(parsed?.idiomsAndPhrases)
        ? parsed.idiomsAndPhrases.map((i) => ({
            phrase: String(i.phrase || "").trim(),
            meaning: String(i.meaning || "").trim(),
            explanation: String(i.explanation || "").trim(),
          })).filter((i) => i.phrase && i.meaning)
        : [],
      alternativeTranslations: Array.isArray(parsed?.alternativeTranslations)
        ? parsed.alternativeTranslations.map((a) => ({
            phrase: String(a.phrase || "").trim(),
            alternatives: Array.isArray(a.alternatives)
              ? a.alternatives.map(String)
              : [],
            nuance: String(a.nuance || "").trim(),
          })).filter((a) => a.phrase && a.alternatives.length > 0)
        : [],
    };
  }
}

export const learningTranslationService = new LearningTranslationService();
