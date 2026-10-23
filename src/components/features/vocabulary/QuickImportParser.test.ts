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

  it("parses a full markdown table including Nghĩa của ví dụ", () => {
    const items = parseMarkdownTable(`| Từ vựng | Nghĩa | IPA | Từ loại | Ví dụ | Nghĩa của ví dụ | Synonyms |
|---------|-------|-----|----------|--------|-----------------|----------|
| reluctant | miễn cưỡng | /rɪˈlʌk.tənt/ | adjective | She was reluctant to share her opinion. | Cô ấy miễn cưỡng chia sẻ ý kiến của mình. | hesitant |
| allocate money | phân bổ tiền | /.../ | phrase | We need to allocate money carefully. | Chúng ta cần phân bổ tiền cẩn thận. | fund |`);

    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      word: "reluctant",
      meaning: "miễn cưỡng",
      ipa: "/rɪˈlʌk.tənt/",
      partOfSpeech: "adjective",
      example: "She was reluctant to share her opinion.",
      example_translation: "Cô ấy miễn cưỡng chia sẻ ý kiến của mình.",
      synonyms: "hesitant",
      isValid: true,
    });
    expect(items[1]).toMatchObject({
      word: "allocate money",
      meaning: "phân bổ tiền",
      ipa: "/.../",
      partOfSpeech: "phrase",
      example: "We need to allocate money carefully.",
      example_translation: "Chúng ta cần phân bổ tiền cẩn thận.",
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
      example_translation: "",
      synonyms: "",
      isValid: true,
    });
  });

  it("supports missing synonyms", () => {
    const items = parseMarkdownTable(`| Word | Meaning | IPA | Part of speech | Example | Nghĩa của ví dụ |\n|---|---|---|---|---|---|\n| apple | quả táo | /ˈæpl/ | noun | I eat an apple every day. | Tôi ăn một quả táo mỗi ngày. |`);

    expect(items[0]).toMatchObject({
      word: "apple",
      meaning: "quả táo",
      ipa: "/ˈæpl/",
      partOfSpeech: "noun",
      example: "I eat an apple every day.",
      example_translation: "Tôi ăn một quả táo mỗi ngày.",
      synonyms: "",
    });
  });

  it("maps Vietnamese headers", () => {
    const items = parseMarkdownTable(`| Từ vựng | Nghĩa | IPA | Từ loại | Ví dụ | Dịch câu ví dụ | Synonyms |\n|---|---|---|---|---|---|---|\n| apple | quả táo | /ˈæpl/ | noun | I eat an apple every day. | Tôi ăn táo mỗi ngày. | fruit |`);

    expect(items[0]).toMatchObject({
      word: "apple",
      meaning: "quả táo",
      ipa: "/ˈæpl/",
      partOfSpeech: "noun",
      example: "I eat an apple every day.",
      example_translation: "Tôi ăn táo mỗi ngày.",
      synonyms: "fruit",
    });
  });

  it("maps English headers", () => {
    const items = parseMarkdownTable(`| Vocabulary | Meaning | Pronunciation | POS | Sentence | Example Translation | Synonym |\n|---|---|---|---|---|---|---|\n| word | nghĩa | /wɜːd/ | noun | This is a sentence. | Đây là một câu. | term |`);

    expect(items[0]).toMatchObject({
      word: "word",
      meaning: "nghĩa",
      ipa: "/wɜːd/",
      partOfSpeech: "noun",
      example: "This is a sentence.",
      example_translation: "Đây là một câu.",
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
    const chatgpt = `| Word | Meaning | IPA | Part of speech | Example | Example Translation | Synonyms |\n|---|---|---|---|---|---|---|\n| apple | quả táo | /ˈæpl/ | noun | I eat an apple every day. | Tôi ăn một quả táo mỗi ngày. | fruit |`;
    const claude = `| Vocabulary | Vietnamese | Pronunciation | POS | Example | Dịch ví dụ | Synonym |\n| --- | --- | --- | --- | --- | --- | --- |\n| allocate money | phân bổ tiền | /.../ | phrase | We need to allocate money carefully. | Chúng ta cần phân bổ tiền cẩn thận. | fund |`;
    const gemini = `  | Từ vựng | Nghĩa | Ví dụ | Nghĩa của ví dụ |\n  |---|---|---|---|\n  | book | sách | I read a book every day. | Tôi đọc sách mỗi ngày. |`;

    expect(parseQuickImportText(chatgpt, baseOptions)[0]).toMatchObject({
      word: "apple",
      meaning: "quả táo",
      example_translation: "Tôi ăn một quả táo mỗi ngày.",
    });
    expect(parseQuickImportText(claude, baseOptions)[0]).toMatchObject({
      word: "allocate money",
      meaning: "phân bổ tiền",
      example_translation: "Chúng ta cần phân bổ tiền cẩn thận.",
    });
    expect(parseQuickImportText(gemini, baseOptions)[0]).toMatchObject({
      word: "book",
      meaning: "sách",
      example: "I read a book every day.",
      example_translation: "Tôi đọc sách mỗi ngày.",
    });
  });

  it("parses tab-delimited text with example translation", () => {
    const text = "reluctant\tmiễn cưỡng\t/rɪˈlʌk.tənt/\tadjective\tShe was reluctant to share.\tCô ấy miễn cưỡng chia sẻ.\thesitant";
    const items = parseQuickImportText(text, baseOptions);

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      word: "reluctant",
      meaning: "miễn cưỡng",
      ipa: "/rɪˈlʌk.tənt/",
      partOfSpeech: "adjective",
      example: "She was reluctant to share.",
      example_translation: "Cô ấy miễn cưỡng chia sẻ.",
      synonyms: "hesitant",
    });
  });
});
