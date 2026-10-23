import { getAiApiKey } from "@/lib/ai/constants";
import { request } from "@/lib/ai/responsesClient";
import type {
  DictionaryResult,
  ContextualTranslationResult,
  DictionaryMeaningGroup,
  DictionarySenseDefinition,
} from "@/types/dictionary";
import { translateToVietnamese } from "../translation.service";
import type { IDictionaryProvider, DictionaryLookupOptions } from "./interface";

export class AiDictionaryProvider implements IDictionaryProvider {
  readonly name = "ai-enriched";

  async lookup(word: string, options?: DictionaryLookupOptions): Promise<DictionaryResult | null> {
    const clean = word.trim();
    if (!clean) return null;

    if (!getAiApiKey()) {
      return this.fallbackTranslateLookup(clean, options?.signal);
    }

    try {
      const prompt = `Bạn là chuyên gia từ điển học Anh - Việt. Hãy kiểm tra từ hoặc cụm từ "${clean}".
Nếu "${clean}" là chuỗi ký tự vô nghĩa, từ bịa đặt hoặc không có trong tiếng Anh thực tế, chỉ trả về JSON: {"error": "not_found"}.
Nếu là từ, cụm từ, thành ngữ hoặc tiếng lóng có thật, hãy xuất ra JSON hợp lệ theo đúng cấu trúc sau (không kèm markdown ngoài json):
{
  "word": "${clean}",
  "ipa": "/phiên âm IPA chính xác/",
  "primaryVietnamese": "nghĩa tiếng Việt phổ biến nhất",
  "meanings": [
    {
      "partOfSpeech": "noun | verb | adjective | adverb | phrase",
      "vietnameseSummary": "tóm tắt nghĩa tiếng Việt cho từ loại này",
      "definitions": [
        {
          "definitionEn": "Định nghĩa tiếng Anh rõ ràng, dễ hiểu cho người học",
          "definitionVi": "Bản dịch nghĩa tiếng Việt tương ứng",
          "exampleEn": "Câu ví dụ tiếng Anh tự nhiên chứa từ này",
          "exampleVi": "Dịch câu ví dụ sang tiếng Việt",
          "synonyms": ["từ đồng nghĩa 1", "từ đồng nghĩa 2"],
          "antonyms": []
        }
      ]
    }
  ],
  "collocations": ["collocation 1", "collocation 2"],
  "synonyms": ["đồng nghĩa 1", "đồng nghĩa 2"]
}`;

      const reply = await request<string>(
        {
          input: prompt,
        },
        options?.signal ?? AbortSignal.timeout(10000)
      );

      const jsonStr = extractJsonString(reply);
      if (!jsonStr) {
        return this.fallbackTranslateLookup(clean, options?.signal);
      }

      const parsed = JSON.parse(jsonStr) as {
        error?: string;
        word?: string;
        ipa?: string;
        primaryVietnamese?: string;
        meanings?: Array<{
          partOfSpeech?: string;
          vietnameseSummary?: string;
          definitions?: Array<{
            definitionEn?: string;
            definitionVi?: string;
            exampleEn?: string;
            exampleVi?: string;
            synonyms?: string[];
            antonyms?: string[];
          }>;
        }>;
        collocations?: string[];
        synonyms?: string[];
      };

      if (parsed?.error === "not_found") {
        return null;
      }

      if (!parsed || !Array.isArray(parsed.meanings) || parsed.meanings.length === 0) {
        return this.fallbackTranslateLookup(clean, options?.signal);
      }

      const meanings: DictionaryMeaningGroup[] = parsed.meanings.map((m, idx) => {
        const pos = m.partOfSpeech?.toLowerCase() || "other";
        const defs: DictionarySenseDefinition[] = (m.definitions || []).map((d, dIdx) => ({
          id: `${clean}-${pos}-${idx}-${dIdx + 1}`,
          definition: d.definitionEn || "",
          definitionEn: d.definitionEn || "",
          definitionVi: d.definitionVi,
          example: d.exampleEn,
          exampleEn: d.exampleEn,
          exampleVi: d.exampleVi,
          synonyms: Array.isArray(d.synonyms) ? d.synonyms.slice(0, 4) : [],
          antonyms: Array.isArray(d.antonyms) ? d.antonyms.slice(0, 4) : [],
        }));

        return {
          partOfSpeech: pos,
          vietnameseSummary: m.vietnameseSummary,
          definitions: defs,
          synonyms: [],
          antonyms: [],
        };
      });

      return {
        word: parsed.word || clean,
        normalizedWord: clean.toLowerCase(),
        ipa: parsed.ipa,
        phonetics: parsed.ipa
          ? [
              {
                text: parsed.ipa,
                region: "general",
              },
            ]
          : [],
        meanings,
        primaryVietnamese: parsed.primaryVietnamese,
        collocations: Array.isArray(parsed.collocations) ? parsed.collocations.slice(0, 6) : [],
        wordForms: [],
        source: "ai-enriched",
        timestamp: Date.now(),
      };
    } catch {
      return this.fallbackTranslateLookup(clean, options?.signal);
    }
  }

  async translateContext(
    word: string,
    sentence: string,
    signal?: AbortSignal
  ): Promise<ContextualTranslationResult> {
    const cleanWord = word.trim();
    const cleanSentence = sentence.trim();

    if (!cleanWord || !cleanSentence) {
      throw new Error("Từ và câu ngữ cảnh không được để trống.");
    }

    if (getAiApiKey()) {
      try {
        const prompt = `Phân tích từ "${cleanWord}" trong câu ngữ cảnh tiếng Anh sau:\n"${cleanSentence}"\n\nHãy xuất ra JSON hợp lệ (không kèm markdown ngoài json):
{
  "detectedPos": "từ loại trong câu (noun, verb, adjective, adverb, ...)",
  "selectedMeaningVi": "nghĩa tiếng Việt chính xác nhất của từ này TRONG CÂU TRÊN",
  "explanationVi": "giải thích ngắn gọn (1-2 câu) lý do tại sao mang nghĩa này trong ngữ cảnh này",
  "highlightPhrase": "từ hoặc cụm từ tương ứng trong câu",
  "suggestedExampleEn": "một câu ví dụ khác tương tự dùng đúng nghĩa này",
  "suggestedExampleVi": "bản dịch tiếng Việt của câu ví dụ"
}`;

        const reply = await request<string>(
          { input: prompt },
          signal ?? AbortSignal.timeout(8000)
        );

        const jsonStr = extractJsonString(reply);
        if (jsonStr) {
          const parsed = JSON.parse(jsonStr) as {
            detectedPos?: string;
            selectedMeaningVi?: string;
            explanationVi?: string;
            highlightPhrase?: string;
            suggestedExampleEn?: string;
            suggestedExampleVi?: string;
          };

          if (parsed && parsed.selectedMeaningVi) {
            return {
              word: cleanWord,
              sentence: cleanSentence,
              detectedPos: parsed.detectedPos,
              selectedMeaningVi: parsed.selectedMeaningVi,
              explanationVi: parsed.explanationVi,
              highlightPhrase: parsed.highlightPhrase || cleanWord,
              suggestedExampleEn: parsed.suggestedExampleEn,
              suggestedExampleVi: parsed.suggestedExampleVi,
            };
          }
        }
      } catch {
        // Fall back below
      }
    }

    // Fallback: translate the word and the sentence
    const [wordVi, sentenceVi] = await Promise.all([
      translateToVietnamese(cleanWord, signal),
      translateToVietnamese(cleanSentence, signal),
    ]);

    return {
      word: cleanWord,
      sentence: cleanSentence,
      selectedMeaningVi: wordVi || cleanWord,
      explanationVi: sentenceVi ? `Bản dịch của cả câu: "${sentenceVi}"` : undefined,
      highlightPhrase: cleanWord,
    };
  }

  private async fallbackTranslateLookup(
    clean: string,
    signal?: AbortSignal
  ): Promise<DictionaryResult | null> {
    const viMeaning = await translateToVietnamese(clean, signal);
    if (!viMeaning || viMeaning.trim().toLowerCase() === clean.toLowerCase()) return null;

    return {
      word: clean,
      normalizedWord: clean.toLowerCase(),
      primaryVietnamese: viMeaning,
      phonetics: [],
      meanings: [
        {
          partOfSpeech: "general",
          vietnameseSummary: viMeaning,
          definitions: [
            {
              id: `${clean.toLowerCase()}-general-1`,
              definitionEn: `Meaning of "${clean}" in English`,
              definitionVi: viMeaning,
              synonyms: [],
              antonyms: [],
            },
          ],
          synonyms: [],
          antonyms: [],
        },
      ],
      collocations: [],
      wordForms: [],
      source: "fallback",
      timestamp: Date.now(),
    };
  }
}

function extractJsonString(text: string): string | null {
  if (!text) return null;
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  return text.substring(start, end + 1);
}
