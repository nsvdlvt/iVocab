import React, { Suspense } from "react";
import type { Metadata } from "next";
import { OtpVerificationForm } from "@/components/features/auth/OtpVerificationForm";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Xác minh email",
  description: "Nhập mã xác thực OTP để kích hoạt tài khoản hoặc đặt lại mật khẩu Vocabee.",
};

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      }
    >
      <OtpVerificationForm />
    </Suspense>
  );
}
