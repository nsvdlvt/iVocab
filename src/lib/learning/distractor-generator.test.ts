import { describe, it, expect } from "vitest";
import { generateDistractors, formatCompactMeaning } from "./distractor-generator";
import { VocabularyRow } from "./question-types";

describe("distractor-generator", () => {
  describe("formatCompactMeaning", () => {
    it("handles basic meaning cleanly", () => {
      expect(formatCompactMeaning("tùy cơ ứng biến")).toBe("tùy cơ ứng biến");
    });

    it("strips grammatical part of speech prefixes", () => {
      expect(formatCompactMeaning("(idm) tùy cơ ứng biến")).toBe("tùy cơ ứng biến");
      expect(formatCompactMeaning("(v) phân bổ tiền")).toBe("phân bổ tiền");
    });

    it("formats multiple semicolons appropriately", () => {
      expect(formatCompactMeaning("thỉnh thoảng; không liên tục")).toBe("thỉnh thoảng; không liên tục");
      expect(
        formatCompactMeaning("tự cao; trịch thượng; coi thường người khác và không hòa đồng")
      ).toBe("tự cao; trịch thượng");
    });

    it("returns empty string on empty or null input", () => {
      expect(formatCompactMeaning(null)).toBe("");
      expect(formatCompactMeaning("")).toBe("");
      expect(formatCompactMeaning("   ")).toBe("");
    });
  });

  describe("generateDistractors", () => {
    const mockWord: VocabularyRow = {
      id: "w1",
      owner_id: "u1",
      set_id: "s1",
      word: "play it by ear",
      meaning: "tùy cơ ứng biến",
      part_of_speech: "idiom",
      ipa: "/pleɪ ɪt baɪ ɪə/",
      example: "Let's play it by ear.",
      example_translation: "Hãy tùy cơ ứng biến.",
      synonyms: ["improvise"],
      antonyms: null,
      note: null,
      image_url: null,
      audio_url: null,
      difficulty: "medium",
      source: null,
      deleted_at: null,
      fts_vector: null,
      is_starred: false,
      created_at: "2026-01-01",
      updated_at: "2026-01-01",
    };

    const mockPool: VocabularyRow[] = [
      mockWord,
      {
        ...mockWord,
        id: "w2",
        word: "on and off",
        meaning: "thỉnh thoảng; không liên tục",
      },
      {
        ...mockWord,
        id: "w3",
        word: "high and mighty",
        meaning: "tự cao; trịch thượng",
      },
      {
        ...mockWord,
        id: "w4",
        word: "bite the bullet",
        meaning: "cắn răng chịu đựng",
      },
      {
        ...mockWord,
        id: "w5",
        word: "break the ice",
        meaning: "phá vỡ sự ngại ngùng",
      },
    ];

    it("attaches english text and vietnamese meaning to all generated options", () => {
      const options = generateDistractors(mockWord, "vi-en", mockPool);
      expect(options.length).toBeGreaterThanOrEqual(4);

      const correctOpt = options.find((o) => o.isCorrect);
      expect(correctOpt).toBeDefined();
      expect(correctOpt?.english).toBe("play it by ear");
      expect(correctOpt?.meaning).toBe("tùy cơ ứng biến");
      expect(correctOpt?.text).toBe("play it by ear");

      // Verify each distractor option has english and meaning
      for (const opt of options) {
        expect(opt.id).toBeDefined();
        expect(opt.english).toBeTruthy();
        expect(opt.meaning).toBeTruthy();
      }
    });

    it("generates correct options in en-vi direction with english and meaning retained", () => {
      const options = generateDistractors(mockWord, "en-vi", mockPool);
      const correctOpt = options.find((o) => o.isCorrect);
      expect(correctOpt?.text).toBe("tùy cơ ứng biến");
      expect(correctOpt?.english).toBe("play it by ear");
      expect(correctOpt?.meaning).toBe("tùy cơ ứng biến");
    });
  });
});
