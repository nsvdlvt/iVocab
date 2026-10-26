import { describe, it, expect } from "vitest";
import {
  isWordChar,
  isWordConnector,
  isPartOfWord,
  expandIndicesToWordBoundaries,
  cleanSelectedWord,
  classifySelection,
  isExcludedElement,
  findSurroundingSentence,
} from "../smart-selection";

describe("Smart Selection - Text & Boundary Logic", () => {
  describe("isWordChar", () => {
    it("recognizes English letters and digits", () => {
      expect(isWordChar("a")).toBe(true);
      expect(isWordChar("Z")).toBe(true);
      expect(isWordChar("5")).toBe(true);
    });

    it("recognizes Vietnamese accented letters", () => {
      expect(isWordChar("ê")).toBe(true);
      expect(isWordChar("ắ")).toBe(true);
      expect(isWordChar("đ")).toBe(true);
      expect(isWordChar("Đ")).toBe(true);
      expect(isWordChar("ổ")).toBe(true);
      expect(isWordChar("ợ")).toBe(true);
      expect(isWordChar("ý")).toBe(true);
    });

    it("rejects punctuation and whitespace", () => {
      expect(isWordChar(" ")).toBe(false);
      expect(isWordChar(".")).toBe(false);
      expect(isWordChar(",")).toBe(false);
      expect(isWordChar("?")).toBe(false);
      expect(isWordChar("!")).toBe(false);
      expect(isWordChar("-")).toBe(false);
      expect(isWordChar("'")).toBe(false);
    });
  });

  describe("isWordConnector & isPartOfWord", () => {
    it("recognizes internal apostrophes in contractions", () => {
      const text = "don't give up";
      // index 3 is "'" in "don't"
      expect(isWordConnector(text, 3)).toBe(true);
      expect(isPartOfWord(text, 3)).toBe(true);
    });

    it("recognizes internal hyphens", () => {
      const text = "well-known author";
      // index 4 is "-" in "well-known"
      expect(isWordConnector(text, 4)).toBe(true);
      expect(isPartOfWord(text, 4)).toBe(true);
    });

    it("rejects external apostrophes (quotes)", () => {
      const text = "'resilient'";
      // index 0 is leading quote
      expect(isWordConnector(text, 0)).toBe(false);
      expect(isPartOfWord(text, 0)).toBe(false);
      // index 10 is trailing quote
      expect(isWordConnector(text, 10)).toBe(false);
      expect(isPartOfWord(text, 10)).toBe(false);
    });
  });

  describe("expandIndicesToWordBoundaries", () => {
    it("expands partial single word selection 'resili' to 'resilient'", () => {
      const text = "A very resilient community.";
      const start = text.indexOf("resili");
      const end = start + "resili".length;
      const expanded = expandIndicesToWordBoundaries(text, start, end);
      expect(text.substring(expanded.start, expanded.end)).toBe("resilient");
    });

    it("expands middle of word 'ilip' in 'philippines' to 'philippines'", () => {
      const text = "Visit the philippines soon.";
      const start = text.indexOf("ilip");
      const end = start + "ilip".length;
      const expanded = expandIndicesToWordBoundaries(text, start, end);
      expect(text.substring(expanded.start, expanded.end)).toBe("philippines");
    });

    it("expands partial multi-word selection 'e resilient lea' to 'the resilient learning'", () => {
      const text = "All the resilient learning tools.";
      const start = text.indexOf("e resilient lea");
      const end = start + "e resilient lea".length;
      const expanded = expandIndicesToWordBoundaries(text, start, end);
      expect(text.substring(expanded.start, expanded.end)).toBe("the resilient learning");
    });

    it("preserves hyphenated words like 'well-known'", () => {
      const text = "He is a well-known writer.";
      const start = text.indexOf("well-kn");
      const end = start + "well-kn".length;
      const expanded = expandIndicesToWordBoundaries(text, start, end);
      expect(text.substring(expanded.start, expanded.end)).toBe("well-known");
    });

    it("expands Vietnamese word 'kiê' to 'kiên'", () => {
      const text = "Học sinh cần kiên trì học tập.";
      const start = text.indexOf("kiê");
      const end = start + "kiê".length;
      const expanded = expandIndicesToWordBoundaries(text, start, end);
      expect(text.substring(expanded.start, expanded.end)).toBe("kiên");
    });

    it("does not expand a full sentence into the next sentence", () => {
      const text = "This is the first sentence. This is the second sentence.";
      const sentence = "This is the first sentence.";
      const start = 0;
      const end = sentence.length;
      const expanded = expandIndicesToWordBoundaries(text, start, end);
      expect(text.substring(expanded.start, expanded.end)).toBe("This is the first sentence.");
    });
  });

  describe("cleanSelectedWord", () => {
    it("strips outer quotes and punctuation", () => {
      expect(cleanSelectedWord('"resilient"')).toBe("resilient");
      expect(cleanSelectedWord("“perseverance,”")).toBe("perseverance");
      expect(cleanSelectedWord("(vocabulary)")).toBe("vocabulary");
      expect(cleanSelectedWord("learn!")).toBe("learn");
    });

    it("preserves internal hyphens and apostrophes", () => {
      expect(cleanSelectedWord("state-of-the-art")).toBe("state-of-the-art");
      expect(cleanSelectedWord("don't")).toBe("don't");
    });
  });

  describe("classifySelection", () => {
    it("classifies single word as isSingleWord = true (Case A)", () => {
      const res = classifySelection("resilient");
      expect(res.isSingleWord).toBe(true);
      expect(res.wordForLookup).toBe("resilient");
    });

    it("classifies single word with punctuation as isSingleWord = true", () => {
      const res = classifySelection('"eloquent",');
      expect(res.isSingleWord).toBe(true);
      expect(res.wordForLookup).toBe("eloquent");
    });

    it("classifies hyphenated word as single word", () => {
      const res = classifySelection("decision-making");
      expect(res.isSingleWord).toBe(true);
      expect(res.wordForLookup).toBe("decision-making");
    });

    it("classifies multi-word sentence as isSingleWord = false (Case B)", () => {
      const res = classifySelection("Practice makes perfect.");
      expect(res.isSingleWord).toBe(false);
      expect(res.cleanText).toBe("Practice makes perfect.");
    });

    it("classifies paragraph as isSingleWord = false (Case B)", () => {
      const res = classifySelection("First paragraph line.\nSecond paragraph line.");
      expect(res.isSingleWord).toBe(false);
    });
  });

  describe("findSurroundingSentence", () => {
    it("matches exact word and avoids substring false positives", () => {
      // Mock element with full text
      const mockEl = {
        tagName: "P",
        textContent: "We are training hard today. In fact, everyone is participating in the workshop.",
        parentElement: null,
      } as unknown as Element;

      // Mock getComputedStyle for node env
      if (typeof window !== "undefined") {
        const sentence = findSurroundingSentence(mockEl, "in");
        expect(sentence).toContain("In fact, everyone is participating in the workshop");
        expect(sentence).not.toBe("We are training hard today.");
      }
    });
  });

  describe("isExcludedElement", () => {
    it("identifies input and textarea elements as excluded", () => {
      // Mock minimal element for node environment
      const inputEl = {
        tagName: "INPUT",
        getAttribute: () => null,
        closest: () => null,
      } as unknown as Element;
      expect(isExcludedElement(inputEl)).toBe(true);

      const textareaEl = {
        tagName: "TEXTAREA",
        getAttribute: () => null,
        closest: () => null,
      } as unknown as Element;
      expect(isExcludedElement(textareaEl)).toBe(true);
    });

    it("identifies contenteditable as excluded", () => {
      const editableEl = {
        tagName: "DIV",
        getAttribute: (attr: string) => (attr === "contenteditable" ? "true" : null),
        closest: () => null,
      } as unknown as Element;
      expect(isExcludedElement(editableEl)).toBe(true);
    });

    it("identifies marked containers as excluded", () => {
      const noSelectEl = {
        tagName: "DIV",
        getAttribute: () => null,
        closest: (sel: string) =>
          sel.includes("data-no-smart-selection") ? ({} as Element) : null,
      } as unknown as Element;
      expect(isExcludedElement(noSelectEl)).toBe(true);
    });

    it("permits standard paragraph elements", () => {
      const pEl = {
        tagName: "P",
        getAttribute: () => null,
        closest: () => null,
      } as unknown as Element;
      expect(isExcludedElement(pEl)).toBe(false);
    });
  });
});
