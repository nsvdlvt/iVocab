import { describe, it, expect, vi, beforeEach } from "vitest";
import { WebPushService } from "./web-push-service";
import { PushSubscriptionRepository } from "@/repositories/push-subscription.repository";
import webpush from "web-push";

vi.mock("web-push", () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn(),
  },
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    getAll: () => [],
    setAll: () => {},
  })),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: vi.fn(async () => ({ error: null })),
      update: vi.fn(() => ({
        eq: vi.fn(async () => ({ error: null })),
      })),
    })),
  })),
}));

describe("WebPushService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = "mock_public_key";
    process.env.VAPID_PRIVATE_KEY = "mock_private_key";
    process.env.VAPID_SUBJECT = "mailto:test@vocabee.site";
  });

  describe("preparePayload", () => {
    it("should safely truncate long title and body to preserve Web Push size limits", () => {
      const longTitle = "A".repeat(200);
      const longBody = "B".repeat(1000);

      const jsonStr = WebPushService.preparePayload({
        title: longTitle,
        body: longBody,
        url: "/vocabulary",
      });

      const parsed = JSON.parse(jsonStr);
      expect(parsed.title.length).toBeLessThanOrEqual(120);
      expect(parsed.body.length).toBeLessThanOrEqual(300);
      expect(parsed.url).toBe("/vocabulary");
      expect(jsonStr.length).toBeLessThan(1024); // well below 3KB Web Push limit
    });

    it("should default url to /notifications if not provided", () => {
      const jsonStr = WebPushService.preparePayload({
        title: "Test",
        body: "Body",
      });

      const parsed = JSON.parse(jsonStr);
      expect(parsed.url).toBe("/notifications");
    });
  });

  describe("sendToSubscription", () => {
    const mockSub = {
      id: "sub-1",
      user_id: "user-1",
      endpoint: "https://fcm.googleapis.com/fcm/send/token123",
      p256dh: "key_p256dh",
      auth: "key_auth",
      device_name: "Chrome Desktop",
    };

    it("should successfully deliver notification when push service returns 201", async () => {
      vi.mocked(webpush.sendNotification).mockResolvedValueOnce({ statusCode: 201, body: "", headers: {} });
      const recordSuccessSpy = vi.spyOn(PushSubscriptionRepository, "recordDeliverySuccess").mockResolvedValueOnce();

      const result = await WebPushService.sendToSubscription(mockSub, JSON.stringify({ title: "Hi" }), "normal");

      expect(result.status).toBe("accepted");
      expect(result.statusCode).toBe(201);
      expect(recordSuccessSpy).toHaveBeenCalledWith("sub-1");
    });

    it("should deactivate subscription when push service returns 410 Gone (expired)", async () => {
      vi.mocked(webpush.sendNotification).mockRejectedValueOnce({ statusCode: 410, message: "Subscription expired" });
      const recordFailSpy = vi.spyOn(PushSubscriptionRepository, "recordDeliveryFailure").mockResolvedValueOnce();

      const result = await WebPushService.sendToSubscription(mockSub, JSON.stringify({ title: "Hi" }), "normal");

      expect(result.status).toBe("expired");
      expect(recordFailSpy).toHaveBeenCalledWith("sub-1", true);
    });

    it("should retry once on transient 500 error", async () => {
      vi.mocked(webpush.sendNotification)
        .mockRejectedValueOnce({ statusCode: 500, message: "Internal server error" })
        .mockResolvedValueOnce({ statusCode: 201, body: "", headers: {} });

      const recordSuccessSpy = vi.spyOn(PushSubscriptionRepository, "recordDeliverySuccess").mockResolvedValueOnce();

      const result = await WebPushService.sendToSubscription(mockSub, JSON.stringify({ title: "Hi" }), "normal");

      expect(result.status).toBe("accepted");
      expect(webpush.sendNotification).toHaveBeenCalledTimes(2);
      expect(recordSuccessSpy).toHaveBeenCalledWith("sub-1");
    });
  });

  describe("broadcastAnnouncement", () => {
    it("should return empty summary if no active subscriptions exist", async () => {
      vi.spyOn(PushSubscriptionRepository, "getActiveSubscriptionsForAudience").mockResolvedValueOnce([]);

      const summary = await WebPushService.broadcastAnnouncement({
        id: "ann-1",
        title: "Announcement",
        content: "Content",
        target_audience: "all",
      });

      expect(summary.attempted).toBe(0);
      expect(summary.accepted).toBe(0);
      expect(summary.failed).toBe(0);
    });

    it("should broadcast to all active subscriptions and record statistics", async () => {
      vi.spyOn(PushSubscriptionRepository, "getActiveSubscriptionsForAudience").mockResolvedValueOnce([
        {
          id: "sub-1",
          user_id: "user-1",
          endpoint: "https://fcm.googleapis.com/fcm/send/1",
          p256dh: "key1",
          auth: "auth1",
          device_name: "Phone",
        },
        {
          id: "sub-2",
          user_id: "user-2",
          endpoint: "https://fcm.googleapis.com/fcm/send/2",
          p256dh: "key2",
          auth: "auth2",
          device_name: "Laptop",
        },
      ]);

      vi.spyOn(WebPushService, "sendToSubscription")
        .mockResolvedValueOnce({ status: "accepted", statusCode: 201 })
        .mockResolvedValueOnce({ status: "failed", statusCode: 500 });

      const summary = await WebPushService.broadcastAnnouncement({
        id: "ann-1",
        title: "New Feature",
        content: "Detailed content",
        target_audience: "all",
      });

      expect(summary.attempted).toBe(2);
      expect(summary.accepted).toBe(1);
      expect(summary.failed).toBe(1);
    });
  });
});
