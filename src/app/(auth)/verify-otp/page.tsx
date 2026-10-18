import React, { Suspense } from "react";
import type { Metadata } from "next";
import { OtpVerificationForm } from "@/components/features/auth/OtpVerificationForm";
import { BeeLoading } from "@/components/common/BeeLoading";

export const metadata: Metadata = {
  title: "Xác minh email",
  description: "Nhập mã xác thực OTP để kích hoạt tài khoản hoặc đặt lại mật khẩu Vocabee.",
};

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[320px] items-center justify-center p-4">
          <BeeLoading
            variant="compact"
            context="sync"
            title="Đang tải xác thực..."
            description="Vui lòng đợi trong giây lát để chuẩn bị không gian bảo mật."
          />
        </div>
      }
    >
      <OtpVerificationForm />
    </Suspense>
  );
}
