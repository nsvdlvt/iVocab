export type AppRole = "member" | "e_team" | "admin";

/**
 * Normalizes any database role string ('user', 'member', 'e_team', 'admin') to the canonical AppRole.
 * Guarantees backward compatibility with existing 'user' profiles.
 */
export function normalizeRole(role: string | null | undefined): AppRole {
  if (role === "admin") return "admin";
  if (role === "e_team" || role === "eteam") return "e_team";
  return "member";
}

export const ROLE_DISPLAY_NAMES: Record<AppRole, string> = {
  member: "Member",
  e_team: "E-Team",
  admin: "Admin",
};

export const ROLE_BADGE_STYLES: Record<AppRole, { bg: string; text: string; border: string }> = {
  member: {
    bg: "bg-blue-500/10 dark:bg-blue-500/20",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-500/30",
  },
  e_team: {
    bg: "bg-purple-500/10 dark:bg-purple-500/20",
    text: "text-purple-600 dark:text-purple-400",
    border: "border-purple-500/30",
  },
  admin: {
    bg: "bg-amber-500/10 dark:bg-amber-500/20",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/30",
  },
};

/**
 * Vocabeer workspace is accessible to Members and Admins.
 */
export function canAccessVocabeer(role: string | null | undefined): boolean {
  const norm = normalizeRole(role);
  return norm === "member" || norm === "admin";
}

/**
 * E-Team workspace is accessible to E-Team members and Admins.
 */
export function canAccessETeam(role: string | null | undefined): boolean {
  const norm = normalizeRole(role);
  return norm === "e_team" || norm === "admin";
}

/**
 * Admin portal is accessible strictly to Admins.
 */
export function canAccessAdmin(role: string | null | undefined): boolean {
  const norm = normalizeRole(role);
  return norm === "admin";
}

/**
 * Workspace switcher is visible only to users with access to more than one workspace (or E-Team & Admin).
 */
export function canSwitchWorkspace(role: string | null | undefined): boolean {
  const norm = normalizeRole(role);
  return norm === "e_team" || norm === "admin";
}
