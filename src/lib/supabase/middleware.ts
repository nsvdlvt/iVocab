import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import { Database } from "@/types/database";
import { perfEnd, perfStart } from "@/lib/perf";
import { ROUTES } from "@/constants/routes";
import { getSafeRedirectUrl } from "@/lib/auth/redirect-utils";

export async function updateSession(request: NextRequest) {
  const totalTimer = perfStart("middleware");
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const authTimer = perfStart("middleware auth");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  perfEnd(authTimer);

  const path = request.nextUrl.pathname;

  // 1. Auth callback handler must always pass through to route handler
  if (path.startsWith("/auth/callback")) {
    perfEnd(totalTimer);
    return supabaseResponse;
  }

  // 2. Guest-only authentication pages (authenticated users should be redirected away)
  const isGuestOnlyPage =
    path === "/login" ||
    path === "/register" ||
    path === "/forgot-password" ||
    path === "/verify-otp";

  // 3. Publicly accessible routes
  const isPublicPage =
    path === "/" ||
    path.startsWith("/share") ||
    path === "/403" ||
    path === "/offline" ||
    path === "/reset-password" ||
    isGuestOnlyPage;

  // 4. Redirect unauthenticated users from protected routes to login, preserving intended destination
  if (!user && !isPublicPage) {
    const loginUrl = new URL(ROUTES.LOGIN, request.nextUrl.origin);
    const destination = `${path}${request.nextUrl.search || ""}`;
    loginUrl.searchParams.set("next", destination);

    const redirectResponse = NextResponse.redirect(loginUrl);
    // Copy any refreshed session cookies to the redirect response
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });

    perfEnd(totalTimer);
    return redirectResponse;
  }

  // 5. Redirect authenticated users away from guest-only pages to their destination or dashboard
  if (user && isGuestOnlyPage) {
    const nextParam = request.nextUrl.searchParams.get("next");
    const targetUrl = getSafeRedirectUrl(nextParam, ROUTES.DASHBOARD);
    const redirectUrl = new URL(targetUrl, request.nextUrl.origin);

    const redirectResponse = NextResponse.redirect(redirectUrl);
    // Copy session cookies to the redirect response
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });

    perfEnd(totalTimer);
    return redirectResponse;
  }

  perfEnd(totalTimer);
  return supabaseResponse;
}
