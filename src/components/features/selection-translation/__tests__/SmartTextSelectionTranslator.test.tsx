import React from "react";
import { describe, it, expect, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { SmartTextSelectionTranslator } from "../SmartTextSelectionTranslator";

// Mock next/navigation
const mockPathname = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
}));

describe("SmartTextSelectionTranslator", () => {
  it("does not render when on /admin routes", () => {
    mockPathname.mockReturnValue("/admin/dashboard");
    const html = renderToString(<SmartTextSelectionTranslator />);
    expect(html).toBe("");
  });

  it("does not render before any selection occurs", () => {
    mockPathname.mockReturnValue("/u/reading");
    const html = renderToString(<SmartTextSelectionTranslator />);
    expect(html).toBe("");
  });
});
