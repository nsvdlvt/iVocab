"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  BellRing,
  BookOpen,
  Flame,
  Trophy,
  Sparkles,
  Loader2,
  CheckCircle2,
  Share2,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { BeeMascot, type MascotState } from "@/components/mascot/BeeMascot";
import {
  getVapidPublicKeyAction,
  registerPushSubscriptionAction,
  checkDevicePushStatusAction,
} from "@/actions/push-notifications";
import { cn } from "@/lib/utils";

import {
  STORAGE_KEY_STATUS,
  STORAGE_KEY_DISMISSED_AT,
  SESSION_KEY_DISMISSED,
  shouldShowNotificationPrompt,
  urlBase64ToUint8Array,
} from "@/lib/push/notification-permission-policy";

export type ModalViewMode =
  | "initial"
  | "ios_guide"
  | "subscribing"
  | "success"
  | "denied"
  | "error";

export function NotificationPermissionModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ModalViewMode>("initial");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Device & browser detection states
  const [isIosDevice, setIsIosDevice] = useState(false);
  const [isStandalonePwa, setIsStandalonePwa] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  // Mascot dynamic mood state based on modal phase
  const getMascotState = (): MascotState => {
    switch (viewMode) {
      case "success":
        return "celebrating";
      case "subscribing":
        return "thinking";
      case "denied":
      case "error":
        return "encouraging";
      case "ios_guide":
        return "reading";
      case "initial":
      default:
        return "welcome";
    }
  };

  // Safe service worker retrieval without indefinite hang
  const getSafeServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;
    try {
      let reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      }
      const readyReg = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<ServiceWorkerRegistration | null>((resolve) =>
          setTimeout(() => resolve(reg || null), 3000)
        ),
      ]);
      return readyReg || reg;
    } catch {
      return null;
    }
  };

  // Check eligibility and determine whether to trigger first-visit popup
  const checkEligibility = useCallback(async (forceTrigger = false) => {
    if (typeof window === "undefined") return;

    // Detect iOS & Standalone
    const userAgent = window.navigator.userAgent || "";
    const appleMobile =
      /iPad|iPhone|iPod/.test(userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIsIosDevice(appleMobile);

    const standalone =
      Boolean((navigator as any).standalone) ||
      window.matchMedia("(display-mode: standalone)").matches;
    setIsStandalonePwa(standalone);

    // Context & API support
    const hasNotification = "Notification" in window;
    const hasSW = "serviceWorker" in navigator;
    const hasPushManager = "PushManager" in window;

    if (!window.isSecureContext || !hasNotification || !hasSW || !hasPushManager) {
      setIsSupported(false);
      return;
    }

    setIsSupported(true);

    // If forced (via test query or custom event), open immediately
    if (forceTrigger) {
      if (appleMobile && !standalone) {
        setViewMode("ios_guide");
      } else {
        setViewMode("initial");
      }
      setIsOpen(true);
      return;
    }

    // 1. Session check: do not show again in the same browsing tab session
    if (sessionStorage.getItem(SESSION_KEY_DISMISSED) === "true") {
      return;
    }

    // 2. Real browser permission check
    const currentPermission = Notification.permission;

    if (currentPermission === "granted") {
      // Check if user is already actively subscribed on this device
      try {
        const reg = await getSafeServiceWorker();
        const sub = reg ? await reg.pushManager.getSubscription() : null;
        if (sub) {
          const statusRes = await checkDevicePushStatusAction(sub.endpoint);
          if (statusRes.isSubscribed) {
            localStorage.setItem(STORAGE_KEY_STATUS, "enabled");
            return;
          }
        }
      } catch {
        // Fallback: do not bother user if already granted
        localStorage.setItem(STORAGE_KEY_STATUS, "enabled");
        return;
      }
    } else if (currentPermission === "denied") {
      localStorage.setItem(STORAGE_KEY_STATUS, "blocked");
      return;
    }

    // 3. Stored status & cooldown policy verification
    const storedStatus = localStorage.getItem(STORAGE_KEY_STATUS);
    const dismissedAtStr = localStorage.getItem(STORAGE_KEY_DISMISSED_AT);
    const dismissedAt = dismissedAtStr ? Number(dismissedAtStr) : null;
    const sessionDismissed = sessionStorage.getItem(SESSION_KEY_DISMISSED) === "true";

    const eligible = shouldShowNotificationPrompt({
      isSecureContext: window.isSecureContext,
      hasNotification,
      hasServiceWorker: hasSW,
      hasPushManager,
      sessionDismissed,
      browserPermission: currentPermission,
      storedStatus,
      dismissedAtTimestamp: dismissedAt,
    });

    if (!eligible) return;

    // 5. Eligible! Wait until the main interface has loaded stably (2000ms delay)
    const timer = setTimeout(() => {
      if (appleMobile && !standalone) {
        setViewMode("ios_guide");
      } else {
        setViewMode("initial");
      }
      setIsOpen(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    checkEligibility();

    // Check for explicit query param (?prompt_push=1) or dev inspection
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("prompt_push") === "1" || params.get("prompt_push") === "true") {
        checkEligibility(true);
      }
    }

    // Custom events for cross-component sync
    const handleOpenEvent = () => checkEligibility(true);
    const handleStatusSync = () => {
      const status = localStorage.getItem(STORAGE_KEY_STATUS);
      if (status === "enabled") {
        setIsOpen(false);
      }
    };

    window.addEventListener("vocabee_open_push_modal", handleOpenEvent);
    window.addEventListener("vocabee_push_status_changed", handleStatusSync);

    return () => {
      window.removeEventListener("vocabee_open_push_modal", handleOpenEvent);
      window.removeEventListener("vocabee_push_status_changed", handleStatusSync);
    };
  }, [checkEligibility]);

  // Handle dismissal (close button or "Để sau")
  const handleDismiss = () => {
    setIsOpen(false);
    sessionStorage.setItem(SESSION_KEY_DISMISSED, "true");
    localStorage.setItem(STORAGE_KEY_STATUS, "dismissed");
    localStorage.setItem(STORAGE_KEY_DISMISSED_AT, Date.now().toString());
  };

  // Open modal change handler
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handleDismiss();
    } else {
      setIsOpen(true);
    }
  };

  // Subscribe to Browser Web Push
  const handleSubscribe = async () => {
    if (!isSupported) {
      setViewMode("error");
      setErrorMessage("Trình duyệt hiện tại không hỗ trợ Web Push Notifications.");
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setViewMode("subscribing");

    try {
      // 1. Request permission after direct user click
      const perm = await Notification.requestPermission();

      if (perm === "denied") {
        setViewMode("denied");
        localStorage.setItem(STORAGE_KEY_STATUS, "blocked");
        setIsProcessing(false);
        return;
      }

      if (perm !== "granted") {
        // Dismissed permission dialog
        setViewMode("initial");
        setIsProcessing(false);
        return;
      }

      // 2. Fetch configured VAPID public key
      const vapidRes = await getVapidPublicKeyAction();
      const publicKey =
        vapidRes.publicKey ||
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
        "BFrSQWtZTgSiRPo3ndCdmFpuku6cVrCWZ2TrU4U__udhs3L7aixmWikTFb_SvNErfwnXsq2OTDsLbS6WsibSQgQ";

      // 3. Register or reuse existing Service Worker
      const activeReg = await getSafeServiceWorker();
      if (!activeReg) {
        throw new Error("Không thể khởi động Service Worker trên trình duyệt này.");
      }

      // 4. Create or obtain Push Subscription
      const applicationServerKey = urlBase64ToUint8Array(publicKey);
      let sub = await activeReg.pushManager.getSubscription();

      if (!sub) {
        sub = await activeReg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey as unknown as string,
        });
      }

      const subJson = sub.toJSON();
      if (!subJson.keys?.p256dh || !subJson.keys?.auth) {
        throw new Error("Không thể trích xuất khóa mã hóa bảo mật từ thiết bị.");
      }

      // 5. Send subscription to backend repository via Server Action (with upsert)
      const res = await registerPushSubscriptionAction({
        endpoint: sub.endpoint,
        p256dh: subJson.keys.p256dh,
        auth: subJson.keys.auth,
        userAgent: navigator.userAgent,
        deviceName: isIosDevice
          ? "iPhone/iPad (PWA)"
          : navigator.userAgent.includes("Mobile")
          ? "Điện thoại"
          : "Máy tính",
      });

      if (!res.ok) {
        throw new Error(res.error || "Máy chủ không thể lưu thông tin đăng ký Push.");
      }

      // 6. Confirmed active subscription!
      localStorage.setItem(STORAGE_KEY_STATUS, "enabled");
      sessionStorage.setItem(SESSION_KEY_DISMISSED, "true");
      window.dispatchEvent(new CustomEvent("vocabee_push_status_changed"));

      setViewMode("success");

      // Auto close after 2.6 seconds of celebration
      setTimeout(() => {
        setIsOpen(false);
      }, 2600);
    } catch (err: any) {
      console.error("Push subscription error:", err);
      setErrorMessage(err.message || "Đã xảy ra sự cố khi đăng ký nhận thông báo.");
      setViewMode("error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGoToSettings = () => {
    handleDismiss();
    router.push("/settings");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-[460px] p-0 overflow-hidden border border-border/80 shadow-2xl rounded-3xl bg-card text-card-foreground"
        showCloseButton={true}
      >
        {/* Subtle decorative brand banner top */}
        <div className="relative pt-6 pb-2 px-6 flex flex-col items-center bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent">
          {/* Header Tag */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25 mb-4 shadow-2xs">
            <BellRing className="h-3 w-3 text-amber-600 dark:text-amber-400" />
            <span>Thông báo học tập Vocabee</span>
          </div>

          {/* Vocabee Bee Mascot with gentle hovering motion */}
          <div className="relative my-1 flex items-center justify-center">
            {/* Small floating sparkles around mascot */}
            <div className="absolute -top-1 -left-4 p-1 rounded-full bg-amber-400/20 text-amber-600 dark:text-amber-300 animate-pulse">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <div className="absolute -bottom-1 -right-3 p-1 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 animate-bounce">
              <Sparkles className="h-3 w-3" />
            </div>

            <BeeMascot
              state={getMascotState()}
              size="lg"
              animated={true}
              showAura={true}
              interactive={true}
            />
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="px-6 pb-6 pt-2 space-y-5">
          <DialogHeader className="text-center space-y-2">
            <DialogTitle className="text-lg sm:text-xl font-bold font-heading text-foreground tracking-tight text-center">
              {viewMode === "success"
                ? "Bật thông báo thành công!"
                : viewMode === "denied"
                ? "Quyền thông báo đang bị tắt"
                : viewMode === "error"
                ? "Không thể bật thông báo"
                : viewMode === "ios_guide"
                ? "Cài đặt Vocabee trên iPhone / iPad"
                : "Đừng bỏ lỡ hành trình học tập của bạn! 🐝"}
            </DialogTitle>

            <DialogDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed text-center max-w-sm mx-auto">
              {viewMode === "success"
                ? "Vocabee đã sẵn sàng đồng hành cùng bạn mỗi ngày với các lời nhắc ôn tập thông minh!"
                : viewMode === "denied"
                ? "Bạn đã từ chối quyền thông báo trên trình duyệt. Bạn có thể bật lại trong cài đặt trang web bất cứ lúc nào."
                : viewMode === "error"
                ? errorMessage || "Đã xảy ra sự cố trong quá trình kích hoạt Web Push. Vui lòng thử lại."
                : viewMode === "ios_guide"
                ? "Để nhận thông báo đẩy khi tắt màn hình, Safari yêu cầu bạn thêm Vocabee vào Màn hình chính."
                : "Bật thông báo để Vocabee nhắc bạn ôn tập từ vựng, duy trì streak và cập nhật những cột mốc học tập mới nhé!"}
            </DialogDescription>
          </DialogHeader>

          {/* VIEW: INITIAL (3 Key Benefits) */}
          {(viewMode === "initial" || viewMode === "subscribing") && (
            <div className="space-y-2.5 pt-1">
              {/* Benefit 1 */}
              <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-muted/40 border border-border/50 transition-colors">
                <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                  <BookOpen className="h-4 w-4" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-foreground">
                    Nhắc ôn tập đúng lúc
                  </h4>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    Thuật toán SRS nhắc bạn ôn từ vựng ngay trước khi quên để ghi nhớ lâu dài.
                  </p>
                </div>
              </div>

              {/* Benefit 2 */}
              <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-muted/40 border border-border/50 transition-colors">
                <div className="p-2 rounded-xl bg-orange-500/15 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5">
                  <Flame className="h-4 w-4" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-foreground">
                    Giúp bạn duy trì thói quen học tập
                  </h4>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    Bảo vệ chuỗi ngày học liên tục (streak) với thông báo vào thời gian bạn rảnh.
                  </p>
                </div>
              </div>

              {/* Benefit 3 */}
              <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-muted/40 border border-border/50 transition-colors">
                <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                  <Trophy className="h-4 w-4" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-foreground">
                    Cập nhật thành tích và hoạt động mới
                  </h4>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    Nhận huy hiệu, theo dõi tiến độ thi đua và các sự kiện thử thách cùng bạn bè.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: SUCCESS */}
          {viewMode === "success" && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-800 dark:text-emerald-300 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <p className="text-xs leading-relaxed font-medium">
                Thiết bị này đã được đăng ký nhận thông báo đẩy. Bạn có thể tùy chỉnh tần suất và khung giờ yên tĩnh trong phần <strong>Cài đặt</strong> bất kỳ lúc nào.
              </p>
            </div>
          )}

          {/* VIEW: DENIED / BLOCKED GUIDANCE */}
          {viewMode === "denied" && (
            <div className="space-y-3 pt-1">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-200 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-100">
                  <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Cách mở lại quyền trên trình duyệt:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground dark:text-amber-200/90 pl-1 leading-relaxed">
                  <li>Bấm vào biểu tượng ổ khóa hoặc cài đặt ở thanh địa chỉ web.</li>
                  <li>Tìm mục <strong>Thông báo (Notifications)</strong> và chọn <strong>Cho phép (Allow)</strong>.</li>
                  <li>Tải lại trang để áp dụng thay đổi.</li>
                </ol>
              </div>
            </div>
          )}

          {/* VIEW: iOS GUIDE */}
          {viewMode === "ios_guide" && (
            <div className="space-y-3 pt-1">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-xs space-y-2.5">
                <div className="flex items-center gap-2 font-bold text-foreground">
                  <Share2 className="h-4 w-4 text-[#f9971d] shrink-0" />
                  <span>3 bước đơn giản trên Safari iOS:</span>
                </div>
                <div className="space-y-2 text-muted-foreground text-[11px] leading-relaxed">
                  <div className="flex items-start gap-2">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#f9971d]/20 text-[#f9971d] font-bold text-[10px]">1</span>
                    <span>Bấm nút <strong>Chia sẻ (Share)</strong> trên thanh công cụ dưới cùng của trình duyệt Safari.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#f9971d]/20 text-[#f9971d] font-bold text-[10px]">2</span>
                    <span>Cuộn xuống danh sách tùy chọn và chọn <strong>&ldquo;Thêm vào MH chính&rdquo; (Add to Home Screen)</strong>.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#f9971d]/20 text-[#f9971d] font-bold text-[10px]">3</span>
                    <span>Mở Vocabee từ biểu tượng ngoài Màn hình chính để kích hoạt nhận thông báo.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: ERROR */}
          {viewMode === "error" && (
            <div className="p-3.5 rounded-2xl bg-destructive/10 border border-destructive/25 text-destructive text-xs flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">Đăng ký thông báo chưa hoàn tất</p>
                <p className="text-[11px] leading-relaxed opacity-90">
                  {errorMessage || "Vui lòng kiểm tra kết nối mạng và thử lại sau."}
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons Footer */}
          <div className="space-y-2 pt-2">
            {viewMode === "initial" || viewMode === "subscribing" ? (
              <>
                <Button
                  type="button"
                  onClick={handleSubscribe}
                  disabled={isProcessing}
                  className="w-full h-11 rounded-2xl bg-[#f9971d] hover:bg-[#e08312] text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200 gap-2 cursor-pointer border-0"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Đang bật thông báo...</span>
                    </>
                  ) : (
                    <>
                      <BellRing className="h-4 w-4" />
                      <span>Bật thông báo</span>
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleDismiss}
                  disabled={isProcessing}
                  className="w-full h-9 rounded-xl text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Để sau
                </Button>
              </>
            ) : viewMode === "success" ? (
              <Button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full h-11 rounded-2xl bg-[#f9971d] hover:bg-[#e08312] text-white font-semibold text-sm shadow-md transition-all gap-2 cursor-pointer border-0"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Bắt đầu học ngay</span>
              </Button>
            ) : viewMode === "denied" ? (
              <div className="space-y-2">
                <Button
                  type="button"
                  onClick={handleGoToSettings}
                  className="w-full h-10 rounded-xl bg-card border border-border text-foreground hover:bg-muted font-semibold text-xs gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Mở Cài đặt thông báo Vocabee</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleDismiss}
                  className="w-full h-8 rounded-xl text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Đóng
                </Button>
              </div>
            ) : viewMode === "ios_guide" ? (
              <Button
                type="button"
                onClick={handleDismiss}
                className="w-full h-10 rounded-2xl bg-[#f9971d] hover:bg-[#e08312] text-white font-semibold text-xs shadow-md transition-all cursor-pointer border-0"
              >
                Đã hiểu
              </Button>
            ) : (
              // Error view
              <div className="space-y-2">
                <Button
                  type="button"
                  onClick={handleSubscribe}
                  disabled={isProcessing}
                  className="w-full h-10 rounded-xl bg-[#f9971d] hover:bg-[#e08312] text-white font-semibold text-xs gap-1.5 cursor-pointer border-0"
                >
                  {isProcessing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <BellRing className="h-3.5 w-3.5" />
                  )}
                  <span>Thử lại</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleDismiss}
                  disabled={isProcessing}
                  className="w-full h-8 rounded-xl text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Để sau
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
