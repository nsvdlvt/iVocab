export const STORAGE_KEY_STATUS = "vocabee_push_prompt_status";
export const STORAGE_KEY_DISMISSED_AT = "vocabee_push_prompt_dismissed_at";
export const SESSION_KEY_DISMISSED = "vocabee_push_prompt_session_dismissed";
export const DISMISS_COOLDOWN_DAYS = 7;
export const DISMISS_COOLDOWN_MS = DISMISS_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

export type PromptStatus = "not_asked" | "dismissed" | "enabled" | "blocked";

export interface ShouldShowPromptParams {
  isSecureContext: boolean;
  hasNotification: boolean;
  hasServiceWorker: boolean;
  hasPushManager: boolean;
  sessionDismissed: boolean;
  browserPermission: NotificationPermission | "default" | "granted" | "denied";
  storedStatus: PromptStatus | string | null;
  dismissedAtTimestamp: number | null;
  isSubscribedOnDevice?: boolean;
  currentTime?: number;
}

/**
 * Determines whether the First-Visit Notification Permission Popup should be shown.
 * Strictly adheres to Vocabee notification policies:
 * - Does not show if browser lacks Web Push or is insecure context.
 * - Does not show if already dismissed in the current browsing session.
 * - Does not show if already enabled or granted.
 * - Does not show if permission is denied / blocked by the user.
 * - Respects the 7-day cooldown when dismissed via "Để sau".
 */
export function shouldShowNotificationPrompt(params: ShouldShowPromptParams): boolean {
  const {
    isSecureContext,
    hasNotification,
    hasServiceWorker,
    hasPushManager,
    sessionDismissed,
    browserPermission,
    storedStatus,
    dismissedAtTimestamp,
    isSubscribedOnDevice = false,
    currentTime = Date.now(),
  } = params;

  // Must be supported & secure
  if (!isSecureContext || !hasNotification || !hasServiceWorker || !hasPushManager) {
    return false;
  }

  // Session dismissal check (do not show repeatedly on route changes in same session)
  if (sessionDismissed) {
    return false;
  }

  // Already granted or actively subscribed
  if (browserPermission === "granted" || isSubscribedOnDevice || storedStatus === "enabled") {
    return false;
  }

  // Explicitly blocked/denied by user
  if (browserPermission === "denied" || storedStatus === "blocked") {
    return false;
  }

  // Dismissed cooldown check (7 days)
  if (storedStatus === "dismissed" && dismissedAtTimestamp) {
    const elapsed = currentTime - dismissedAtTimestamp;
    if (elapsed < DISMISS_COOLDOWN_MS) {
      return false;
    }
  }

  return true;
}

/**
 * Convert URL safe base64 VAPID public key to Uint8Array for PushManager
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData =
    typeof window !== "undefined" && typeof window.atob === "function"
      ? window.atob(base64)
      : Buffer.from(base64, "base64").toString("binary");

  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
