export type AppRole = "member" | "admin";

/**
 * Normalizes any database role string ('user', 'member', legacy 'e_team', 'admin') to the canonical AppRole.
 * Guarantees backward compatibility with existing 'user' and migrated 'e_team' profiles.
 */
export function normalizeRole(role: string | null | undefined): AppRole {
  if (role === "admin") return "admin";
  return "member";
}

export const ROLE_DISPLAY_NAMES: Record<AppRole, string> = {
  member: "Member",
  admin: "Admin",
};

export const ROLE_BADGE_STYLES: Record<AppRole, { bg: string; text: string; border: string }> = {
  member: {
    bg: "bg-blue-500/10 dark:bg-blue-500/20",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-500/30",
  },
  admin: {
    bg: "bg-amber-500/10 dark:bg-amber-500/20",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/30",
  },
};

/**
 * Member area (/u/...) is accessible to all authenticated Members and Admins.
 */
export function canAccessMember(role: string | null | undefined): boolean {
  const norm = normalizeRole(role);
  return norm === "member" || norm === "admin";
}

/**
 * @deprecated Use canAccessMember instead. Kept as alias for backward compatibility.
 */
export const canAccessVocabeer = canAccessMember;

/**
 * Admin portal (/admin/...) is accessible strictly to Admins.
 */
export function canAccessAdmin(role: string | null | undefined): boolean {
  const norm = normalizeRole(role);
  return norm === "admin";
}
