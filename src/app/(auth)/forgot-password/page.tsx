import React from "react";
import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/features/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Quên mật khẩu",
  description: "Khôi phục quyền truy cập vào tài khoản Vocabee của bạn.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
