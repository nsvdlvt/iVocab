import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import { Database } from "@/types/database";

export async function updateSession(request: NextRequest) {
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

  console.time("middleware - getUser");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  console.timeEnd("middleware - getUser");

  const url = request.nextUrl.clone();
  const path = url.pathname;
  console.log("MIDDLEWARE", {
    pathname: path,
    user: user?.id ?? null,
  });

  const isAuthPage =
    path.startsWith("/login") ||
    path.startsWith("/register") ||
    path.startsWith("/forgot-password") ||
    path.startsWith("/reset-password");

  const isPublicPage = path === "/" || isAuthPage;

  if (!user && !isPublicPage) {
    url.pathname = "/login";
    console.log("MIDDLEWARE_DECISION", {
      pathname: path,
      user: user?.id ?? null,
      decision: "redirect",
      destination: url.pathname,
    });
    return NextResponse.redirect(url);
  }

  if (user && isAuthPage) {
    url.pathname = "/vocabulary";
    console.log("MIDDLEWARE_DECISION", {
      pathname: path,
      user: user?.id ?? null,
      decision: "redirect",
      destination: url.pathname,
    });
    return NextResponse.redirect(url);
  }

  console.log("MIDDLEWARE_DECISION", {
    pathname: path,
    user: user?.id ?? null,
    decision: "next",
    destination: null,
  });
  return supabaseResponse;
}
