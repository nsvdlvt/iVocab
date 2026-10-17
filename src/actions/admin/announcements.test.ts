import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createAnnouncementAction,
  updateAnnouncementAction,
  getAudienceEstimateAction,
} from "./announcements";
import { assertAdmin } from "@/lib/auth/admin";
import { AdminAnnouncementRepository } from "@/repositories/admin/announcement.repository";
import { AdminAuditRepository } from "@/repositories/admin/audit.repository";

vi.mock("@/lib/auth/admin", () => ({
  assertAdmin: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("Admin Announcements Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Validation & Security", () => {
    it("should reject creation if caller is not an admin", async () => {
      vi.mocked(assertAdmin).mockRejectedValueOnce(new Error("Unauthorized"));

      const res = await createAnnouncementAction({
        title: "Test Title",
        content: "Test Content Here",
        type: "info",
        target_audience: "all",
      });

      expect(res.ok).toBe(false);
      expect(res.error).toContain("Unauthorized");
    });

    it("should reject empty or too short title", async () => {
      vi.mocked(assertAdmin).mockResolvedValueOnce({
        user: { id: "admin-1", email: "admin@vocabee.app" } as any,
        role: "admin" as const,
        supabase: {} as any,
      });

      const res = await createAnnouncementAction({
        title: "Hi",
        content: "Valid length content here",
        type: "info",
        target_audience: "all",
      });

      expect(res.ok).toBe(false);
      expect(res.error).toBe("Tiêu đề thông báo phải có ít nhất 3 ký tự");
    });

    it("should reject empty or too short content", async () => {
      vi.mocked(assertAdmin).mockResolvedValueOnce({
        user: { id: "admin-1", email: "admin@vocabee.app" } as any,
        role: "admin" as const,
        supabase: {} as any,
      });

      const res = await createAnnouncementAction({
        title: "Valid Title",
        content: "Hey",
        type: "info",
        target_audience: "all",
      });

      expect(res.ok).toBe(false);
      expect(res.error).toBe("Nội dung thông báo phải có ít nhất 5 ký tự");
    });

    it("should reject unsafe action URLs like javascript:", async () => {
      vi.mocked(assertAdmin).mockResolvedValueOnce({
        user: { id: "admin-1", email: "admin@vocabee.app" } as any,
        role: "admin" as const,
        supabase: {} as any,
      });

      const res = await createAnnouncementAction({
        title: "Valid Title",
        content: "Valid content text goes here",
        type: "info",
        target_audience: "all",
        action_url: "javascript:alert(1)",
      });

      expect(res.ok).toBe(false);
      expect(res.error).toContain("Liên kết đính kèm không hợp lệ");
    });

    it("should reject scheduled dates where end_at is before start_at", async () => {
      vi.mocked(assertAdmin).mockResolvedValueOnce({
        user: { id: "admin-1", email: "admin@vocabee.app" } as any,
        role: "admin" as const,
        supabase: {} as any,
      });

      const res = await createAnnouncementAction({
        title: "Valid Title",
        content: "Valid content text goes here",
        type: "info",
        target_audience: "all",
        start_at: "2026-12-31T10:00:00Z",
        end_at: "2026-01-01T10:00:00Z",
      });

      expect(res.ok).toBe(false);
      expect(res.error).toBe("Thời gian kết thúc phải diễn ra sau thời gian bắt đầu");
    });
  });

  describe("Successful Creation & Auditing", () => {
    it("should create announcement and write audit log for valid payload", async () => {
      vi.mocked(assertAdmin).mockResolvedValueOnce({
        user: { id: "admin-1", email: "admin@vocabee.app" } as any,
        role: "admin" as const,
        supabase: {} as any,
      });

      const createdAnn = {
        id: "11111111-2222-3333-4444-555555555555",
        title: "Bản cập nhật v2",
        content: "Hệ thống vừa cập nhật các tính năng mới thú vị",
        summary: "Tóm tắt ngắn gọn",
        type: "info" as const,
        priority: "normal" as const,
        target_audience: "all" as const,
        status: "published" as const,
        action_url: "/review",
        is_active: true,
        created_at: new Date().toISOString(),
        published_at: new Date().toISOString(),
      };

      const createSpy = vi.spyOn(AdminAnnouncementRepository, "createAnnouncement").mockResolvedValueOnce({
        ok: true,
        data: createdAnn as any,
      });
      const auditSpy = vi.spyOn(AdminAuditRepository, "logAction").mockResolvedValueOnce({} as any);

      const res = await createAnnouncementAction({
        title: "Bản cập nhật v2",
        content: "Hệ thống vừa cập nhật các tính năng mới thú vị",
        summary: "Tóm tắt ngắn gọn",
        type: "info",
        target_audience: "all",
        action_url: "/review",
      });

      expect(res.ok).toBe(true);
      expect(res.id).toBe("11111111-2222-3333-4444-555555555555");
      expect(createSpy).toHaveBeenCalled();
      expect(auditSpy).toHaveBeenCalledWith(
        "create_announcement",
        "announcement",
        "11111111-2222-3333-4444-555555555555",
        expect.objectContaining({
          title: "Bản cập nhật v2",
        })
      );
    });
  });

  describe("Audience Estimation", () => {
    it("should query repository for audience estimate", async () => {
      vi.mocked(assertAdmin).mockResolvedValueOnce({
        user: { id: "admin-1" } as any,
        role: "admin" as const,
        supabase: {} as any,
      });
      vi.spyOn(AdminAnnouncementRepository, "getAudienceEstimate").mockResolvedValueOnce(42);

      const res = await getAudienceEstimateAction("all");
      expect(res.ok).toBe(true);
      expect(res.count).toBe(42);
    });
  });
});
