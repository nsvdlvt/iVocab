import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import { Database } from "@/types/database";
import { perfEnd, perfStart } from "@/lib/perf";
import { ROUTES } from "@/constants/routes";
import { getAuthorizedRedirectUrl, isSafeRedirectPath } from "@/lib/auth/redirect-utils";
import { canAccessAdmin, canAccessETeam, canAccessVocabeer } from "@/lib/auth/roles";

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
    path === "/u/dictionary" ||
    path.startsWith("/u/dictionary/") ||
    path === "/dictionary" ||
    path.startsWith("/dictionary/") ||
    path.startsWith("/share") ||
    path === "/403" ||
    path === "/offline" ||
    path === "/reset-password" ||
    isGuestOnlyPage;

  // 4. API routes handling: never redirect API requests to HTML /login
  if (path.startsWith("/api/")) {
    const isPublicApi =
      path.startsWith("/api/dictionary/lookup") ||
      path.startsWith("/api/dictionary/suggest") ||
      path.startsWith("/api/dictionary/context") ||
      path.startsWith("/api/reading/translate") ||
      path.startsWith("/api/cron/");

    if (!user && !isPublicApi) {
      perfEnd(totalTimer);
      return NextResponse.json(
        { success: false, error: "Unauthorized. Vui lòng đăng nhập để tiếp tục." },
        { status: 401 }
      );
    }

    perfEnd(totalTimer);
    return supabaseResponse;
  }

  // 5. Redirect unauthenticated users from protected routes to login, preserving intended destination
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

  // 6. Redirect authenticated users away from guest-only pages to their destination or workspace selection
  if (user && isGuestOnlyPage) {
    const nextParam = request.nextUrl.searchParams.get("next");
    let userRole: string | null = null;
    if (nextParam && isSafeRedirectPath(nextParam) && typeof supabase.from === "function") {
      try {
        const query = supabase
          .from("profiles")
          ?.select("role")
          ?.eq("id", user.id);
        const { data: profile } = query?.maybeSingle ? await query.maybeSingle() : { data: null };
        userRole = profile?.role ?? null;
      } catch {}
    }

    const targetUrl = getAuthorizedRedirectUrl(nextParam, userRole, ROUTES.SELECT_WORKSPACE);
    const redirectUrl = new URL(targetUrl, request.nextUrl.origin);

    const redirectResponse = NextResponse.redirect(redirectUrl);
    // Copy session cookies to the redirect response
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });

    perfEnd(totalTimer);
    return redirectResponse;
  }

  // 7. Role-based route authorization guards for authenticated requests
  if (user && typeof supabase.from === "function") {
    const isAccessingAdmin = path.startsWith("/admin");
    const isAccessingETeam = path.startsWith("/e-team");
    const isAccessingVocabeer = path.startsWith("/u") && !path.startsWith("/u/dictionary");

    if (isAccessingAdmin || isAccessingETeam || isAccessingVocabeer) {
      let userRole: string | null = null;
      try {
        const query = supabase
          .from("profiles")
          ?.select("role")
          ?.eq("id", user.id);
        const { data: profile } = query?.maybeSingle ? await query.maybeSingle() : { data: null };
        userRole = profile?.role ?? null;
      } catch {}

      // Rule: Admin-only routes
      if (isAccessingAdmin && !canAccessAdmin(userRole)) {
        perfEnd(totalTimer);
        return NextResponse.redirect(new URL("/403", request.nextUrl.origin));
      }

      // Rule: E-Team routes (/e-team/...) accessible to E-Team and Admin
      if (isAccessingETeam && !canAccessETeam(userRole)) {
        perfEnd(totalTimer);
        return NextResponse.redirect(new URL("/403", request.nextUrl.origin));
      }

      // Rule: Vocabeer routes (/u/...) accessible to Member, E-Team, and Admin
      if (isAccessingVocabeer && !canAccessVocabeer(userRole)) {
        perfEnd(totalTimer);
        return NextResponse.redirect(new URL("/403", request.nextUrl.origin));
      }
    }
  }

  perfEnd(totalTimer);
  return supabaseResponse;
}
