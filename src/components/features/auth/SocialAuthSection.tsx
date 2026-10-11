"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { signInWithOAuth } from "@/lib/auth/oauth";
import { Button } from "@/components/ui/button";
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
      <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        <span>Hoặc tiếp tục với</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <Button
        type="button"
        variant="outline"
        size="lg"
        className="h-10 w-full rounded-xl font-semibold shadow-2xs"
        disabled={isGoogleLoading}
        onClick={handleGoogleSignIn}
      >
        {isGoogleLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <GoogleIcon className="mr-2 h-4 w-4" />
        )}
        Tiếp tục với Google
      </Button>
    </div>
  );
}
