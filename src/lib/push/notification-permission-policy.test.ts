import { describe, it, expect } from "vitest";
import {
  shouldShowNotificationPrompt,
  urlBase64ToUint8Array,
  DISMISS_COOLDOWN_MS,
  type ShouldShowPromptParams,
} from "./notification-permission-policy";

describe("Notification Permission Policy", () => {
  const baseEligibleParams: ShouldShowPromptParams = {
    isSecureContext: true,
    hasNotification: true,
    hasServiceWorker: true,
    hasPushManager: true,
    sessionDismissed: false,
    browserPermission: "default",
    storedStatus: null,
    dismissedAtTimestamp: null,
    isSubscribedOnDevice: false,
    currentTime: 1700000000000,
  };

  it("should permit prompt when user has not been asked and environment supports Web Push", () => {
    const result = shouldShowNotificationPrompt(baseEligibleParams);
    expect(result).toBe(true);
  });

  it("should reject prompt in non-secure HTTP context", () => {
    const result = shouldShowNotificationPrompt({
      ...baseEligibleParams,
      isSecureContext: false,
    });
    expect(result).toBe(false);
  });

  it("should reject prompt when Notification API is unsupported", () => {
    const result = shouldShowNotificationPrompt({
      ...baseEligibleParams,
      hasNotification: false,
    });
    expect(result).toBe(false);
  });

  it("should reject prompt when Service Worker is unsupported", () => {
    const result = shouldShowNotificationPrompt({
      ...baseEligibleParams,
      hasServiceWorker: false,
    });
    expect(result).toBe(false);
  });

  it("should reject prompt when PushManager is unsupported", () => {
    const result = shouldShowNotificationPrompt({
      ...baseEligibleParams,
      hasPushManager: false,
    });
    expect(result).toBe(false);
  });

  it("should reject prompt if dismissed during current browser session", () => {
    const result = shouldShowNotificationPrompt({
      ...baseEligibleParams,
      sessionDismissed: true,
    });
    expect(result).toBe(false);
  });

  it("should reject prompt if browser permission is already granted", () => {
    const result = shouldShowNotificationPrompt({
      ...baseEligibleParams,
      browserPermission: "granted",
    });
    expect(result).toBe(false);
  });

  it("should reject prompt if device is already actively subscribed", () => {
    const result = shouldShowNotificationPrompt({
      ...baseEligibleParams,
      isSubscribedOnDevice: true,
    });
    expect(result).toBe(false);
  });

  it("should reject prompt if storedStatus is already enabled", () => {
    const result = shouldShowNotificationPrompt({
      ...baseEligibleParams,
      storedStatus: "enabled",
    });
    expect(result).toBe(false);
  });

  it("should reject prompt if browser permission is denied", () => {
    const result = shouldShowNotificationPrompt({
      ...baseEligibleParams,
      browserPermission: "denied",
    });
    expect(result).toBe(false);
  });

  it("should reject prompt if storedStatus is blocked", () => {
    const result = shouldShowNotificationPrompt({
      ...baseEligibleParams,
      storedStatus: "blocked",
    });
    expect(result).toBe(false);
  });

  it("should reject prompt if dismissed within cooldown period (e.g. 2 days ago)", () => {
    const twoDaysAgo = baseEligibleParams.currentTime! - 2 * 24 * 60 * 60 * 1000;
    const result = shouldShowNotificationPrompt({
      ...baseEligibleParams,
      storedStatus: "dismissed",
      dismissedAtTimestamp: twoDaysAgo,
    });
    expect(result).toBe(false);
  });

  it("should allow prompt if dismissed more than 7 days ago (cooldown expired)", () => {
    const eightDaysAgo = baseEligibleParams.currentTime! - 8 * 24 * 60 * 60 * 1000;
    const result = shouldShowNotificationPrompt({
      ...baseEligibleParams,
      storedStatus: "dismissed",
      dismissedAtTimestamp: eightDaysAgo,
    });
    expect(result).toBe(true);
  });

  it("should correctly convert url-safe base64 string to Uint8Array", () => {
    const vapidKey = "BFrSQWtZTgSiRPo3ndCdmFpuku6cVrCWZ2TrU4U__udhs3L7aixmWikTFb_SvNErfwnXsq2OTDsLbS6WsibSQgQ";
    const uint8 = urlBase64ToUint8Array(vapidKey);

    expect(uint8).toBeInstanceOf(Uint8Array);
    expect(uint8.length).toBe(65);
  });
});
