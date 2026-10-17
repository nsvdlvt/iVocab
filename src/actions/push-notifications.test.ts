import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getVapidPublicKeyAction,
  registerPushSubscriptionAction,
  unregisterPushSubscriptionAction,
  checkDevicePushStatusAction,
} from "./push-notifications";
import { PushSubscriptionRepository } from "@/repositories/push-subscription.repository";

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

describe("Push Notifications Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = "mock_public_key_12345";
  });

  describe("getVapidPublicKeyAction", () => {
    it("should return public key if configured in environment", async () => {
      const res = await getVapidPublicKeyAction();
      expect(res.ok).toBe(true);
      expect(res.publicKey).toBe("mock_public_key_12345");
    });

    it("should return error if public key is missing", async () => {
      delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      const res = await getVapidPublicKeyAction();
      expect(res.ok).toBe(false);
      expect(res.error).toContain("chưa cấu hình VAPID Public Key");
    });
  });

  describe("registerPushSubscriptionAction", () => {
    it("should reject unauthenticated caller", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: new Error("No session") });

      const res = await registerPushSubscriptionAction({
        endpoint: "https://fcm.googleapis.com/fcm/send/test",
        p256dh: "key",
        auth: "secret",
      });

      expect(res.ok).toBe(false);
      expect(res.error).toBe("Bạn cần đăng nhập để bật thông báo đẩy.");
    });

    it("should reject invalid endpoint URL not starting with https://", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "user-123" } }, error: null });

      const res = await registerPushSubscriptionAction({
        endpoint: "http://insecure-endpoint.com/push",
        p256dh: "key",
        auth: "secret",
      });

      expect(res.ok).toBe(false);
      expect(res.error).toContain("phải là URL https://");
    });

    it("should reject missing p256dh or auth keys", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "user-123" } }, error: null });

      const res = await registerPushSubscriptionAction({
        endpoint: "https://fcm.googleapis.com/fcm/send/test",
        p256dh: "",
        auth: "secret",
      });

      expect(res.ok).toBe(false);
      expect(res.error).toContain("Thiếu khóa mã hóa");
    });

    it("should register subscription successfully for valid payload", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "user-123" } }, error: null });
      const upsertSpy = vi.spyOn(PushSubscriptionRepository, "upsertSubscription").mockResolvedValueOnce({
        ok: true,
        id: "sub-123",
      });

      const res = await registerPushSubscriptionAction({
        endpoint: "https://fcm.googleapis.com/fcm/send/valid-endpoint",
        p256dh: "valid-p256dh",
        auth: "valid-auth",
        userAgent: "Mozilla/5.0",
        deviceName: "Máy tính",
      });

      expect(res.ok).toBe(true);
      expect(upsertSpy).toHaveBeenCalledWith("user-123", expect.objectContaining({
        endpoint: "https://fcm.googleapis.com/fcm/send/valid-endpoint",
        p256dh: "valid-p256dh",
        auth: "valid-auth",
      }));
    });
  });

  describe("unregisterPushSubscriptionAction", () => {
    it("should reject unauthenticated caller", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

      const res = await unregisterPushSubscriptionAction("https://endpoint.com");
      expect(res.ok).toBe(false);
      expect(res.error).toBe("Bạn cần đăng nhập để thao tác.");
    });

    it("should deactivate subscription successfully", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "user-123" } }, error: null });
      const deactSpy = vi.spyOn(PushSubscriptionRepository, "deactivateSubscription").mockResolvedValueOnce({
        ok: true,
      });

      const res = await unregisterPushSubscriptionAction("https://endpoint.com/sub-1");
      expect(res.ok).toBe(true);
      expect(deactSpy).toHaveBeenCalledWith("user-123", "https://endpoint.com/sub-1");
    });
  });

  describe("checkDevicePushStatusAction", () => {
    it("should return false if unauthenticated", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
      const res = await checkDevicePushStatusAction("https://endpoint.com");
      expect(res.isSubscribed).toBe(false);
    });

    it("should return active status from repository", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "user-123" } }, error: null });
      vi.spyOn(PushSubscriptionRepository, "isEndpointActive").mockResolvedValueOnce(true);

      const res = await checkDevicePushStatusAction("https://endpoint.com/sub-1");
      expect(res.isSubscribed).toBe(true);
    });
  });
});
