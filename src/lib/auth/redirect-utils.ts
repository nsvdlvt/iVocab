import { canAccessAdmin, canAccessETeam, canAccessVocabeer } from "./roles";
import { ROUTES } from "@/constants/routes";

/**
 * Utility functions for safe URL redirection to prevent open redirect vulnerabilities
 * and validate role-based workspace authorization.
 */

/**
 * Validates whether a given path is a safe internal application route.
 * Safe paths must:
 * 1. Start with a single slash '/'
 * 2. Not start with double slash '//' (protocol-relative URLs)
 * 3. Not start with '/\' (backslash evasion)
 * 4. Not contain backslashes
 * 5. Not contain protocol schemes (e.g., 'http:', 'https:', 'javascript:', 'data:')
 */
export function isSafeRedirectPath(path: unknown): path is string {
  if (typeof path !== "string") {
    return false;
  }

  const trimmed = path.trim();

  // Empty string is not a valid relative path
  if (!trimmed) {
    return false;
  }

  // Must begin with a single slash
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.startsWith("/\\")) {
    return false;
  }

  // Reject backslashes which browsers might normalize into forward slashes
  if (trimmed.includes("\\")) {
    return false;
  }

  // Reject control characters or newlines
  if (/[\x00-\x1F\x7F]/.test(trimmed)) {
    return false;
  }

  // Check for protocol schemes inside (e.g. /http://evil.com or javascript:)
  try {
    if (/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(trimmed)) {
      return false;
    }
  } catch {
    return false;
  }

  return true;
}

/**
 * Validates whether the user's role is authorized to access the destination route.
 */
export function isDestinationAuthorized(
  path: unknown,
  role: string | null | undefined
): boolean {
  if (!isSafeRedirectPath(path)) {
    return false;
  }

  const clean = path.trim();

  // Admin routes: require admin role
  if (clean === "/admin" || clean.startsWith("/admin/")) {
    return canAccessAdmin(role);
  }

  // E-Team routes: require e_team or admin role
  if (clean === "/e-team" || clean.startsWith("/e-team/")) {
    return canAccessETeam(role);
  }

  // Vocabeer routes: require vocabeer access
  if (clean === "/u" || clean.startsWith("/u/")) {
    return canAccessVocabeer(role);
  }

  // General routes (like /select-workspace, /settings, etc.)
  return true;
}

/**
 * Returns a validated safe internal redirect URL or the fallback default.
 */
export function getSafeRedirectUrl(
  target: string | null | undefined,
  fallback: string = ROUTES.SELECT_WORKSPACE
): string {
  if (target && isSafeRedirectPath(target)) {
    return target.trim();
  }
  return fallback;
}

/**
 * Validates both safety and authorization for a redirect target.
 * Prevents redirecting directly to a workspace dashboard by default.
 * Preserves specific intended destinations when the user's role is authorized.
 */
export function getAuthorizedRedirectUrl(
  target: string | null | undefined,
  role: string | null | undefined,
  fallback: string = ROUTES.SELECT_WORKSPACE
): string {
  if (target && isSafeRedirectPath(target)) {
    const clean = target.trim();

    // Do not redirect directly to workspace dashboard by default
    if (
      clean === "/" ||
      clean === ROUTES.LANDING ||
      clean === "/dashboard" ||
      clean === ROUTES.DASHBOARD
    ) {
      return fallback;
    }

    if (isDestinationAuthorized(clean, role)) {
      return clean;
    }
  }

  return fallback;
}
