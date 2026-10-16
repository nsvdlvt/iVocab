/**
 * Utility functions for safe URL redirection to prevent open redirect vulnerabilities.
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
    // Check if path is parsed as absolute URL
    if (/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(trimmed)) {
      return false;
    }
  } catch {
    return false;
  }

  return true;
}

/**
 * Returns a validated safe internal redirect URL or the fallback default.
 */
export function getSafeRedirectUrl(target: string | null | undefined, fallback = "/dashboard"): string {
  if (target && isSafeRedirectPath(target)) {
    return target.trim();
  }
  return fallback;
}
