"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { ROUTES } from "@/constants/routes";

export type LogoutActionResult = {
  success: boolean;
  error?: string;
  redirectTo: string;
};

export async function logoutAction(): Promise<LogoutActionResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.warn("Supabase auth.signOut warning:", error.message);
    }
  } catch (error) {
    console.error("Error signing out user:", error);
  }

  // Explicitly purge all Supabase auth cookies to guarantee no stale session remains
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    for (const cookie of allCookies) {
      if (
        cookie.name.startsWith("sb-") ||
        cookie.name.includes("auth-token") ||
        cookie.name.includes("supabase")
      ) {
        cookieStore.delete(cookie.name);
      }
    }
  } catch (cookieError) {
    console.error("Error clearing session cookies:", cookieError);
  }

  return {
    success: true,
    redirectTo: ROUTES.LOGIN,
  };
}
