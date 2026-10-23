import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { UserMenu } from "./UserMenu";
import type { UserProfile } from "@/lib/auth/get-current-user";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// Mock sidebar hook
vi.mock("@/hooks/use-sidebar", () => ({
  useSidebar: () => ({
    setMobileOpen: vi.fn(),
  }),
}));

// Mock DropdownMenu primitives so content renders inline for inspection
vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div data-slot="dropdown-root">{children}</div>,
  DropdownMenuTrigger: ({ render }: { render: React.ReactNode }) => <div data-slot="dropdown-trigger">{render}</div>,
  DropdownMenuContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-slot="dropdown-content" className={className}>{children}</div>
  ),
  DropdownMenuItem: ({
    children,
    onClick,
    disabled,
    variant,
    className,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    variant?: string;
    className?: string;
  }) => (
    <div data-slot="dropdown-item" data-variant={variant} data-disabled={disabled} className={className} onClick={onClick}>
      {children}
    </div>
  ),
  DropdownMenuSeparator: ({ className }: { className?: string }) => <hr data-slot="dropdown-separator" className={className} />,
}));

// Mock Supabase client
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    }),
  }),
}));

// Mock logoutAction
vi.mock("@/actions/auth/logout", () => ({
  logoutAction: vi.fn().mockResolvedValue({ success: true, redirectTo: "/login" }),
}));

const mockAdminProfile: UserProfile = {
  id: "admin-123",
  email: "dungbnlvt@gmail.com",
  role: "admin",
  display_name: "Dũng Nguyễn",
  avatar_url: null,
  level: "Professional (C2)",
  streak: 5,
  longest_streak: 10,
  daily_goal: 10,
  last_activity_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockETeamProfile: UserProfile = {
  id: "eteam-789",
  email: "eteam@vocabee.site",
  role: "e_team",
  display_name: "E-Team Member",
  avatar_url: null,
  level: "Intermediate (B2)",
  streak: 3,
  longest_streak: 8,
  daily_goal: 10,
  last_activity_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockUserProfile: UserProfile = {
  id: "user-456",
  email: "learner@vocabee.site",
  role: "user",
  display_name: "Nguyễn Học Viên",
  avatar_url: null,
  level: "Basic (A1)",
  streak: 2,
  longest_streak: 5,
  daily_goal: 10,
  last_activity_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe("UserMenu Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Role Badge", () => {
    it("renders MEMBER badge for user account in dropdown content", () => {
      const html = renderToString(<UserMenu profile={mockUserProfile} />);
      expect(html).toContain("MEMBER");
      expect(html).toContain("Nguyễn Học Viên");
      expect(html).toContain("learner@vocabee.site");
    });

    it("renders ADMIN badge for admin account in dropdown content", () => {
      const html = renderToString(<UserMenu profile={mockAdminProfile} />);
      expect(html).toContain("ADMIN");
      expect(html).toContain("Dũng Nguyễn");
      expect(html).toContain("dungbnlvt@gmail.com");
    });

    it("renders E-TEAM badge for e_team account in dropdown content", () => {
      const html = renderToString(<UserMenu profile={mockETeamProfile} />);
      expect(html).toContain("E-TEAM");
      expect(html).toContain("E-Team Member");
    });
  });

  describe("Workspace Switcher Option", () => {
    it("renders 'Chuyển đổi không gian' for admin account", () => {
      const html = renderToString(<UserMenu profile={mockAdminProfile} />);
      expect(html).toContain("Chuyển đổi không gian");
    });

    it("renders 'Chuyển đổi không gian' for e_team account", () => {
      const html = renderToString(<UserMenu profile={mockETeamProfile} />);
      expect(html).toContain("Chuyển đổi không gian");
    });

    it("does NOT render 'Chuyển đổi không gian' for member/user account", () => {
      const html = renderToString(<UserMenu profile={mockUserProfile} />);
      expect(html).not.toContain("Chuyển đổi không gian");
    });
  });

  describe("Admin Dashboard Navigation Option", () => {
    it("renders 'Trang quản trị' menu item when profile role is 'admin'", () => {
      const html = renderToString(<UserMenu profile={mockAdminProfile} />);
      expect(html).toContain("Trang quản trị");
    });

    it("does NOT render 'Trang quản trị' menu item when profile role is 'user'", () => {
      const html = renderToString(<UserMenu profile={mockUserProfile} />);
      expect(html).not.toContain("Trang quản trị");
    });

    it("does NOT render 'Trang quản trị' menu item when profile role is 'e_team'", () => {
      const html = renderToString(<UserMenu profile={mockETeamProfile} />);
      expect(html).not.toContain("Trang quản trị");
    });

    it("does NOT render 'Trang quản trị' menu item when profile is not provided (loading)", () => {
      const html = renderToString(<UserMenu profile={null} />);
      expect(html).not.toContain("Trang quản trị");
    });
  });

  describe("Standard Navigation and Actions", () => {
    it("renders all standard profile items (Hồ sơ, Thống kê, Thông báo, Cài đặt, Đăng xuất)", () => {
      const html = renderToString(<UserMenu profile={mockUserProfile} />);
      expect(html).toContain("Hồ sơ cá nhân");
      expect(html).toContain("Thống kê học tập");
      expect(html).toContain("Thông báo");
      expect(html).toContain("Cài đặt");
      expect(html).toContain("Đăng xuất");
    });
  });
});
