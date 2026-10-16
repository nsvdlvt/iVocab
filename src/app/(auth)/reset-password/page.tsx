import React from "react";
import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/features/auth/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Đặt lại mật khẩu",
  description: "Thiết lập mật khẩu mới cho tài khoản Vocabee của bạn.",
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
