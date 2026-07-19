import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { Database } from "@/types/database";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth-code-missing`);
  }

  const redirectUrl = new URL("/dashboard", origin);
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
    return NextResponse.json(
      {
        message: error.message,
        error,
      },
      { status: 500 }
    );
  }

  return response;
}
