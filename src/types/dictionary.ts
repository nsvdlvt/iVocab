import { z } from "zod";

export const DictionaryPhoneticSchema = z.object({
  text: z.string().optional(),
  audio: z.string().optional(),
  region: z.enum(["uk", "us", "general"]).default("general"),
});
export type DictionaryPhonetic = z.infer<typeof DictionaryPhoneticSchema>;

export const DictionarySenseDefinitionSchema = z.object({
  id: z.string(),
  definition: z.string().optional(), // Alias for definitionEn
  definitionEn: z.string(),
  definitionVi: z.string().optional(),
  example: z.string().optional(), // Alias for exampleEn
  exampleEn: z.string().optional(),
  exampleVi: z.string().optional(),
  synonyms: z.array(z.string()).default([]),
  antonyms: z.array(z.string()).default([]),
});
export type DictionarySenseDefinition = z.infer<typeof DictionarySenseDefinitionSchema>;

export const DictionaryMeaningGroupSchema = z.object({
  partOfSpeech: z.string(),
  vietnameseSummary: z.string().optional(),
  definitions: z.array(DictionarySenseDefinitionSchema).default([]),
  synonyms: z.array(z.string()).default([]),
  antonyms: z.array(z.string()).default([]),
});
export type DictionaryMeaningGroup = z.infer<typeof DictionaryMeaningGroupSchema>;

export const DictionaryResultSchema = z.object({
  word: z.string(),
  normalizedWord: z.string(),
  ipa: z.string().optional(),
  ipaUk: z.string().optional(),
  ipaUs: z.string().optional(),
  phonetics: z.array(DictionaryPhoneticSchema).default([]),
  audioUk: z.string().optional(),
  audioUs: z.string().optional(),
  meanings: z.array(DictionaryMeaningGroupSchema).default([]),
  primaryVietnamese: z.string().optional(),
  collocations: z.array(z.string()).default([]),
  wordForms: z.array(z.object({
    form: z.string(),
    label: z.string(),
  })).default([]),
  source: z.enum(["free-dict", "datamuse", "ai-enriched", "custom", "fallback"]),
  timestamp: z.number().default(() => Date.now()),
});
export type DictionaryResult = z.infer<typeof DictionaryResultSchema>;

export const ContextualTranslationRequestSchema = z.object({
  word: z.string().min(1).max(100),
  sentence: z.string().min(1).max(2000),
});
export type ContextualTranslationRequest = z.infer<typeof ContextualTranslationRequestSchema>;

export const ContextualTranslationResultSchema = z.object({
  word: z.string(),
  sentence: z.string(),
  detectedPos: z.string().optional(),
  selectedMeaningVi: z.string(),
  explanationVi: z.string().optional(),
  highlightPhrase: z.string().optional(),
  suggestedExampleEn: z.string().optional(),
  suggestedExampleVi: z.string().optional(),
});
export type ContextualTranslationResult = z.infer<typeof ContextualTranslationResultSchema>;

export const DictionarySuggestionSchema = z.object({
  word: z.string(),
  score: z.number().optional(),
});
export type DictionarySuggestion = z.infer<typeof DictionarySuggestionSchema>;

export const SaveWordRequestSchema = z.object({
  setId: z.string().trim().min(1, "ID bộ từ không được để trống").max(50, "ID bộ từ không hợp lệ"),
  word: z.string().trim().min(1, "Từ không được để trống").max(100),
  meaning: z.string().trim().min(1, "Nghĩa không được để trống").max(2000),
  partOfSpeech: z.string().max(50).nullish().transform((val) => val?.trim() || "noun"),
  ipa: z.string().max(200).nullish().transform((val) => val?.trim() || undefined),
  example: z.string().max(2000).nullish().transform((val) => val?.trim() || undefined),
  exampleTranslation: z.string().max(2000).nullish().transform((val) => val?.trim() || undefined),
  synonyms: z.array(z.string()).default([]),
  forceUpdate: z.boolean().default(false),
});
export type SaveWordRequest = z.infer<typeof SaveWordRequestSchema>;
