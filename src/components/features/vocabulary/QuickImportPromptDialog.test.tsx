import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { QuickImportPromptDialog, AI_VOCABULARY_PROMPT } from "./QuickImportPromptDialog";
import { parseQuickImportText } from "./QuickImportParser";

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-content">{children}</div>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-header">{children}</div>
  ),
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
}));

describe("QuickImportPromptDialog & AI prompt compatibility", () => {
  it("includes all 7 required columns in exact order in AI_VOCABULARY_PROMPT", () => {
    expect(AI_VOCABULARY_PROMPT).toContain("1. Từ vựng");
    expect(AI_VOCABULARY_PROMPT).toContain("2. Ý nghĩa");
    expect(AI_VOCABULARY_PROMPT).toContain("3. IPA");
    expect(AI_VOCABULARY_PROMPT).toContain("4. Từ loại");
    expect(AI_VOCABULARY_PROMPT).toContain("5. Câu ví dụ");
    expect(AI_VOCABULARY_PROMPT).toContain("6. Nghĩa của ví dụ");
    expect(AI_VOCABULARY_PROMPT).toContain("7. Từ đồng nghĩa");

    const pos1 = AI_VOCABULARY_PROMPT.indexOf("1. Từ vựng");
    const pos2 = AI_VOCABULARY_PROMPT.indexOf("2. Ý nghĩa");
    const pos3 = AI_VOCABULARY_PROMPT.indexOf("3. IPA");
    const pos4 = AI_VOCABULARY_PROMPT.indexOf("4. Từ loại");
    const pos5 = AI_VOCABULARY_PROMPT.indexOf("5. Câu ví dụ");
    const pos6 = AI_VOCABULARY_PROMPT.indexOf("6. Nghĩa của ví dụ");
    const pos7 = AI_VOCABULARY_PROMPT.indexOf("7. Từ đồng nghĩa");

    expect(pos1).toBeLessThan(pos2);
    expect(pos2).toBeLessThan(pos3);
    expect(pos3).toBeLessThan(pos4);
    expect(pos4).toBeLessThan(pos5);
    expect(pos5).toBeLessThan(pos6);
    expect(pos6).toBeLessThan(pos7);
  });

  it("includes all requested requirements in prompt", () => {
    expect(AI_VOCABULARY_PROMPT).toContain("Chuẩn hóa từ vựng về dạng từ điển (lemma/base form)");
    expect(AI_VOCABULARY_PROMPT).toContain("Cung cấp nghĩa tiếng Việt ngắn gọn, IPA chính xác");
    expect(AI_VOCABULARY_PROMPT).toContain("Mỗi từ có một câu ví dụ tiếng Anh tự nhiên");
    expect(AI_VOCABULARY_PROMPT).toContain("Cung cấp 1–3 từ đồng nghĩa tiếng Anh phù hợp");
    expect(AI_VOCABULARY_PROMPT).toContain("Sắp xếp danh sách theo thứ tự bảng chữ cái A–Z");
    expect(AI_VOCABULARY_PROMPT).toContain("Nếu đầu vào là file hoặc hình ảnh, hãy trích xuất và xử lý toàn bộ danh sách");
  });

  it("parses table matching the prompt's exact 7 column headers", () => {
    const aiOutput = `| Từ vựng | Ý nghĩa | IPA | Từ loại | Câu ví dụ | Nghĩa của ví dụ | Từ đồng nghĩa |
|---|---|---|---|---|---|---|
| accomplish | hoàn thành | /əˈkʌm.plɪʃ/ | verb | She accomplished all her goals for the year. | Cô ấy đã hoàn thành mọi mục tiêu trong năm. | achieve, fulfill |
| diligent | siêng năng | /ˈdɪl.ɪ.dʒənt/ | adjective | He is a diligent student who studies every day. | Cậu ấy là một học sinh chăm chỉ học bài mỗi ngày. | hardworking, industrious |`;

    const parsed = parseQuickImportText(aiOutput, {
      termDelimiter: "tab",
      customTermDelimiter: "",
      cardDelimiter: "newline",
      customCardDelimiter: "",
    });

    expect(parsed).toHaveLength(2);
    expect(parsed[0]).toMatchObject({
      word: "accomplish",
      meaning: "hoàn thành",
      ipa: "/əˈkʌm.plɪʃ/",
      partOfSpeech: "verb",
      example: "She accomplished all her goals for the year.",
      example_translation: "Cô ấy đã hoàn thành mọi mục tiêu trong năm.",
      synonyms: "achieve, fulfill",
      isValid: true,
    });
    expect(parsed[1]).toMatchObject({
      word: "diligent",
      meaning: "siêng năng",
      ipa: "/ˈdɪl.ɪ.dʒənt/",
      partOfSpeech: "adjective",
      example: "He is a diligent student who studies every day.",
      example_translation: "Cậu ấy là một học sinh chăm chỉ học bài mỗi ngày.",
      synonyms: "hardworking, industrious",
      isValid: true,
    });
  });

  it("renders the prompt dialog with instructions and buttons when open", () => {
    const html = renderToString(
      <QuickImportPromptDialog open={true} onOpenChange={() => {}} />
    );

    expect(html).toContain("Tạo bảng từ vựng tự động bằng AI");
    expect(html).toContain(
      "Dán Prompt này vào Chat GPT để tạo bảng từ vựng tự động, sau đó dán bảng từ vựng vào Vocabee"
    );
    expect(html).toContain("Copy prompt");
    expect(html).toContain("Đóng");
    expect(html).toContain("Bạn là chuyên gia từ vựng tiếng Anh");
  });
});
