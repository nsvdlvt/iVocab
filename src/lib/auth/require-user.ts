import { redirect } from "next/navigation";
import { getCurrentUser, type UserProfile } from "./get-current-user";
import { ROUTES } from "@/constants/routes";
import { perfEnd, perfStart } from "@/lib/perf";
import { canAccessMember } from "./roles";

export async function requireUser(): Promise<UserProfile> {
  const timer = perfStart("requireUser");
  try {
    const profile = await getCurrentUser();

    if (!profile) {
      redirect(ROUTES.LOGIN);
    }

    return profile;
  } finally {
    perfEnd(timer);
  }
}

/**
 * Ensures the authenticated user has permission to access the unified Member area (/u/...).
 */
export async function requireMemberUser(): Promise<UserProfile> {
  const profile = await requireUser();

  if (!canAccessMember(profile.role)) {
    redirect("/403");
  }

  return profile;
}

/**
 * Alias kept for existing callers in Member feature routes and server actions.
 */
export const requireVocabeerUser = requireMemberUser;
