import React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/features/auth/LoginForm";

export const metadata: Metadata = {
  title: "Đăng nhập",
  description: "Đăng nhập vào Vocabee để tiếp tục học từ vựng và ôn tập thông minh.",
};

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = (await searchParams) ?? {};
  const code = params.code;

  if (typeof code === "string" && code) {
    const next = typeof params.next === "string" ? params.next : undefined;
    const callbackPath = new URLSearchParams({ code });

    if (next) {
      callbackPath.set("next", next);
    }

    redirect(`/auth/callback?${callbackPath.toString()}`);
  }

  return <LoginForm />;
}
