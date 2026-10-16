import React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ResetPasswordForm } from "@/components/features/auth/ResetPasswordForm";
import { ROUTES } from "@/constants/routes";

export const metadata: Metadata = {
  title: "Đặt lại mật khẩu",
  description: "Thiết lập mật khẩu mới cho tài khoản Vocabee của bạn.",
};

type ResetPasswordPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = (await searchParams) ?? {};
  const code = params.code;
  const token_hash = params.token_hash;
  const type = params.type;

  // If recovery link delivered code directly to /reset-password, forward through callback
  if (typeof code === "string" && code) {
    const callbackPath = new URLSearchParams({
      code,
      next: ROUTES.RESET_PASSWORD,
    });
    redirect(`/auth/callback?${callbackPath.toString()}`);
  }

  // If recovery link delivered token_hash directly to /reset-password, forward through callback
  if (typeof token_hash === "string" && token_hash) {
    const callbackPath = new URLSearchParams({
      token_hash,
      type: typeof type === "string" ? type : "recovery",
      next: ROUTES.RESET_PASSWORD,
    });
    redirect(`/auth/callback?${callbackPath.toString()}`);
  }

  return <ResetPasswordForm />;
}
