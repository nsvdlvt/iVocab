import React from "react";
import { describe, it, expect, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { SelectionResultPopup } from "../SelectionResultPopup";

describe("SelectionResultPopup", () => {
  it("renders dictionary mode header and structure when isSingleWord is true", () => {
    const html = renderToString(
      <SelectionResultPopup
        selectedText="resilient"
        isSingleWord={true}
        wordForLookup="resilient"
        position={{ top: 200, left: 300 }}
        onClose={vi.fn()}
      />
    );

    expect(html).toContain("Từ điển");
    expect(html).toContain("data-smart-selection-ui");
    expect(html).toContain("Đóng popup tra từ");
    expect(html).toContain("Sao chép kết quả");
  });

  it("renders translate mode header and original text when isSingleWord is false", () => {
    const html = renderToString(
      <SelectionResultPopup
        selectedText="Building resilient systems."
        isSingleWord={false}
        wordForLookup="Building resilient systems."
        position={{ top: 200, left: 300 }}
        onClose={vi.fn()}
      />
    );

    expect(html).toContain("Dịch câu / đoạn");
    expect(html).toContain("Văn bản gốc");
    expect(html).toContain("Building resilient systems.");
    expect(html).toContain("Bản dịch tiếng Việt (Google Translate)");
  });
});
