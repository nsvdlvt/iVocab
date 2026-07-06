import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import { Database } from "@/types/database";
import { perfEnd, perfStart } from "@/lib/perf";

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

  const url = request.nextUrl.clone();
  const path = url.pathname;

  const isAuthPage =
    path.startsWith("/login") ||
    path.startsWith("/register") ||
    path.startsWith("/forgot-password") ||
    path.startsWith("/reset-password");

  const isPublicPage = path === "/" || isAuthPage;

  if (!user && !isPublicPage) {
    url.pathname = "/login";
    perfEnd(totalTimer);
    return NextResponse.redirect(url);
  }

  if (user && isAuthPage) {
    url.pathname = "/vocabulary";
    perfEnd(totalTimer);
    return NextResponse.redirect(url);
  }

  perfEnd(totalTimer);
  return supabaseResponse;
}
