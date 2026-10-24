import { describe, it, expect } from "vitest";
import {
  SaveWordRequestSchema,
  ContextualTranslationRequestSchema,
  DictionaryResultSchema,
} from "@/types/dictionary";
import { normalizeVocabularyWord } from "@/lib/validation/vocabulary-duplicates";

describe("Dictionary Schemas & Duplicate Validation", () => {
  it("should normalize vocabulary word correctly for duplicate checking", () => {
    expect(normalizeVocabularyWord("  Eloquent  ")).toBe("eloquent");
    expect(normalizeVocabularyWord("BREAK   the   ICE")).toBe("break the ice");
    expect(normalizeVocabularyWord("well-known")).toBe("well-known");
  });

  it("should validate a complete SaveWordRequest with nanoid setId and UUID setId", () => {
    const validNanoidPayload = {
      setId: "vs_K3X9A2M1",
      word: "transport",
      meaning: "vận chuyển; phương tiện giao thông",
      partOfSpeech: "VERB",
      ipa: "/trænspˈɔrt/",
      example: "The transport of goods is not included in the price given on the website.",
      exampleTranslation: "Việc vận chuyển hàng hóa không được bao gồm.",
      synonyms: ["carry", "convey"],
      forceUpdate: false,
    };

    const parsedNanoid = SaveWordRequestSchema.safeParse(validNanoidPayload);
    expect(parsedNanoid.success).toBe(true);
    if (parsedNanoid.success) {
      expect(parsedNanoid.data.setId).toBe("vs_K3X9A2M1");
      expect(parsedNanoid.data.word).toBe("transport");
      expect(parsedNanoid.data.partOfSpeech).toBe("VERB");
    }

    const validUuidPayload = {
      setId: "123e4567-e89b-12d3-a456-426614174000",
      word: "eloquent",
      meaning: "hùng biện, lưu loát",
      partOfSpeech: "adjective",
      ipa: "/ˈɛləkwənt/",
      example: "An eloquent speaker.",
      exampleTranslation: "Một diễn giả hùng biện.",
      synonyms: ["fluent", "articulate"],
      forceUpdate: false,
    };

    const parsedUuid = SaveWordRequestSchema.safeParse(validUuidPayload);
    expect(parsedUuid.success).toBe(true);
  });

  it("should reject SaveWordRequest with empty word, empty meaning or empty setId", () => {
    const invalidPayload = {
      setId: "",
      word: "",
      meaning: "",
    };

    const parsed = SaveWordRequestSchema.safeParse(invalidPayload);
    expect(parsed.success).toBe(false);
  });

  it("should validate ContextualTranslationRequest", () => {
    const valid = {
      word: "run",
      sentence: "He runs a software business in California.",
    };
    expect(ContextualTranslationRequestSchema.safeParse(valid).success).toBe(true);

    const empty = {
      word: "",
      sentence: "Sentence",
    };
    expect(ContextualTranslationRequestSchema.safeParse(empty).success).toBe(false);
  });

  it("should parse DictionaryResultSchema with all fields", () => {
    const result = {
      word: "eloquent",
      normalizedWord: "eloquent",
      ipa: "/ˈɛləkwənt/",
      phonetics: [
        {
          text: "/ˈɛləkwənt/",
          audio: "https://example.com/audio.mp3",
          region: "uk" as const,
        },
      ],
      meanings: [
        {
          partOfSpeech: "adjective",
          definitions: [
            {
              id: "def-1",
              definitionEn: "Expressive.",
              synonyms: [],
              antonyms: [],
            },
          ],
          synonyms: [],
          antonyms: [],
        },
      ],
      collocations: ["eloquent speech"],
      wordForms: [],
      source: "free-dict" as const,
    };

    const parsed = DictionaryResultSchema.safeParse(result);
    expect(parsed.success).toBe(true);
  });
});
