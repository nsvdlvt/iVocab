import { createClient } from "@/lib/supabase/server";
import { Database } from "@/types/database";
import { cache } from "react";
import { perfEnd, perfStart } from "@/lib/perf";

export type UserProfile = Database["public"]["Tables"]["profiles"]["Row"];

export const getCurrentUser = cache(async (): Promise<UserProfile | null> => {
  const timer = perfStart("getCurrentUser");
  try {
    const supabase = await createClient();

    // Verify user identity via secure server-side JWT verification
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return null;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (!profileError && profile) {
      return profile;
    }

    // Fallback: ensure authenticated user is not locked out if profile row is not yet created
    const fallbackProfile: Partial<UserProfile> = {
      id: user.id,
      email: user.email ?? "",
      display_name:
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        "Học viên",
      avatar_url: user.user_metadata?.avatar_url || null,
    };

    const { data: createdProfile } = await supabase
      .from("profiles")
      .upsert(fallbackProfile as UserProfile)
      .select("*")
      .maybeSingle();

    return createdProfile || (fallbackProfile as UserProfile);
  } catch (error: unknown) {
    // Preserve Next.js internal control flow signals (dynamic bailing, redirects)
    if (
      typeof error === "object" &&
      error !== null &&
      "digest" in error &&
      typeof (error as { digest: unknown }).digest === "string"
    ) {
      const digest = (error as { digest: string }).digest;
      if (digest === "DYNAMIC_SERVER_USAGE" || digest.startsWith("NEXT_REDIRECT")) {
        throw error;
      }
    }

    console.error("Error fetching current user profile:", error);
    return null;
  } finally {
    perfEnd(timer);
  }
});
