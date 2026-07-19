"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Download, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const DISMISS_KEY = "vocabee-pwa-install-dismissed-at";
const DISMISS_TTL_MS = 30 * 24 * 60 * 60 * 1000;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissedAt = window.localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const age = Date.now() - Number(dismissedAt);
      if (Number.isFinite(age) && age < DISMISS_TTL_MS) {
        return;
      }
      window.localStorage.removeItem(DISMISS_KEY);
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
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
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
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

  if (!visible || !deferredPrompt) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[80] px-4 pb-4 sm:px-6 sm:pb-6">
      <div className="mx-auto w-full max-w-3xl overflow-hidden rounded-3xl border border-blue-500/20 bg-background/95 shadow-2xl shadow-blue-500/10 backdrop-blur-xl">
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-blue-500 via-indigo-500 to-sky-500" />
        <div className="flex flex-col gap-4 p-4 sm:p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-blue-500/10 p-3 text-blue-600 dark:text-blue-400">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">Install Vocabee for faster access</p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Add the app to your home screen to launch it in standalone mode, open faster, and keep learning close at hand.
              </p>
              <Link href="/offline" className={cn("text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400")}>
                View offline help
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch md:self-center">
            <Button variant="outline" onClick={dismiss} className="h-10 rounded-xl px-4">
              <X className="h-4 w-4" />
              Dismiss
            </Button>
            <Button onClick={handleInstall} className="h-10 rounded-xl px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <Download className="h-4 w-4" />
              Install
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
