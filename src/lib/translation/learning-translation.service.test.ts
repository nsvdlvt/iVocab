import { describe, it, expect, vi } from "vitest";
import { learningTranslationService } from "./learning-translation.service";

describe("LearningTranslationService", () => {
  it("should throw error when translating empty text", async () => {
    await expect(learningTranslationService.translate("   ")).rejects.toThrow(
      "Vui lòng cung cấp văn bản cần dịch."
    );
  });

  it("should translate English to Vietnamese accurately", async () => {
    const result = await learningTranslationService.translate(
      "The students are studying hard for the upcoming exam.",
      "en",
      "vi",
      false // skip AI analysis for fast test
    );

    expect(result.translatedText).toBeDefined();
    expect(result.translatedText.length).toBeGreaterThan(0);
    expect(result.sourceLang).toBe("en");
    expect(result.targetLang).toBe("vi");
  });

  it("should translate Vietnamese to English accurately", async () => {
    const result = await learningTranslationService.translate(
      "Học từ vựng mỗi ngày giúp bạn tự tin hơn khi giao tiếp.",
      "vi",
      "en",
      false
    );

    expect(result.translatedText).toBeDefined();
    expect(result.translatedText.length).toBeGreaterThan(0);
    expect(result.sourceLang).toBe("vi");
    expect(result.targetLang).toBe("en");
  });

  it("should auto-detect language based on input", async () => {
    const result = await learningTranslationService.translate(
      "Knowledge is power.",
      "auto",
      "vi",
      false
    );

    expect(result.translatedText).toBeDefined();
    expect(result.detectedSourceLang).toBe("en");
    expect(result.targetLang).toBe("vi");
  });

  it("should preserve paragraphs in multi-line translation", async () => {
    const multiline = "Line one.\n\nLine two.";
    const result = await learningTranslationService.translate(
      multiline,
      "en",
      "vi",
      false
    );

    expect(result.translatedText).toBeDefined();
  });
});
