"use client";

import React, { useState, useEffect } from "react";
import { BellRing, X, Smartphone, Share2, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getVapidPublicKeyAction,
  registerPushSubscriptionAction,
  checkDevicePushStatusAction,
} from "@/actions/push-notifications";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushNotificationPromptBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successText, setSuccessText] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Do not show if dismissed in this session
    if (sessionStorage.getItem("dismissed_push_prompt") === "true") return;

    // Check secure context
    if (!window.isSecureContext) return;

    // Detect iOS
    const userAgent = window.navigator.userAgent || "";
    const isAppleMobile =
      /iPad|iPhone|iPod/.test(userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIsIos(isAppleMobile);

    const standalone =
      (navigator as any).standalone ||
      window.matchMedia("(display-mode: standalone)").matches;
    setIsStandalone(Boolean(standalone));

    // Web Push capability check
    const hasNotification = "Notification" in window;
    const hasSW = "serviceWorker" in navigator;
    const hasPushManager = "PushManager" in window;

    if (!hasNotification || !hasSW || !hasPushManager) return;

    // Only show if permission is still default
    if (Notification.permission === "default") {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem("dismissed_push_prompt", "true");
  };

  const handleSubscribe = async () => {
    setIsProcessing(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setIsVisible(false);
        return;
      }

      // Fetch VAPID key
      const vapidRes = await getVapidPublicKeyAction();
      const publicKey =
        vapidRes.publicKey ||
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
        "BFrSQWtZTgSiRPo3ndCdmFpuku6cVrCWZ2TrU4U__udhs3L7aixmWikTFb_SvNErfwnXsq2OTDsLbS6WsibSQgQ";

      // Register or get Service Worker
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


      const activeReg = readyReg || reg;
      if (!activeReg) {
        throw new Error("Không thể khởi tạo Service Worker.");
      }

      const applicationServerKey = urlBase64ToUint8Array(publicKey);
      const sub = await activeReg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as unknown as string,
      });

      const subJson = sub.toJSON();
      if (!subJson.keys?.p256dh || !subJson.keys?.auth) {
        throw new Error("Không thể trích xuất khóa mã hóa.");
      }

      const res = await registerPushSubscriptionAction({
        endpoint: sub.endpoint,
        p256dh: subJson.keys.p256dh,
        auth: subJson.keys.auth,
        userAgent: navigator.userAgent,
        deviceName: isIos ? "iPhone/iPad (PWA)" : navigator.userAgent.includes("Mobile") ? "Điện thoại" : "Máy tính",
      });

      if (res.ok) {
        setSuccessText("Đã bật thông báo đẩy thành công!");
        setTimeout(() => {
          setIsVisible(false);
        }, 3000);
      } else {
        setIsVisible(false);
      }
    } catch (err) {
      console.error("Push prompt subscribe error:", err);
      setIsVisible(false);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="relative isolate z-30 bg-primary/10 border-b border-primary/20 px-4 py-2.5 text-xs text-foreground transition-all">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-primary/20 text-primary shrink-0">
            {successText ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <BellRing className="h-4 w-4" />
            )}
          </div>
          <div>
            {successText ? (
              <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                {successText}
              </span>
            ) : isIos && !isStandalone ? (
              <span className="text-muted-foreground">
                <strong className="text-foreground">Người dùng iPhone / iPad:</strong> Nhấn nút{" "}
                <Share2 className="inline h-3.5 w-3.5 mx-0.5 text-primary" /> Chia sẻ &rarr; chọn{" "}
                <strong>&ldquo;Thêm vào MH chính&rdquo;</strong> để nhận thông báo đẩy khi tắt màn hình.
              </span>
            ) : (
              <span>
                <strong className="text-foreground">Nhận thông báo nhắc học:</strong> Bật thông báo đẩy để không bỏ lỡ bài ôn tập SRS và tin tức mới nhất.
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!successText && (!isIos || isStandalone) && (
            <Button
              size="sm"
              onClick={handleSubscribe}
              disabled={isProcessing}
              className="h-7 px-3 text-[11px] rounded-lg font-semibold gap-1.5 cursor-pointer shadow-xs"
            >
              {isProcessing ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Smartphone className="h-3 w-3" />
              )}
              <span>Bật ngay</span>
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
            aria-label="Đóng thông báo"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
