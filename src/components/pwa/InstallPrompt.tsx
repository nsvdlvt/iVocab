"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Download, X, Sparkles, Share } from "lucide-react";

const DISMISS_KEY = "vocabee-pwa-install-dismissed-at";
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isDismissed = () => {
      const dismissedAt = window.localStorage.getItem(DISMISS_KEY);
      if (dismissedAt) {
        const age = Date.now() - Number(dismissedAt);
        if (Number.isFinite(age) && age < DISMISS_TTL_MS) {
          return true;
        }
        window.localStorage.removeItem(DISMISS_KEY);
      }
      return false;
    };

    if (isDismissed()) {
      return;
    }

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    const navWithStandalone = window.navigator as Navigator & {
      standalone?: boolean;
    };
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      navWithStandalone.standalone === true;

    if (isIOSDevice && !isStandalone) {
      const timer = setTimeout(() => {
        if (!isDismissed()) {
          setIsIOS(true);
          setVisible(true);
        }
      }, 3000);
      return () => clearTimeout(timer);
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      if (isDismissed()) return;

      const promptEvent = event as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setVisible(true);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setVisible(false);
      window.localStorage.removeItem(DISMISS_KEY);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const dismiss = () => {
    window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome !== "accepted") {
      dismiss();
    } else {
      setVisible(false);
    }
    setDeferredPrompt(null);
  };

  if (!visible) return null;
  if (!isIOS && !deferredPrompt) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[80] px-4 pb-4 sm:px-6 sm:pb-6">
      <div className="mx-auto w-full max-w-2xl overflow-hidden rounded-xl border border-border bg-card/95 shadow-lg backdrop-blur-md">
        <div className="flex flex-col gap-4 p-4 sm:p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>

            {isIOS ? (
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  Cài đặt ứng dụng Vocabee
                </p>
                <div className="text-xs leading-relaxed text-muted-foreground space-y-0.5">
                  <p className="flex items-center gap-1">
                    1. Nhấn nút <Share className="h-3.5 w-3.5 inline" /> (Chia sẻ) trên trình duyệt.
                  </p>
                  <p>2. Chọn &ldquo;Thêm vào Màn hình chính&rdquo;.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  Cài đặt Vocabee để truy cập nhanh hơn
                </p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Thêm ứng dụng vào màn hình chính để học từ vựng toàn màn hình với tốc độ phản hồi tối ưu.
                </p>
                <Link
                  href="/offline"
                  className="inline-block text-xs font-medium text-primary hover:underline"
                >
                  Tìm hiểu chế độ ngoại tuyến
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 self-stretch md:self-center shrink-0">
            {isIOS ? (
              <Button onClick={dismiss} size="sm" className="w-full md:w-auto">
                Đã hiểu
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={dismiss}>
                  <X className="h-4 w-4" />
                  <span>Để sau</span>
                </Button>
                <Button size="sm" onClick={handleInstall}>
                  <Download className="h-4 w-4" />
                  <span>Cài đặt</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
