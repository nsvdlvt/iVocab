import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { Database } from "@/types/database";

export async function GET(request: Request) {
  console.log("🔥 AUTH CALLBACK HIT");
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  const redirectUrl = new URL(next, origin);
  const response = NextResponse.redirect(redirectUrl);

  if (code) {
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
    if (!error) {
      return response;
    }
  }

  // Redirect to login with error query param on failure
  return NextResponse.redirect(`${origin}/login?error=auth-code-error`);
}
