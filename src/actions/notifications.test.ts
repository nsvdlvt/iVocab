import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getUserNotificationsAction,
  getUnreadNotificationCountAction,
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
  dismissNotificationAction,
} from "./notifications";
import { UserNotificationsRepository } from "@/repositories/user-notifications.repository";

const mockGetUser = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
  })),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    getAll: () => [],
    setAll: () => {},
  })),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("User Notifications Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Authentication Gate", () => {
    it("should return unauthenticated error when user is not logged in", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: new Error("No session") });

      const res = await getUserNotificationsAction();
      expect(res.ok).toBe(false);
      expect(res.error).toBe("Chưa đăng nhập");
    });

    it("should reject markAsRead if unauthenticated", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

      const res = await markNotificationAsReadAction("some-id");
      expect(res.ok).toBe(false);
      expect(res.error).toBe("Chưa đăng nhập");
    });

    it("should reject dismiss if unauthenticated", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

      const res = await dismissNotificationAction("some-id");
      expect(res.ok).toBe(false);
      expect(res.error).toBe("Chưa đăng nhập");
    });

    it("should reject markAllAsRead if unauthenticated", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

      const res = await markAllNotificationsAsReadAction();
      expect(res.ok).toBe(false);
      expect(res.error).toBe("Chưa đăng nhập");
    });
  });

  describe("Validation", () => {
    it("should reject empty announcementId for markNotificationAsReadAction", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "user-123" } }, error: null });

      const res = await markNotificationAsReadAction("");
      expect(res.ok).toBe(false);
      expect(res.error).toBe("Mã thông báo không hợp lệ");
    });

    it("should reject empty announcementId for dismissNotificationAction", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "user-123" } }, error: null });

      const res = await dismissNotificationAction("");
      expect(res.ok).toBe(false);
      expect(res.error).toBe("Mã thông báo không hợp lệ");
    });
  });

  describe("Successful operations", () => {
    it("should return notifications and unread count for authenticated user", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "user-123" } }, error: null });
      vi.spyOn(UserNotificationsRepository, "getUserNotifications").mockResolvedValueOnce({
        items: [
          {
            id: "ann-1",
            title: "Test Announcement",
            content: "Content",
            summary: "Summary",
            type: "info",
            priority: "normal",
            action_url: "/review",
            published_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            is_read: false,
            read_at: null,
            dismissed_at: null,
          },
        ],
        unreadCount: 1,
      });

      const res = await getUserNotificationsAction("all", 10);
      expect(res.ok).toBe(true);
      expect(res.items).toHaveLength(1);
      expect(res.unreadCount).toBe(1);
    });

    it("should return unread count correctly", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "user-123" } }, error: null });
      vi.spyOn(UserNotificationsRepository, "getUnreadCount").mockResolvedValueOnce(3);

      const res = await getUnreadNotificationCountAction();
      expect(res.ok).toBe(true);
      expect(res.count).toBe(3);
    });

    it("should delegate markAsRead to repository with authenticated user ID", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "user-123" } }, error: null });
      const markSpy = vi.spyOn(UserNotificationsRepository, "markAsRead").mockResolvedValueOnce(true);

      const res = await markNotificationAsReadAction("ann-1");
      expect(res.ok).toBe(true);
      expect(markSpy).toHaveBeenCalledWith("user-123", "ann-1");
    });

    it("should delegate markAllAsRead to repository", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "user-123" } }, error: null });
      const markAllSpy = vi.spyOn(UserNotificationsRepository, "markAllAsRead").mockResolvedValueOnce(true);

      const res = await markAllNotificationsAsReadAction();
      expect(res.ok).toBe(true);
      expect(markAllSpy).toHaveBeenCalledWith("user-123");
    });

    it("should delegate dismissNotification to repository", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "user-123" } }, error: null });
      const dismissSpy = vi.spyOn(UserNotificationsRepository, "dismissNotification").mockResolvedValueOnce(true);

      const res = await dismissNotificationAction("ann-1");
      expect(res.ok).toBe(true);
      expect(dismissSpy).toHaveBeenCalledWith("user-123", "ann-1");
    });
  });
});
