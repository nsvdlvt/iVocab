import { redirect } from "next/navigation";
import { getCurrentUser, type UserProfile } from "./get-current-user";
import { ROUTES } from "@/constants/routes";
import { perfEnd, perfStart } from "@/lib/perf";
import { canAccessVocabeer, canAccessETeam } from "./roles";

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
 * Ensures the authenticated user has permission to access Vocabeer (Member or Admin).
 * If user is E-Team only, redirects them to their own E-Team workspace.
 */
export async function requireVocabeerUser(): Promise<UserProfile> {
  const profile = await requireUser();

  if (!canAccessVocabeer(profile.role)) {
    if (canAccessETeam(profile.role)) {
      redirect(ROUTES.ETEAM_DASHBOARD);
    }
    redirect("/403");
  }

  return profile;
}

/**
 * Ensures the authenticated user has permission to access E-Team (E-Team or Admin).
 * If user is Member, redirects to /403 forbidden.
 */
export async function requireETeamUser(): Promise<UserProfile> {
  const profile = await requireUser();

  if (!canAccessETeam(profile.role)) {
    redirect("/403");
  }

  return profile;
}
