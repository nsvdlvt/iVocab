import { describe, expect, it } from "vitest";
import { normalizeVocabularyWord } from "./vocabulary-duplicates";

describe("vocabulary-duplicates", () => {
  it("normalizes whitespace and casing", () => {
    expect(normalizeVocabularyWord("  ConStItuent  ")).toBe("constituent");
    expect(normalizeVocabularyWord("two   words")).toBe("two words");
  });
});
