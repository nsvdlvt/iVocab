import { describe, it, expect } from "vitest";
import {
  assessPronunciation,
  generateMascotFeedback,
} from "./azure-speech";

describe("Azure Speech Pronunciation Assessment", () => {
  it("should generate motivational mascot feedback appropriately", () => {
    expect(generateMascotFeedback(95, 95)).toContain("Phát âm xuất sắc");
    expect(generateMascotFeedback(82, 80)).toContain("Làm tốt lắm");
    expect(generateMascotFeedback(70, 70)).toContain("Khá tốt");
    expect(generateMascotFeedback(50, 50)).toContain("Đừng nản lòng");
  });

  it("should return fallback demo assessment when API key is missing", async () => {
    const dummyBuffer = Buffer.from("dummy-audio-content");
    const result = await assessPronunciation(dummyBuffer, "diligent");

    expect(result).toBeDefined();
    expect(result.isDemo).toBe(true);
    expect(result.overallScore).toBeGreaterThanOrEqual(60);
    expect(result.referenceText).toBe("diligent");
    expect(result.words.length).toBeGreaterThan(0);
    expect(result.words[0].word).toBe("diligent");
  });

  it("should handle multi-word sentences in demo mode", async () => {
    const dummyBuffer = Buffer.from("dummy-audio-content");
    const sentence = "Learning English is fun and rewarding.";
    const result = await assessPronunciation(dummyBuffer, sentence);

    expect(result.isDemo).toBe(true);
    expect(result.words.length).toBe(6);
    expect(result.words[0].word).toBe("Learning");
    expect(result.words[0].phonemes).toBeDefined();
    expect(result.words[0].phonemes!.length).toBeGreaterThan(0);
  });
});
