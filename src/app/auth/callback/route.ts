import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { Database } from "@/types/database";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (!code) {
    const errorUrl = new URL(next, origin);
    errorUrl.pathname = "/reset-password";
    errorUrl.searchParams.set("error", "missing-code");
    return NextResponse.redirect(errorUrl);
  }

  const redirectUrl = new URL(next, origin);
  const response = NextResponse.redirect(redirectUrl);

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.headers.get("cookie")?.split("; ").map((cookie) => {
            const [name, ...rest] = cookie.split("=");
            return { name, value: rest.join("=") };
          }) ?? [];
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const fallbackUrl = new URL("/reset-password", origin);
    const errorMessage =
      error.message.includes("expired") || error.message.includes("invalid")
        ? "expired-link"
        : "invalid-link";
    fallbackUrl.searchParams.set("error", errorMessage);
    return NextResponse.redirect(fallbackUrl);
  }

  if (next === "/reset-password") {
    redirectUrl.searchParams.delete("error");
  }

  return response;
}
