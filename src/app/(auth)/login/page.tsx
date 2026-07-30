import React from "react";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/features/auth/LoginForm";

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
