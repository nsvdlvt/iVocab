import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { ETeamDashboardContent } from "./ETeamDashboardContent";
import type { UserProfile } from "@/lib/auth/get-current-user";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

const mockETeamProfile: UserProfile = {
  id: "eteam-123",
  email: "content.editor@vocabee.site",
  role: "e_team",
  display_name: "Nguyễn Văn Biên Tập",
  avatar_url: null,
  level: "C1",
  streak: 0,
  longest_streak: 0,
  daily_goal: 10,
  last_activity_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockAdminProfile: UserProfile = {
  id: "admin-456",
  email: "superadmin@vocabee.site",
  role: "admin",
  display_name: "Admin Quản Trị",
  avatar_url: null,
  level: "C2",
  streak: 5,
  longest_streak: 10,
  daily_goal: 15,
  last_activity_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe("ETeamDashboardContent Component", () => {
  it("renders E-Team Dashboard title, real user greeting, and E-Team role badge", () => {
    const html = renderToString(<ETeamDashboardContent profile={mockETeamProfile} />);

    expect(html).toContain("E-Team Dashboard");
    expect(html).toContain("Nguyễn Văn Biên Tập");
    expect(html).toContain("E-Team Workspace");
    expect(html).toContain("E-Team");
  });

  it("renders workspace introduction and honest empty state without fake KPIs", () => {
    const html = renderToString(<ETeamDashboardContent profile={mockETeamProfile} />);

    expect(html).toContain("Giới thiệu Không gian E-Team");
    expect(html).toContain("Chưa có dữ liệu nghiệp vụ");
    expect(html).toContain("Tài khoản của bạn hiện chưa được phân công nhiệm vụ cụ thể nào");

    // Must NOT contain fake metrics or fake tasks
    expect(html).not.toContain("99,999");
    expect(html).not.toContain("Hoàn thành 100%");
    expect(html).not.toContain("fake-chart");
  });

  it("renders quick link to Admin Console when user is Admin", () => {
    const html = renderToString(<ETeamDashboardContent profile={mockAdminProfile} />);

    expect(html).toContain("Trang quản trị (Admin Console)");
    expect(html).toContain("Admin");
  });

  it("does not render Admin Console link for E-Team role", () => {
    const html = renderToString(<ETeamDashboardContent profile={mockETeamProfile} />);

    expect(html).not.toContain("Trang quản trị (Admin Console)");
  });
});
