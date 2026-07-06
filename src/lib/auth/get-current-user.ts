import { createClient } from "@/lib/supabase/server";
import { Database } from "@/types/database";
import { cache } from "react";
import { perfEnd, perfStart } from "@/lib/perf";

export type UserProfile = Database["public"]["Tables"]["profiles"]["Row"];

export const getCurrentUser = cache(async (): Promise<UserProfile | null> => {
  const timer = perfStart("getCurrentUser");
  try {
    const supabase = await createClient();

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return null;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (profileError || !profile) {
      return null;
    }

    return profile;
  } catch (error) {
    console.error("Lá»—i láº¥y thÃ´ng tin user hiá»‡n táº¡i:", error);
    return null;
  } finally {
    perfEnd(timer);
  }
});
