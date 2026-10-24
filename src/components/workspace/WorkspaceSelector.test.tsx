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
  role: "member",
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

  it("renders correct title and header elements", () => {
    const html = renderToString(<WorkspaceSelector profile={mockAdminProfile} />);
    expect(html).toContain("Chọn không gian làm việc");
    expect(html).toContain("Chọn không gian làm việc bạn muốn truy cập.");
    expect(html).toContain("Lê Admin");
    expect(html).toContain("Admin");
  });

  describe("Scenario 1: Member signs in -> only Vocabeer is available", () => {
    it("renders ONLY Vocabeer workspace card", () => {
      const html = renderToString(<WorkspaceSelector profile={mockMemberProfile} />);

      // Vocabeer card check
      expect(html).toContain("Vocabeer");
      expect(html).toContain("Không gian học tập và chinh phục từ vựng tiếng Anh cá nhân.");
      expect(html).toContain("Vào không gian học tập");

      // E-Team card should NOT be rendered
      expect(html).not.toContain("Không gian làm việc và quản lý từ vựng dành cho thành viên E-Team.");
      expect(html).not.toContain("Vào E-Team");

      // Admin card should NOT be rendered
      expect(html).not.toContain("Admin Console");
      expect(html).not.toContain("Vào trang Quản trị");
    });
  });

  describe("Scenario 2: E-Team member signs in -> sees Vocabeer and E-Team", () => {
    it("renders BOTH Vocabeer and E-Team workspace cards, without Admin card", () => {
      const html = renderToString(<WorkspaceSelector profile={mockETeamProfile} />);

      // Vocabeer card check
      expect(html).toContain("Vocabeer");
      expect(html).toContain("Vào không gian học tập");

      // E-Team card check
      expect(html).toContain("E-Team");
      expect(html).toContain("Không gian làm việc và quản lý từ vựng dành cho thành viên E-Team.");
      expect(html).toContain("Vào E-Team");

      // Admin card should NOT be rendered
      expect(html).not.toContain("Admin Console");
      expect(html).not.toContain("Vào trang Quản trị");
    });
  });

  describe("Scenario 3: Admin signs in -> sees Vocabeer, E-Team, and Admin", () => {
    it("renders ALL 3 workspace cards: Vocabeer, E-Team, and Admin", () => {
      const html = renderToString(<WorkspaceSelector profile={mockAdminProfile} />);

      // Vocabeer card check
      expect(html).toContain("Vocabeer");
      expect(html).toContain("Vào không gian học tập");

      // E-Team card check
      expect(html).toContain("E-Team");
      expect(html).toContain("Vào E-Team");

      // Admin card check
      expect(html).toContain("Admin Console");
      expect(html).toContain("Không gian quản trị hệ thống, dữ liệu từ vựng và tài khoản người dùng.");
      expect(html).toContain("Vào trang Quản trị");
    });
  });
});
