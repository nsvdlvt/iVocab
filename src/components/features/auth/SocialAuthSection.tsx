"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { signInWithOAuth } from "@/lib/auth/oauth";
import { GoogleIcon } from "./GoogleIcon";
import { toast } from "sonner";

export function SocialAuthSection() {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const result = await signInWithOAuth("google");

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      if (result.url) {
        window.location.assign(result.url);
        return;
      }

      toast.error("Không lấy được URL đăng nhập Google.");
    } catch {
      toast.error("Đã xảy ra lỗi kết nối. Vui lòng thử lại sau.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        <span>OR</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <button
        type="button"
        className="inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-background font-semibold shadow-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        disabled={isGoogleLoading}
        onClick={handleGoogleSignIn}
      >
        {isGoogleLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <GoogleIcon className="h-4 w-4" />
        )}
        Tiếp tục với Google
      </button>
    </div>
  );
}
