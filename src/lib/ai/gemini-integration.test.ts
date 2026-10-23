import { describe, it, expect } from "vitest";
import { request } from "./responsesClient";
import { evaluateWriting } from "./sentence-practice";
import { getWritingAssistantResponse } from "./writing-assistant";
import { generateAiQuiz } from "./quiz";
import { importVocabulary } from "./import-vocabulary";
import { AdminHealthRepository } from "../../repositories/admin/health.repository";

describe.sequential("Gemini AI Integration", () => {
  it("should ping Gemini AI health check successfully", async () => {
    const health = await AdminHealthRepository.checkAiProvider();
    expect(health.status).toBe("healthy");
    expect(health.service).toBe("Gemini AI");
  }, 20000);

  it("should generate a simple text response via responsesClient", async () => {
    const res = await request<string>({ input: "Reply with the single word: HELLO" });
    expect(typeof res).toBe("string");
    expect(res.toUpperCase()).toContain("HELLO");
  }, 25000);

  it("should provide writing assistant hint", async () => {
    const hint = await getWritingAssistantResponse({
      type: "hint",
      targetWord: "diligent",
      language: "vi",
    });
    expect(typeof hint).toBe("string");
    expect((hint as string).length).toBeGreaterThan(5);
  }, 25000);

  it("should evaluate a sentence correctly", async () => {
    const feedback = await evaluateWriting("diligent", "She is a diligent student who always finishes her homework on time.");
    expect(feedback.usedTargetWord).toBe(true);
    expect(feedback.feedback).toBeDefined();
    expect(Array.isArray(feedback.mistakes)).toBe(true);
  }, 35000);

  it("should generate AI quiz questions", async () => {
    const items = [
      { id: "1", word: "meticulous", meaning: "tỉ mỉ, cẩn thận", partOfSpeech: "adjective", srsLevel: 1 },
      { id: "2", word: "ubiquitous", meaning: "phổ biến khắp nơi", partOfSpeech: "adjective", srsLevel: 1 },
      { id: "3", word: "ephemeral", meaning: "phù du, chóng tàn", partOfSpeech: "adjective", srsLevel: 1 },
      { id: "4", word: "pragmatic", meaning: "thực dụng, thực tế", partOfSpeech: "adjective", srsLevel: 1 },
      { id: "5", word: "resilient", meaning: "kiên cường", partOfSpeech: "adjective", srsLevel: 1 },
      { id: "6", word: "innovate", meaning: "đổi mới, sáng tạo", partOfSpeech: "verb", srsLevel: 1 },
      { id: "7", word: "empathy", meaning: "sự thấu cảm", partOfSpeech: "noun", srsLevel: 1 },
      { id: "8", word: "candid", meaning: "thẳng thắn, bộc trực", partOfSpeech: "adjective", srsLevel: 1 },
    ];
    const quiz = await generateAiQuiz(items);
    expect(quiz.title).toBeDefined();
    expect(quiz.questions.length).toBeGreaterThan(0);
    expect(quiz.questions[0].word).toBeDefined();
    expect(quiz.questions[0].options.length).toBe(4);
  }, 35000);

  it("should import vocabulary from plain text", async () => {
    const vocabList = await importVocabulary("apple: quả táo\nbanana: quả chuối");
    expect(vocabList.length).toBeGreaterThanOrEqual(1);
    expect(vocabList.some((item) => item.word.toLowerCase().includes("apple"))).toBe(true);
  }, 30000);

  it("should generate vocabulary by topic with options", async () => {
    const vocabList = await importVocabulary({
      prompt: "IELTS Environment",
      mode: "topic",
      count: 5,
      level: "B1-B2",
    });
    expect(vocabList.length).toBeGreaterThanOrEqual(3);
    expect(vocabList[0].word).toBeDefined();
    expect(vocabList[0].meaning).toBeDefined();
    expect(vocabList[0].ipa).toBeDefined();
  }, 35000);

  it("should extract vocabulary from a reading passage", async () => {
    const passage =
      "Artificial intelligence is rapidly transforming modern workplaces. Rather than making workers obsolete, it serves as an indispensable tool.";
    const vocabList = await importVocabulary({
      prompt: passage,
      mode: "passage",
      count: 3,
    });
    expect(vocabList.length).toBeGreaterThanOrEqual(1);
    expect(vocabList[0].word).toBeDefined();
    expect(vocabList[0].meaning).toBeDefined();
  }, 35000);
});
