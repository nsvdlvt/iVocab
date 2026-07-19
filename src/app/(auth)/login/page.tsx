import React from "react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/features/auth/LoginForm";
import { ROUTES } from "@/constants/routes";
import { env } from "@/lib/env";
import { Database } from "@/types/database";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; next?: string }>;
}) {
  const params = await searchParams;

  if (params.code) {
    const cookieStore = await cookies();
    const response = NextResponse.next();
    const supabase = createServerClient<Database>(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (!error) {
      redirect(params.next ?? ROUTES.DASHBOARD);
    }
  }

  return <LoginForm />;
}
