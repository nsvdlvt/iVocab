"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      }
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

      <Button
        type="button"
        variant="outline"
        className="w-full rounded-xl h-10 cursor-pointer shadow-sm font-semibold inline-flex items-center justify-center gap-2"
        disabled={isGoogleLoading}
        onClick={handleGoogleSignIn}
      >
        {isGoogleLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <GoogleIcon className="h-4 w-4" />
        )}
        Continue with Google
      </Button>
    </div>
  );
}
