import { canAccessAdmin, canAccessMember } from "./roles";
import { ROUTES } from "@/constants/routes";

/**
 * Utility functions for safe URL redirection to prevent open redirect vulnerabilities
 * and validate role-based route authorization.
 */

/**
 * Maps legacy Choose Workspace and E-Team paths to their unified /u/... equivalents.
 * Returns null if the path is not a legacy workspace/E-Team route.
 */
export function resolveLegacyRedirectPath(path: string): string | null {
  const clean = path.trim();
  const [pathname, rawSearch] = clean.split("?");
  const querySuffix = rawSearch ? `?${rawSearch}` : "";

  if (
    pathname === "/select-workspace" ||
    pathname.startsWith("/select-workspace/") ||
    pathname === "/choose-workspace" ||
    pathname.startsWith("/choose-workspace/")
  ) {
    return `${ROUTES.DASHBOARD}${querySuffix}`;
  }

  if (
    pathname === "/e-team" ||
    pathname === "/e-team/dashboard" ||
    pathname.startsWith("/e-team/dashboard/")
  ) {
    return `${ROUTES.DASHBOARD}${querySuffix}`;
  }

  if (pathname === "/e-team/vocabs") {
    return `${ROUTES.VOCABULARY}${querySuffix}`;
  }

  if (pathname.startsWith("/e-team/vocabs/")) {
    const remainder = pathname.slice("/e-team/vocabs/".length);
    return `${ROUTES.VOCABULARY}/${remainder}${querySuffix}`;
  }

  if (pathname.startsWith("/e-team/")) {
    return `${ROUTES.DASHBOARD}${querySuffix}`;
  }

  return null;
}

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

  // Legacy workspace / E-Team paths are deprecated and should be mapped, not treated as direct targets
  if (resolveLegacyRedirectPath(clean) !== null) {
    return false;
  }

  // Admin routes: require admin role
  if (clean === "/admin" || clean.startsWith("/admin/")) {
    return canAccessAdmin(role);
  }

  // Member routes (/u/...): require member or admin access
  if (clean === "/u" || clean.startsWith("/u/")) {
    return canAccessMember(role);
  }

  // General routes (like /settings, /vocabulary, etc.)
  return true;
}

/**
 * Returns a validated safe internal redirect URL or the fallback default.
 */
export function getSafeRedirectUrl(
  target: string | null | undefined,
  fallback: string = ROUTES.DASHBOARD
): string {
  if (target && isSafeRedirectPath(target)) {
    const clean = target.trim();
    const mappedLegacy = resolveLegacyRedirectPath(clean);
    return mappedLegacy ?? clean;
  }
  return fallback;
}

/**
 * Validates both safety and authorization for a redirect target.
 * Redirects authenticated users to /u by default, while preserving authorized specific destinations
 * and mapping legacy workspace/E-Team URLs to their /u equivalents.
 */
export function getAuthorizedRedirectUrl(
  target: string | null | undefined,
  role: string | null | undefined,
  fallback: string = ROUTES.DASHBOARD
): string {
  if (target && isSafeRedirectPath(target)) {
    const clean = target.trim();
    const mappedLegacy = resolveLegacyRedirectPath(clean);
    const candidate = mappedLegacy ?? clean;

    if (
      candidate === "/" ||
      candidate === ROUTES.LANDING ||
      candidate === "/dashboard"
    ) {
      return fallback;
    }

    if (isDestinationAuthorized(candidate, role)) {
      return candidate;
    }
  }

  return fallback;
}
