import { describe, expect, it } from "vitest";
import { checkEnglishAnswer, checkVietnameseAnswer, normalizeEnglishAnswer, normalizeVietnameseAnswer } from "./answer-checker";

describe("answer-checker", () => {
  describe("normalizeEnglishAnswer", () => {
    it("trims and collapses whitespace without changing letter content", () => {
      expect(normalizeEnglishAnswer("  con  stituent ")).toBe("con stituent");
    });
  });

  describe("checkEnglishAnswer", () => {
    it("accepts only exact English matches after case and whitespace normalization", () => {
      expect(checkEnglishAnswer("Constituent", "constituent")).toBe("correct");
      expect(checkEnglishAnswer("  constituent  ", "constituent")).toBe("correct");
      expect(checkEnglishAnswer("constituentt", "constituent")).toBe("wrong");
      expect(checkEnglishAnswer("constituen", "constituent")).toBe("wrong");
      expect(checkEnglishAnswer("component", "constituent")).toBe("wrong");
    });
  });

  describe("normalizeVietnameseAnswer", () => {
    it("removes accents and normalizes spacing", () => {
      expect(normalizeVietnameseAnswer("  Thành   phần  ")).toBe("thanh phan");
    });
  });

  describe("checkVietnameseAnswer", () => {
    it("accepts answers that match at least two meaningful Vietnamese keywords", () => {
      expect(checkVietnameseAnswer("thành phần", "thành phần cấu tạo")).toBe("correct");
      expect(checkVietnameseAnswer("cấu tạo", "thành phần cấu tạo")).toBe("correct");
      expect(checkVietnameseAnswer("là thành phần cấu tạo", "thành phần cấu tạo")).toBe("correct");
      expect(checkVietnameseAnswer("một thành phần cấu tạo", "thành phần cấu tạo")).toBe("correct");
      expect(checkVietnameseAnswer("thành phần của cái gì đó", "thành phần cấu tạo")).toBe("correct");
    });

    it("rejects partial or unrelated Vietnamese answers", () => {
      expect(checkVietnameseAnswer("cấu", "thành phần cấu tạo")).toBe("wrong");
      expect(checkVietnameseAnswer("thành", "thành phần cấu tạo")).toBe("wrong");
      expect(checkVietnameseAnswer("bộ phận", "thành phần cấu tạo")).toBe("wrong");
      expect(checkVietnameseAnswer("không liên quan", "thành phần cấu tạo")).toBe("wrong");
    });

    it("accepts configured Vietnamese synonyms", () => {
      expect(checkVietnameseAnswer("bộ phận", "thành phần cấu tạo", { synonyms: ["bộ phận"] })).toBe("correct");
    });

    it("requires exact matching when only one meaningful word exists", () => {
      expect(checkVietnameseAnswer("dốc", "dốc")).toBe("correct");
      expect(checkVietnameseAnswer("rất dốc", "dốc")).toBe("correct");
      expect(checkVietnameseAnswer("đường dốc", "dốc")).toBe("correct");
      expect(checkVietnameseAnswer("đường thẳng", "dốc")).toBe("wrong");
    });
  });
});
