import { z } from "zod";

export const KeyVocabularyItemSchema = z.object({
  word: z.string(),
  meaning: z.string(),
  ipa: z.string().optional(),
  partOfSpeech: z.string().optional(),
  example: z.string().optional(),
  note: z.string().optional(),
});
export type KeyVocabularyItem = z.infer<typeof KeyVocabularyItemSchema>;

export const IdiomOrPhraseItemSchema = z.object({
  phrase: z.string(),
  meaning: z.string(),
  explanation: z.string(),
});
export type IdiomOrPhraseItem = z.infer<typeof IdiomOrPhraseItemSchema>;

export const AlternativeTranslationItemSchema = z.object({
  phrase: z.string(),
  alternatives: z.array(z.string()),
  nuance: z.string(),
});
export type AlternativeTranslationItem = z.infer<typeof AlternativeTranslationItemSchema>;

export const TranslationRequestSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập văn bản cần dịch")
    .max(5000, "Văn bản không được vượt quá 5000 ký tự"),
  sourceLang: z.enum(["auto", "en", "vi"]).default("auto"),
  targetLang: z.enum(["en", "vi"]).default("vi"),
  includeLearningAnalysis: z.boolean().default(true),
});
export type TranslationRequest = z.infer<typeof TranslationRequestSchema>;

export const TranslationResponseDataSchema = z.object({
  translatedText: z.string(),
  detectedSourceLang: z.enum(["en", "vi"]).optional(),
  sourceLang: z.enum(["auto", "en", "vi"]),
  targetLang: z.enum(["en", "vi"]),
  keyVocabulary: z.array(KeyVocabularyItemSchema).default([]),
  idiomsAndPhrases: z.array(IdiomOrPhraseItemSchema).default([]),
  alternativeTranslations: z.array(AlternativeTranslationItemSchema).default([]),
});
export type TranslationResponseData = z.infer<typeof TranslationResponseDataSchema>;
