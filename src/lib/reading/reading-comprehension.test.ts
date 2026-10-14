import { describe, it, expect } from "vitest";
import { getQuestionsForArticle, DEFAULT_READING_QUESTIONS } from "./reading-questions";
import { parseParagraphDrafts, slugifyReadingTitle } from "./reading-editor";

describe("Reading Comprehension Question Store", () => {
  it("should have curated questions for all primary seed articles", () => {
    const knownSlugs = [
      "the-rise-of-smart-cities",
      "how-communities-respond-to-climate-change",
      "why-active-learning-sticks-better",
      "the-new-rules-of-wellness",
      "what-the-future-workplace-might-look-like",
      "hanoi-s-green-transition-a-new-era-for-urban-transport",
    ];

    for (const slug of knownSlugs) {
      const questions = getQuestionsForArticle(slug);
      expect(questions.length).toBeGreaterThanOrEqual(2);

      questions.forEach((q) => {
        expect(q.id).toBeDefined();
        expect(q.question.length).toBeGreaterThan(5);
        expect(q.options.length).toBeGreaterThanOrEqual(3);
        expect(q.correctAnswer).toBeGreaterThanOrEqual(0);
        expect(q.correctAnswer).toBeLessThan(q.options.length);
        expect(q.explanation.length).toBeGreaterThan(10);
      });
    }
  });

  it("should return empty array for unknown slugs", () => {
    const questions = getQuestionsForArticle("unknown-nonexistent-article-slug");
    expect(questions).toEqual([]);
  });
});

describe("Reading Editor Utilities", () => {
  it("should slugify Vietnamese titles properly without accents or special characters", () => {
    expect(slugifyReadingTitle("The Rise of Smart Cities")).toBe("the-rise-of-smart-cities");
    expect(slugifyReadingTitle("Học tiếng Anh thông minh cùng Vocabee!")).toBe("hoc-tieng-anh-thong-minh-cung-vocabee");
  });

  it("should parse paragraph drafts separated by newlines", () => {
    const raw = "Paragraph 1 text.\n\nParagraph 2 text.\n\n\n\nParagraph 3 text.";
    const parsed = parseParagraphDrafts(raw);
    expect(parsed.length).toBe(3);
    expect(parsed[0].id).toBe("p1");
    expect(parsed[0].text).toBe("Paragraph 1 text.");
    expect(parsed[1].id).toBe("p2");
    expect(parsed[2].id).toBe("p3");
  });
});
