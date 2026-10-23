import { createServerClient } from "@supabase/ssr";
import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { Database } from "@/types/database";
import { getSafeRedirectUrl } from "@/lib/auth/redirect-utils";
import { mapAuthError } from "@/lib/auth/error-map";
import { ROUTES } from "@/constants/routes";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const nextRaw = searchParams.get("next");
  const providerError = searchParams.get("error");
  const providerErrorDescription = searchParams.get("error_description");

  // Validate and sanitize the target redirect destination to prevent open-redirect attacks
  const next = getSafeRedirectUrl(nextRaw, ROUTES.SELECT_WORKSPACE);
  const isResetPasswordFlow = next === ROUTES.RESET_PASSWORD || next.startsWith("/reset-password") || type === "recovery";

  // Handle provider cancellation or errors (e.g. Google OAuth access denied)
  if (providerError) {
    if (providerError === "access_denied" || providerError.includes("cancel")) {
      return NextResponse.redirect(`${origin}/login?error=access_denied`);
    }
    const message = encodeURIComponent(providerErrorDescription || providerError);
    return NextResponse.redirect(`${origin}/login?error=oauth-error&message=${message}`);
  }

  // Handle missing authentication credentials
  if (!code && !(token_hash && type)) {
    if (isResetPasswordFlow) {
      return NextResponse.redirect(`${origin}${ROUTES.RESET_PASSWORD}?error=missing-code`);
    }
    return NextResponse.redirect(`${origin}/login?error=auth-code-missing`);
  }

  const redirectUrl = new URL(next, origin);
  const response = NextResponse.redirect(redirectUrl);

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return (
            request.headers.get("cookie")?.split("; ").map((cookie) => {
              const [name, ...rest] = cookie.split("=");
              return { name, value: rest.join("=") };
            }) ?? []
          );
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // 1. PKCE flow: Exchange authorization code for authenticated session
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      if (isResetPasswordFlow) {
        return NextResponse.redirect(`${origin}${ROUTES.RESET_PASSWORD}?error=expired-link`);
      }
      const message = encodeURIComponent(mapAuthError(error));
      return NextResponse.redirect(`${origin}/login?error=invalid-link&message=${message}`);
    }
    return response;
  }

  // 2. Token hash OTP flow: Verify email confirmation / password recovery OTP
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    if (error) {
      if (isResetPasswordFlow) {
        return NextResponse.redirect(`${origin}${ROUTES.RESET_PASSWORD}?error=expired-link`);
      }
      const message = encodeURIComponent(mapAuthError(error));
      return NextResponse.redirect(`${origin}/login?error=invalid-link&message=${message}`);
    }
    return response;
  }

  return response;
}
