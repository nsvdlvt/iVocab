import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { WorkspaceSelector } from "./WorkspaceSelector";
import type { UserProfile } from "@/lib/auth/get-current-user";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// Mock next/font/google
vi.mock("next/font/google", () => ({
  Fredoka: () => ({ className: "font-fredoka" }),
}));

// Mock Supabase client
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  }),
}));

// Mock logout action
vi.mock("@/actions/auth/logout", () => ({
  logoutAction: vi.fn().mockResolvedValue({ success: true, redirectTo: "/login" }),
}));

const mockMemberProfile: UserProfile = {
  id: "member-1",
  email: "learner@vocabee.site",
  role: "user", // legacy 'user' or 'member'
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

const mockETeamProfile: UserProfile = {
  id: "eteam-1",
  email: "eteam@vocabee.site",
  role: "e_team",
  display_name: "Trần E-Team",
  avatar_url: null,
  level: "Advanced (C1)",
  streak: 7,
  longest_streak: 15,
  daily_goal: 10,
  last_activity_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockAdminProfile: UserProfile = {
  id: "admin-1",
  email: "admin@vocabee.site",
  role: "admin",
  display_name: "Lê Admin",
  avatar_url: null,
  level: "Proficient (C2)",
  streak: 30,
  longest_streak: 45,
  daily_goal: 15,
  last_activity_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe("WorkspaceSelector Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders correct title and description", () => {
    const html = renderToString(<WorkspaceSelector profile={mockAdminProfile} />);
    expect(html).toContain("Chọn không gian của bạn");
    expect(html).toContain("Bạn muốn tiếp tục ở không gian nào?");
  });

  describe("Member Role Access", () => {
    it("renders ONLY Vocabeer card with exact label, description and button text", () => {
      const html = renderToString(<WorkspaceSelector profile={mockMemberProfile} />);

      // Vocabeer card check
      expect(html).toContain("Vocabeer");
      expect(html).toContain("Không gian học tập và chinh phục từ vựng tiếng Anh.");
      expect(html).toContain("Vào không gian học tập");

      // E-Team card should NOT be rendered
      expect(html).not.toContain("Không gian làm việc dành riêng cho thành viên E-Team.");
      expect(html).not.toContain("Vào E-Team");
    });
  });

  describe("E-Team Role Access", () => {
    it("renders ONLY E-Team card for E-Team role", () => {
      const html = renderToString(<WorkspaceSelector profile={mockETeamProfile} />);

      // E-Team card check
      expect(html).toContain("E-Team");
      expect(html).toContain("Không gian làm việc dành riêng cho thành viên E-Team.");
      expect(html).toContain("Vào E-Team");

      // Vocabeer card should NOT be rendered for e_team only
      expect(html).not.toContain("Không gian học tập và chinh phục từ vựng tiếng Anh.");
      expect(html).not.toContain("Vào không gian học tập");
    });
  });

  describe("Admin Role Access", () => {
    it("renders BOTH Vocabeer and E-Team cards for Admin role", () => {
      const html = renderToString(<WorkspaceSelector profile={mockAdminProfile} />);

      // Both cards rendered
      expect(html).toContain("Vocabeer");
      expect(html).toContain("Vào không gian học tập");
      expect(html).toContain("E-Team");
      expect(html).toContain("Vào E-Team");

      // Admin console jump link
      expect(html).toContain("Trang Quản trị (Admin Console)");
    });
  });
});
