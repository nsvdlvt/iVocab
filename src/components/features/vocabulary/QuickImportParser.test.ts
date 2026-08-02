import { describe, expect, it } from "vitest";
import { detectMarkdownTable, parseMarkdownTable, parseQuickImportText } from "./QuickImportParser";

const baseOptions = {
  termDelimiter: "tab" as const,
  customTermDelimiter: "",
  cardDelimiter: "newline" as const,
  customCardDelimiter: "",
};

describe("QuickImportParser markdown table", () => {
  it("detects markdown tables with a header and separator row", () => {
    expect(
      detectMarkdownTable(`| Word | Meaning |\n|---|---|\n| apple | quả táo |`)
    ).toBe(true);
  });

  it("parses a full 6-column markdown table", () => {
    const items = parseMarkdownTable(`| Từ vựng | Nghĩa | IPA | Từ loại | Ví dụ | Synonyms |
|---------|-------|-----|----------|--------|----------|
| apple | quả táo | /ˈæpl/ | noun | I eat an apple every day. | fruit |
| allocate money | phân bổ tiền | /.../ | phrase | We need to allocate money carefully. | fund |`);

    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      word: "apple",
      meaning: "quả táo",
      ipa: "/ˈæpl/",
      partOfSpeech: "noun",
      example: "I eat an apple every day.",
      synonyms: "fruit",
      isValid: true,
    });
    expect(items[1]).toMatchObject({
      word: "allocate money",
      meaning: "phân bổ tiền",
      ipa: "/.../",
      partOfSpeech: "phrase",
      example: "We need to allocate money carefully.",
      synonyms: "fund",
      isValid: true,
    });
  });

  it("supports missing optional columns", () => {
    const items = parseMarkdownTable(`| Word | Meaning | Example |\n|---|---|---|\n| apple | quả táo | I eat an apple every day. |`);

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      word: "apple",
      meaning: "quả táo",
      ipa: "",
      partOfSpeech: "",
      example: "I eat an apple every day.",
      synonyms: "",
      isValid: true,
    });
  });

  it("supports missing synonyms", () => {
    const items = parseMarkdownTable(`| Word | Meaning | IPA | Part of speech | Example |\n|---|---|---|---|---|\n| apple | quả táo | /ˈæpl/ | noun | I eat an apple every day. |`);

    expect(items[0]).toMatchObject({
      word: "apple",
      meaning: "quả táo",
      ipa: "/ˈæpl/",
      partOfSpeech: "noun",
      example: "I eat an apple every day.",
      synonyms: "",
    });
  });

  it("maps Vietnamese headers", () => {
    const items = parseMarkdownTable(`| Từ vựng | Nghĩa | IPA | Từ loại | Ví dụ | Synonyms |\n|---|---|---|---|---|---|\n| apple | quả táo | /ˈæpl/ | noun | I eat an apple every day. | fruit |`);

    expect(items[0]).toMatchObject({
      word: "apple",
      meaning: "quả táo",
      ipa: "/ˈæpl/",
      partOfSpeech: "noun",
      example: "I eat an apple every day.",
      synonyms: "fruit",
    });
  });

  it("maps English headers", () => {
    const items = parseMarkdownTable(`| Vocabulary | Meaning | Pronunciation | POS | Sentence | Synonym |\n|---|---|---|---|---|---|\n| word | nghĩa | /wɜːd/ | noun | This is a sentence. | term |`);

    expect(items[0]).toMatchObject({
      word: "word",
      meaning: "nghĩa",
      ipa: "/wɜːd/",
      partOfSpeech: "noun",
      example: "This is a sentence.",
      synonyms: "term",
    });
  });

  it("trims whitespace and ignores separator rows", () => {
    const items = parseMarkdownTable(`  | Word | Meaning |  \n|---------|------|\n\n|  apple  |  quả táo  |`);

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      word: "apple",
      meaning: "quả táo",
    });
  });

  it("unescapes pipes and converts br tags", () => {
    const items = parseMarkdownTable(`| Word | Meaning | Example |\n|---|---|---|\n| a \\| b | line 1<br>line 2 | hello <br/> world |`);

    expect(items[0]).toMatchObject({
      word: "a | b",
      meaning: "line 1\nline 2",
      example: "hello\nworld",
    });
  });

  it("prefers markdown parsing when pasted into the generic quick import entry point", () => {
    const items = parseQuickImportText(`| Word | Meaning | IPA |\n|---|---|---|\n| apple | quả táo | /ˈæpl/ |`, baseOptions);

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      word: "apple",
      meaning: "quả táo",
      ipa: "/ˈæpl/",
    });
  });

  it("handles copy-paste style tables from ChatGPT Claude and Gemini", () => {
    const chatgpt = `| Word | Meaning | IPA | Part of speech | Example | Synonyms |\n|---|---|---|---|---|---|\n| apple | quả táo | /ˈæpl/ | noun | I eat an apple every day. | fruit |`;
    const claude = `| Vocabulary | Vietnamese | Pronunciation | POS | Example | Synonym |\n| --- | --- | --- | --- | --- | --- |\n| allocate money | phân bổ tiền | /.../ | phrase | We need to allocate money carefully. | fund |`;
    const gemini = `  | Từ vựng | Nghĩa | Ví dụ |\n  |---|---|---|\n  | book | sách | I read a book every day. |`;

    expect(parseQuickImportText(chatgpt, baseOptions)[0]).toMatchObject({ word: "apple", meaning: "quả táo" });
    expect(parseQuickImportText(claude, baseOptions)[0]).toMatchObject({ word: "allocate money", meaning: "phân bổ tiền" });
    expect(parseQuickImportText(gemini, baseOptions)[0]).toMatchObject({ word: "book", meaning: "sách", example: "I read a book every day." });
  });
});
