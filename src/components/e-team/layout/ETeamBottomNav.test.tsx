import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { ETeamBottomNav } from "./ETeamBottomNav";
import { ROUTES } from "@/constants/routes";

let mockPathname = "/e-team/dashboard";
let mockIsMobileOpen = false;
const mockToggleMobileOpen = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

vi.mock("@/hooks/use-sidebar", () => ({
  useSidebar: () => ({
    isMobileOpen: mockIsMobileOpen,
    toggleMobileOpen: mockToggleMobileOpen,
    setMobileOpen: vi.fn(),
  }),
}));

function getAnchor(html: string, href: string): string {
  const segment = html.split("<a ").find((s) => s.includes(`href="${href}"`));
  return segment ? `<a ${segment.split("</a>")[0]}</a>` : "";
}

function getMenuButton(html: string): string {
  const segment = html.split("<button ").find((s) => s.includes("Menu"));
  return segment ? `<button ${segment.split("</button")[0]}</button>` : "";
}

describe("ETeamBottomNav Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname = "/e-team/dashboard";
    mockIsMobileOpen = false;
  });

  it("renders exactly 3 navigation items: Trang chủ, Học từ vựng, Menu", () => {
    const html = renderToString(<ETeamBottomNav />);

    expect(html).toContain("Trang chủ");
    expect(html).toContain("Học từ vựng");
    expect(html).toContain("Menu");

    // Check accessible labels
    expect(html).toContain('aria-label="Trang chủ E-Team"');
    expect(html).toContain('aria-label="Học từ vựng E-Team"');
    expect(html).toContain('aria-label="Mở menu điều hướng E-Team"');
    expect(html).toContain('aria-label="Điều hướng di động E-Team"');

    // Check responsive classes
    expect(html).toContain("md:hidden");
    expect(html).toContain("fixed bottom-0");
  });

  it("has correct hrefs for Dashboard and Vocabs", () => {
    const html = renderToString(<ETeamBottomNav />);

    expect(html).toContain(`href="${ROUTES.ETEAM_DASHBOARD}"`);
    expect(html).toContain(`href="${ROUTES.ETEAM_VOCABS}"`);
  });

  it("highlights 'Trang chủ' as active on /e-team/dashboard", () => {
    mockPathname = ROUTES.ETEAM_DASHBOARD;
    const html = renderToString(<ETeamBottomNav />);

    const homeAnchor = getAnchor(html, ROUTES.ETEAM_DASHBOARD);
    const vocabsAnchor = getAnchor(html, ROUTES.ETEAM_VOCABS);

    expect(homeAnchor).toContain("text-purple-600");
    expect(homeAnchor).toContain('aria-current="page"');
    expect(vocabsAnchor).toContain("text-muted-foreground");
    expect(vocabsAnchor).not.toContain('aria-current="page"');
  });

  it("highlights 'Trang chủ' as active on /e-team root", () => {
    mockPathname = "/e-team";
    const html = renderToString(<ETeamBottomNav />);

    const homeAnchor = getAnchor(html, ROUTES.ETEAM_DASHBOARD);
    expect(homeAnchor).toContain("text-purple-600");
  });

  it("highlights 'Học từ vựng' as active on /e-team/vocabs", () => {
    mockPathname = ROUTES.ETEAM_VOCABS;
    const html = renderToString(<ETeamBottomNav />);

    const homeAnchor = getAnchor(html, ROUTES.ETEAM_DASHBOARD);
    const vocabsAnchor = getAnchor(html, ROUTES.ETEAM_VOCABS);

    expect(vocabsAnchor).toContain("text-purple-600");
    expect(vocabsAnchor).toContain('aria-current="page"');
    expect(homeAnchor).toContain("text-muted-foreground");
    expect(homeAnchor).not.toContain('aria-current="page"');
  });

  it("highlights 'Học từ vựng' on nested vocab routes (detail, learn, flashcard)", () => {
    const nestedRoutes = [
      "/e-team/vocabs/set-abc-123",
      "/e-team/vocabs/set-abc-123/learn",
      "/e-team/vocabs/set-abc-123/flashcard",
    ];

    for (const route of nestedRoutes) {
      mockPathname = route;
      const html = renderToString(<ETeamBottomNav />);
      const vocabsAnchor = getAnchor(html, ROUTES.ETEAM_VOCABS);
      const homeAnchor = getAnchor(html, ROUTES.ETEAM_DASHBOARD);

      expect(vocabsAnchor).toContain("text-purple-600");
      expect(homeAnchor).toContain("text-muted-foreground");
    }
  });

  it("reflects active state on Menu when isMobileOpen is true", () => {
    mockIsMobileOpen = true;
    const html = renderToString(<ETeamBottomNav />);

    const menuButton = getMenuButton(html);
    expect(menuButton).toContain('aria-expanded="true"');
    expect(menuButton).toContain("text-purple-600");
  });

  it("reflects inactive state on Menu when isMobileOpen is false", () => {
    mockIsMobileOpen = false;
    const html = renderToString(<ETeamBottomNav />);

    const menuButton = getMenuButton(html);
    expect(menuButton).toContain('aria-expanded="false"');
    expect(menuButton).toContain("text-muted-foreground");
  });
});
