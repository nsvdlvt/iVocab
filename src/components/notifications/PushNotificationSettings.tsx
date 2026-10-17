"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Bell,
  BellRing,
  BellOff,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Share2,
  Loader2,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  getVapidPublicKeyAction,
  registerPushSubscriptionAction,
  unregisterPushSubscriptionAction,
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

export function PushNotificationSettings() {
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [isIos, setIsIos] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  // Check browser capabilities and current subscription status
  const checkStatus = useCallback(async () => {
    try {
      if (typeof window === "undefined") return;

      const hasNotification = "Notification" in window;
      const hasSW = "serviceWorker" in navigator;
      const hasPushManager = "PushManager" in window;

      if (!hasNotification || !hasSW || !hasPushManager) {
        setIsSupported(false);
        setIsLoading(false);
        return;
      }

      setIsSupported(true);
      setPermission(Notification.permission);

      // Detect iOS / iPadOS
      const userAgent = window.navigator.userAgent || "";
      const isAppleMobile = /iPad|iPhone|iPod/.test(userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      setIsIos(isAppleMobile);

      // Check standalone PWA mode
      const standalone =
        (navigator as any).standalone ||
        window.matchMedia("(display-mode: standalone)").matches;
      setIsStandalone(Boolean(standalone));

      if (Notification.permission === "granted") {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();

        if (sub) {
          const statusRes = await checkDevicePushStatusAction(sub.endpoint);
          setIsSubscribed(statusRes.isSubscribed);
        } else {
          setIsSubscribed(false);
        }
      } else {
        setIsSubscribed(false);
      }
    } catch (err) {
      console.error("Error checking push status:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const handleSubscribe = async () => {
    setMessage(null);
    setIsProcessing(true);

    try {
      if (!isSupported) {
        setMessage({ type: "error", text: "Trình duyệt này không hỗ trợ Web Push Notifications." });
        return;
      }

      // Request browser permission explicitly following user click
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm === "denied") {
        setMessage({
          type: "error",
          text: "Quyền thông báo đã bị từ chối. Vui lòng cho phép quyền trong cài đặt trang web của trình duyệt.",
        });
        return;
      }

      if (perm !== "granted") {
        setMessage({ type: "info", text: "Bạn chưa xác nhận quyền thông báo." });
        return;
      }

      // Fetch VAPID public key
      const vapidRes = await getVapidPublicKeyAction();
      if (!vapidRes.ok || !vapidRes.publicKey) {
        setMessage({
          type: "error",
          text: vapidRes.error || "Không thể lấy VAPID Public Key từ máy chủ.",
        });
        return;
      }

      // Ensure service worker is ready
      const reg = await navigator.serviceWorker.ready;

      // Subscribe via PushManager
      const applicationServerKey = urlBase64ToUint8Array(vapidRes.publicKey);
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as unknown as string,
      });

      const subJson = sub.toJSON();
      if (!subJson.keys?.p256dh || !subJson.keys?.auth) {
        throw new Error("Không thể trích xuất khóa mã hóa từ thiết bị.");
      }

      // Register with backend
      const res = await registerPushSubscriptionAction({
        endpoint: sub.endpoint,
        p256dh: subJson.keys.p256dh,
        auth: subJson.keys.auth,
        userAgent: navigator.userAgent,
        deviceName: navigator.userAgent.includes("Mobile") ? "Điện thoại" : "Máy tính",
      });

      if (!res.ok) {
        throw new Error(res.error || "Lỗi khi lưu đăng ký Push trên máy chủ.");
      }

      setIsSubscribed(true);
      setMessage({
        type: "success",
        text: "Đã bật thông báo đẩy thành công trên thiết bị này! Bạn sẽ nhận được thông báo ngay cả khi đóng trang web.",
      });
    } catch (err: any) {
      console.error("Push subscribe error:", err);
      setMessage({
        type: "error",
        text: err.message || "Đã xảy ra lỗi khi đăng ký thông báo đẩy.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnsubscribe = async () => {
    setMessage(null);
    setIsProcessing(true);

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();

      if (sub) {
        await sub.unsubscribe();
        await unregisterPushSubscriptionAction(sub.endpoint);
      }

      setIsSubscribed(false);
      setMessage({
        type: "info",
        text: "Đã tắt thông báo đẩy trên thiết bị này. Bạn vẫn nhận được thông báo trong ứng dụng qua biểu tượng chuông.",
      });
    } catch (err: any) {
      console.error("Push unsubscribe error:", err);
      setMessage({
        type: "error",
        text: err.message || "Đã xảy ra lỗi khi hủy đăng ký.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4 max-w-lg">
      <div className="flex items-center justify-between border border-border rounded-2xl p-4 bg-card shadow-xs">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 p-2 rounded-xl bg-primary/10 text-primary">
            {isSubscribed ? (
              <BellRing className="h-5 w-5 text-primary" />
            ) : (
              <BellOff className="h-5 w-5 text-muted-foreground" />
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground">
                Thông báo đẩy (Browser Web Push)
              </span>
              {isSubscribed ? (
                <Badge variant="success" className="gap-1 text-[10px]">
                  <CheckCircle2 className="h-3 w-3" />
                  Đang hoạt động
                </Badge>
              ) : permission === "denied" ? (
                <Badge variant="destructive" className="gap-1 text-[10px]">
                  <ShieldAlert className="h-3 w-3" />
                  Bị chặn
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-[10px]">
                  Chưa bật
                </Badge>
              )}
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Nhận thông báo bài học mới, từ vựng cần ôn tập SRS và tin tức khẩn cấp ngay trên màn hình máy tính hoặc điện thoại, kể cả khi bạn đã đóng trang web.
            </p>
          </div>
        </div>
      </div>

      {/* iOS Safari Home Screen Notice */}
      {isIos && !isStandalone && (
        <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200 text-xs space-y-2">
          <div className="flex items-center gap-1.5 font-bold">
            <Share2 className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>Lưu ý dành cho người dùng iPhone / iPad:</span>
          </div>
          <p className="leading-relaxed">
            Hệ điều hành iOS yêu cầu cài đặt ứng dụng vào màn hình chính để nhận thông báo đẩy. Bấm vào nút <strong>Chia sẻ (Share)</strong> trên thanh công cụ Safari và chọn <strong>&ldquo;Thêm vào MH chính&rdquo; (Add to Home Screen)</strong>.
          </p>
        </div>
      )}

      {/* Permission Denied Guidance */}
      {permission === "denied" && (
        <div className="p-3.5 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>Quyền thông báo đang bị chặn:</span>
          </div>
          <p className="leading-relaxed">
            Bạn đã chặn quyền thông báo của trang web này. Để bật lại, hãy bấm vào biểu tượng ổ khóa hoặc cài đặt trang web trên thanh địa chỉ trình duyệt, chọn <strong>Cho phép Thông báo (Allow Notifications)</strong> rồi tải lại trang.
          </p>
        </div>
      )}

      {/* Unsupported Browser Notice */}
      {!isSupported && (
        <div className="p-3.5 rounded-xl border border-border bg-muted/40 text-muted-foreground text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-foreground">
            <Info className="h-4 w-4" />
            <span>Không hỗ trợ trên trình duyệt này</span>
          </div>
          <p>
            Trình duyệt hoặc môi trường duyệt web hiện tại không hỗ trợ Web Push API tiêu chuẩn.
          </p>
        </div>
      )}

      {/* Action Buttons */}
      {isSupported && permission !== "denied" && (
        <div className="flex items-center gap-3 pt-1">
          {isSubscribed ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleUnsubscribe}
              disabled={isProcessing || isLoading}
              className="rounded-xl text-xs gap-1.5 border-border cursor-pointer text-muted-foreground hover:text-destructive"
            >
              {isProcessing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <BellOff className="h-3.5 w-3.5" />
              )}
              <span>Tắt thông báo trên thiết bị này</span>
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={handleSubscribe}
              disabled={isProcessing || isLoading}
              className="rounded-xl text-xs gap-1.5 cursor-pointer font-semibold shadow-xs"
            >
              {isProcessing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Smartphone className="h-3.5 w-3.5" />
              )}
              <span>Bật thông báo đẩy trên thiết bị này</span>
            </Button>
          )}
        </div>
      )}

      {/* Status Messages */}
      {message && (
        <div
          className={cn(
            "p-3 rounded-xl text-xs leading-relaxed border animate-in fade-in-50",
            message.type === "success" && "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300",
            message.type === "error" && "bg-destructive/10 border-destructive/30 text-destructive",
            message.type === "info" && "bg-muted border-border text-muted-foreground"
          )}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
