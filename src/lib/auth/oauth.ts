"use client";

import { createClient } from "@/lib/supabase/client";
import { getSafeRedirectUrl } from "@/lib/auth/redirect-utils";
import { ROUTES } from "@/constants/routes";

export type OAuthProvider = "google";

export async function signInWithOAuth(provider: OAuthProvider, next: string = ROUTES.DASHBOARD) {
  const supabase = createClient();
  const safeNext = getSafeRedirectUrl(next, ROUTES.DASHBOARD);
  const callbackUrl = new URL("/auth/callback", window.location.origin);
  callbackUrl.searchParams.set("next", safeNext);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: callbackUrl.toString(),
    },
  });

  if (error) {
    return { success: false as const, error: error.message };
  }

  return {
    success: true as const,
    url: data.url,
  };
}
