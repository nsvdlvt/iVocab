import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { ETeamSidebar } from "./ETeamSidebar";
import type { UserProfile } from "@/lib/auth/get-current-user";

let mockPathname = "/e-team/dashboard";
let mockIsMobileOpen = false;
const mockSetMobileOpen = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock("@/components/common/BrandLogo", () => ({
  BrandLogo: () => <div data-testid="brand-logo">Vocabee</div>,
}));

vi.mock("@/hooks/use-sidebar", () => ({
  useSidebar: () => ({
    isMobileOpen: mockIsMobileOpen,
    setMobileOpen: mockSetMobileOpen,
    isCollapsed: false,
    toggleCollapse: vi.fn(),
  }),
}));

vi.mock("@/components/ui/sheet", () => ({
  Sheet: ({ children, open }: { children: React.ReactNode; open: boolean }) => (
    <div data-testid="sheet-root" data-open={open}>
      {children}
    </div>
  ),
  SheetContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="sheet-content" className={className}>
      {children}
    </div>
  ),
  SheetTitle: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <h2 className={className}>{children}</h2>
  ),
}));

vi.mock("@/components/layout/UserMenu", () => ({
  UserMenu: ({ profile }: { profile?: UserProfile | null }) => (
    <div data-testid="user-menu">{profile?.email || "No User"}</div>
  ),
}));

const mockProfile: UserProfile = {
  id: "eteam-test",
  email: "eteam@vocabee.site",
  role: "e_team",
  display_name: "Biên Tập Viên",
  avatar_url: null,
  level: "B2",
  streak: 0,
  longest_streak: 0,
  daily_goal: 10,
  last_activity_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe("ETeamSidebar Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname = "/e-team/dashboard";
    mockIsMobileOpen = false;
  });

  it("renders desktop sidebar with workspace navigation items and profile", () => {
    const html = renderToString(<ETeamSidebar profile={mockProfile} />);

    expect(html).toContain("Dashboard");
    expect(html).toContain("Học từ vựng");
    expect(html).toContain("Workspace");
    expect(html).toContain("eteam@vocabee.site");
    expect(html).toContain("hidden md:flex");
  });

  it("marks Dashboard as active when on /e-team/dashboard", () => {
    mockPathname = "/e-team/dashboard";
    const html = renderToString(<ETeamSidebar profile={mockProfile} />);

    expect(html).toContain("text-purple-600");
  });

  it("marks Vocabs as active when on /e-team/vocabs", () => {
    mockPathname = "/e-team/vocabs";
    const html = renderToString(<ETeamSidebar profile={mockProfile} />);

    expect(html).toContain("text-purple-600");
  });
});
