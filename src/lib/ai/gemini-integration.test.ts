// src/lib/ai/gemini-integration.test.ts
import { describe, it, expect } from "vitest";
import { request } from "./responsesClient";
import { evaluateWriting } from "./sentence-practice";
import { getWritingAssistantResponse } from "./writing-assistant";
import { generateAiQuiz } from "./quiz";
import { importVocabulary } from "./import-vocabulary";
import { AdminHealthRepository } from "../../repositories/admin/health.repository";

const shouldRunLive = process.env.RUN_LIVE_AI_TESTS === "true";

describe.sequential("Cloudflare Workers AI Integration", () => {
  it("should ping AI health check successfully", async () => {
    const health = await AdminHealthRepository.checkAiProvider();
    expect(["healthy", "degraded"]).toContain(health.status);
    expect(health.service).toBe("Cloudflare Workers AI");
  }, 20000);

  it("should generate a simple text response via responsesClient", async () => {
    if (!shouldRunLive) {
      console.log("Skipping live AI generation call. Set RUN_LIVE_AI_TESTS=true to enable.");
      return;
    }
    const res = await request<string>({ input: "Reply with the single word: HELLO" });
    expect(typeof res).toBe("string");
    expect(res.toUpperCase()).toContain("HELLO");
  }, 25000);

  it("should provide writing assistant hint", async () => {
    if (!shouldRunLive) return;
    const hint = await getWritingAssistantResponse({
      type: "hint",
      targetWord: "diligent",
      language: "vi",
    });
    expect(typeof hint).toBe("string");
    expect((hint as string).length).toBeGreaterThan(5);
  }, 25000);

  it("should evaluate a sentence correctly", async () => {
    if (!shouldRunLive) return;
    const feedback = await evaluateWriting(
      "diligent",
      "She is a diligent student who always finishes her homework on time."
    );
    expect(feedback.usedTargetWord).toBe(true);
    expect(feedback.feedback).toBeDefined();
    expect(Array.isArray(feedback.mistakes)).toBe(true);
  }, 35000);

  it("should generate AI quiz questions", async () => {
    if (!shouldRunLive) return;
    const items = [
      { id: "1", word: "meticulous", meaning: "tỉ mỉ, cẩn thận", partOfSpeech: "adjective", srsLevel: 1 },
      { id: "2", word: "ubiquitous", meaning: "phổ biến khắp nơi", partOfSpeech: "adjective", srsLevel: 1 },
    ];
    const quiz = await generateAiQuiz(items);
    expect(quiz.title).toBeDefined();
    expect(quiz.questions.length).toBeGreaterThan(0);
    expect(quiz.questions[0].word).toBeDefined();
    expect(quiz.questions[0].options.length).toBe(4);
  }, 35000);

  it("should import vocabulary from plain text", async () => {
    if (!shouldRunLive) return;
    const vocabList = await importVocabulary({
      prompt: "apple: quả táo\nbanana: quả chuối",
      mode: "words",
      count: 2,
    });
    expect(vocabList.length).toBeGreaterThanOrEqual(1);
    expect(vocabList.some((item) => item.word.toLowerCase().includes("apple"))).toBe(true);
  }, 30000);
});
