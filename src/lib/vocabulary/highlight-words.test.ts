import { describe, it, expect } from "vitest";
import {
  getEnglishWordVariants,
  getVietnameseMeaningCandidates,
  highlightEnglishExample,
  highlightVietnameseTranslation,
} from "./highlight-words";

describe("highlight-words", () => {
  describe("getEnglishWordVariants", () => {
    it("generates regular plural, past tense, present participle, and adverb forms", () => {
      const variants = getEnglishWordVariants("reluctant");
      expect(variants).toContain("reluctant");
      expect(variants).toContain("reluctantly");
    });

    it("generates irregular verb forms for common irregulars", () => {
      const variants = getEnglishWordVariants("take");
      expect(variants).toContain("takes");
      expect(variants).toContain("took");
      expect(variants).toContain("taken");
      expect(variants).toContain("taking");
    });

    it("generates inflected head for multi-word expressions", () => {
      const variants = getEnglishWordVariants("take for granted");
      expect(variants).toContain("take for granted");
      expect(variants).toContain("took for granted");
      expect(variants).toContain("takes for granted");
      expect(variants).toContain("taking for granted");
    });
  });

  describe("getVietnameseMeaningCandidates", () => {
    it("strips POS labels and splits by commas and conjunctions", () => {
      const candidates = getVietnameseMeaningCandidates("(adj) miễn cưỡng, không sẵn lòng");
      expect(candidates).toContain("miễn cưỡng");
      expect(candidates).toContain("không sẵn lòng");
    });

    it("handles noun prefixes by providing both full and base phrase", () => {
      const candidates = getVietnameseMeaningCandidates("sự phát triển vượt bậc");
      expect(candidates).toContain("sự phát triển vượt bậc");
      expect(candidates).toContain("phát triển vượt bậc");
    });
  });

  describe("highlightEnglishExample", () => {
    it("highlights the exact target word", () => {
      const sentence = "She was reluctant to share her opinion.";
      const chunks = highlightEnglishExample(sentence, "reluctant");

      expect(chunks).toEqual([
        { text: "She was ", isHighlighted: false },
        { text: "reluctant", isHighlighted: true },
        { text: " to share her opinion.", isHighlighted: false },
      ]);
    });

    it("does NOT match arbitrary substrings (art vs article)", () => {
      const sentence = "This article discusses the value of art in modern society.";
      const chunks = highlightEnglishExample(sentence, "art");

      // "article" must NOT be highlighted, only "art"
      const highlightedWords = chunks.filter((c) => c.isHighlighted).map((c) => c.text);
      expect(highlightedWords).toEqual(["art"]);
      expect(highlightedWords).not.toContain("article");
    });

    it("handles capitalization and punctuation correctly", () => {
      const sentence = "Reluctant, she stepped forward.";
      const chunks = highlightEnglishExample(sentence, "reluctant");

      expect(chunks[0]).toEqual({ text: "Reluctant", isHighlighted: true });
      expect(chunks[1]).toEqual({ text: ", she stepped forward.", isHighlighted: false });
    });

    it("supports target words appearing more than once in a sentence", () => {
      const sentence = "One apple a day keeps the doctor away; another apple for tomorrow.";
      const chunks = highlightEnglishExample(sentence, "apple");

      const highlighted = chunks.filter((c) => c.isHighlighted);
      expect(highlighted).toHaveLength(2);
      expect(highlighted[0].text).toBe("apple");
      expect(highlighted[1].text).toBe("apple");
    });

    it("highlights inflected forms such as reluctantly", () => {
      const sentence = "He agreed reluctantly to the proposed schedule.";
      const chunks = highlightEnglishExample(sentence, "reluctant");

      expect(chunks).toEqual([
        { text: "He agreed ", isHighlighted: false },
        { text: "reluctantly", isHighlighted: true },
        { text: " to the proposed schedule.", isHighlighted: false },
      ]);
    });

    it("highlights multi-word vocabulary items as a complete phrase", () => {
      // In the case of contiguous phrase:
      const phraseSentence = "Never take for granted the people who love you.";
      const phraseChunks = highlightEnglishExample(phraseSentence, "take for granted");

      expect(phraseChunks).toEqual([
        { text: "Never ", isHighlighted: false },
        { text: "take for granted", isHighlighted: true },
        { text: " the people who love you.", isHighlighted: false },
      ]);
    });
  });

  describe("highlightVietnameseTranslation", () => {
    it("highlights the corresponding translated phrase from the meaning", () => {
      const translation = "Cô ấy miễn cưỡng chia sẻ ý kiến của mình.";
      const meaning = "miễn cưỡng, không sẵn lòng";
      const chunks = highlightVietnameseTranslation(translation, meaning);

      expect(chunks).toEqual([
        { text: "Cô ấy ", isHighlighted: false },
        { text: "miễn cưỡng", isHighlighted: true },
        { text: " chia sẻ ý kiến của mình.", isHighlighted: false },
      ]);
    });

    it("matches the second candidate if the first does not appear", () => {
      const translation = "Anh ấy hoàn toàn không sẵn lòng hỗ trợ chúng tôi.";
      const meaning = "miễn cưỡng, không sẵn lòng";
      const chunks = highlightVietnameseTranslation(translation, meaning);

      expect(chunks).toEqual([
        { text: "Anh ấy hoàn toàn ", isHighlighted: false },
        { text: "không sẵn lòng", isHighlighted: true },
        { text: " hỗ trợ chúng tôi.", isHighlighted: false },
      ]);
    });

    it("preserves translation without applying an incorrect highlight if no candidate matches reliably", () => {
      const translation = "Cô ấy từ chối tham gia dự án vào phút chót.";
      const meaning = "miễn cưỡng, không sẵn lòng";
      const chunks = highlightVietnameseTranslation(translation, meaning);

      // No incorrect highlight applied! Whole sentence preserved unhighlighted.
      expect(chunks).toEqual([
        { text: "Cô ấy từ chối tham gia dự án vào phút chót.", isHighlighted: false },
      ]);
      expect(chunks.some((c) => c.isHighlighted)).toBe(false);
    });

    it("handles Vietnamese diacritics and word boundaries correctly without partial syllable matches", () => {
      const translation = "Họ đã phát triển một phương pháp học tập mới.";
      const meaning = "phát triển";
      const chunks = highlightVietnameseTranslation(translation, meaning);

      expect(chunks).toEqual([
        { text: "Họ đã ", isHighlighted: false },
        { text: "phát triển", isHighlighted: true },
        { text: " một phương pháp học tập mới.", isHighlighted: false },
      ]);
    });
  });
});
