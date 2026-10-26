import React from "react";
import { describe, it, expect, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { SelectionBubble } from "../SelectionBubble";

describe("SelectionBubble", () => {
  it("renders 'Tra từ' for single word selection", () => {
    const html = renderToString(
      <SelectionBubble
        position={{ top: 100, left: 200 }}
        isSingleWord={true}
        onTriggerLookup={vi.fn()}
      />
    );
    expect(html).toContain("Tra từ");
    expect(html).toContain("Tra từ điển nhanh");
    expect(html).toContain("data-smart-selection-ui");
    expect(html).toContain("-translate-y-full");
  });

  it("renders 'Dịch nhanh' for multi-word or sentence selection", () => {
    const html = renderToString(
      <SelectionBubble
        position={{ top: 100, left: 200 }}
        isSingleWord={false}
        onTriggerLookup={vi.fn()}
      />
    );
    expect(html).toContain("Dịch nhanh");
    expect(html).toContain("Dịch toàn bộ đoạn văn");
  });

  it("handles flipped below positioning when near top of viewport", () => {
    const html = renderToString(
      <SelectionBubble
        position={{ top: 30, left: 200 }}
        isSingleWord={true}
        isFlippedBelow={true}
        onTriggerLookup={vi.fn()}
      />
    );
    expect(html).toContain("translate-y-0");
    expect(html).not.toContain("-translate-y-full");
  });

  it("includes high-contrast styles, accessible focus-visible ring, and disabled state", () => {
    const html = renderToString(
      <SelectionBubble
        position={{ top: 100, left: 200 }}
        isSingleWord={true}
        disabled={true}
        onTriggerLookup={vi.fn()}
      />
    );
    expect(html).toContain("bg-primary");
    expect(html).toContain("text-primary-foreground");
    expect(html).toContain("focus-visible:ring-ring");
    expect(html).toContain("disabled:opacity-50");
    expect(html).toContain("disabled");
  });
});
