"use client";

import { createClient } from "@/lib/supabase/client";

export type OAuthProvider = "google";

export async function signInWithOAuth(provider: OAuthProvider) {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
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
