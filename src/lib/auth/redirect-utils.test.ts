import { describe, it, expect } from "vitest";
import {
  isSafeRedirectPath,
  isDestinationAuthorized,
  getSafeRedirectUrl,
  getAuthorizedRedirectUrl,
  resolveLegacyRedirectPath,
} from "./redirect-utils";
import { ROUTES } from "@/constants/routes";

describe("redirect-utils", () => {
  describe("isSafeRedirectPath", () => {
    it("should accept valid relative application paths", () => {
      expect(isSafeRedirectPath("/")).toBe(true);
      expect(isSafeRedirectPath("/u")).toBe(true);
      expect(isSafeRedirectPath("/u/vocabulary/123")).toBe(true);
      expect(isSafeRedirectPath("/u/vocabulary?page=2&sort=asc")).toBe(true);
      expect(isSafeRedirectPath("/u/review/session/abc#card-1")).toBe(true);
    });

    it("should reject absolute external URLs", () => {
      expect(isSafeRedirectPath("https://evil.com")).toBe(false);
      expect(isSafeRedirectPath("http://evil.com/dashboard")).toBe(false);
      expect(isSafeRedirectPath("ftp://evil.com")).toBe(false);
    });

    it("should reject protocol-relative URLs", () => {
      expect(isSafeRedirectPath("//evil.com")).toBe(false);
      expect(isSafeRedirectPath("//evil.com/path")).toBe(false);
    });

    it("should reject backslash evasion attacks", () => {
      expect(isSafeRedirectPath("/\\evil.com")).toBe(false);
      expect(isSafeRedirectPath("/evil.com\\path")).toBe(false);
      expect(isSafeRedirectPath("\\evil.com")).toBe(false);
    });

    it("should reject javascript, data, or mailto URIs", () => {
      expect(isSafeRedirectPath("javascript:alert(1)")).toBe(false);
      expect(isSafeRedirectPath("data:text/html,<script>alert(1)</script>")).toBe(false);
      expect(isSafeRedirectPath("mailto:test@example.com")).toBe(false);
    });

    it("should reject null, undefined, empty, or non-string inputs", () => {
      expect(isSafeRedirectPath("")).toBe(false);
      expect(isSafeRedirectPath("   ")).toBe(false);
      expect(isSafeRedirectPath(null)).toBe(false);
      expect(isSafeRedirectPath(undefined)).toBe(false);
      expect(isSafeRedirectPath(123)).toBe(false);
      expect(isSafeRedirectPath({})).toBe(false);
    });
  });

  describe("resolveLegacyRedirectPath", () => {
    it("maps choose-workspace and select-workspace paths to /u", () => {
      expect(resolveLegacyRedirectPath("/select-workspace")).toBe("/u");
      expect(resolveLegacyRedirectPath("/choose-workspace")).toBe("/u");
      expect(resolveLegacyRedirectPath("/select-workspace?foo=1")).toBe("/u?foo=1");
    });

    it("maps /e-team paths to corresponding /u paths", () => {
      expect(resolveLegacyRedirectPath("/e-team")).toBe("/u");
      expect(resolveLegacyRedirectPath("/e-team/dashboard")).toBe("/u");
      expect(resolveLegacyRedirectPath("/e-team/vocabs")).toBe("/u/vocabulary");
      expect(resolveLegacyRedirectPath("/e-team/vocabs/set-1")).toBe("/u/vocabulary/set-1");
      expect(resolveLegacyRedirectPath("/e-team/vocabs/set-1/learn")).toBe("/u/vocabulary/set-1/learn");
      expect(resolveLegacyRedirectPath("/e-team/vocabs/set-1/flashcard")).toBe("/u/vocabulary/set-1/flashcard");
    });

    it("returns null for non-legacy routes", () => {
      expect(resolveLegacyRedirectPath("/u")).toBeNull();
      expect(resolveLegacyRedirectPath("/u/vocabulary")).toBeNull();
      expect(resolveLegacyRedirectPath("/admin")).toBeNull();
    });
  });

  describe("isDestinationAuthorized", () => {
    it("permits member to access /u routes, blocks /admin and deprecated routes", () => {
      expect(isDestinationAuthorized("/u", "member")).toBe(true);
      expect(isDestinationAuthorized("/u/vocabulary", "member")).toBe(true);
      expect(isDestinationAuthorized("/select-workspace", "member")).toBe(false);
      expect(isDestinationAuthorized("/choose-workspace", "member")).toBe(false);
      expect(isDestinationAuthorized("/e-team", "member")).toBe(false);
      expect(isDestinationAuthorized("/e-team/dashboard", "member")).toBe(false);
      expect(isDestinationAuthorized("/admin", "member")).toBe(false);
      expect(isDestinationAuthorized("/admin/users", "member")).toBe(false);
    });

    it("permits admin to access /u and /admin routes", () => {
      expect(isDestinationAuthorized("/u", "admin")).toBe(true);
      expect(isDestinationAuthorized("/u/vocabulary", "admin")).toBe(true);
      expect(isDestinationAuthorized("/admin", "admin")).toBe(true);
      expect(isDestinationAuthorized("/admin/users", "admin")).toBe(true);
      expect(isDestinationAuthorized("/e-team", "admin")).toBe(false);
    });

    it("rejects malicious or invalid paths regardless of role", () => {
      expect(isDestinationAuthorized("https://evil.com", "admin")).toBe(false);
      expect(isDestinationAuthorized("//evil.com", "admin")).toBe(false);
      expect(isDestinationAuthorized(null, "admin")).toBe(false);
    });
  });

  describe("getSafeRedirectUrl", () => {
    it("should return target if it is safe, mapping legacy paths", () => {
      expect(getSafeRedirectUrl("/vocabulary")).toBe("/vocabulary");
      expect(getSafeRedirectUrl("/u/review/session/1")).toBe("/u/review/session/1");
      expect(getSafeRedirectUrl("/select-workspace")).toBe("/u");
      expect(getSafeRedirectUrl("/e-team/vocabs")).toBe("/u/vocabulary");
    });

    it("should return fallback (/u) when target is invalid or malicious", () => {
      expect(getSafeRedirectUrl("https://evil.com")).toBe(ROUTES.DASHBOARD);
      expect(getSafeRedirectUrl("//evil.com")).toBe(ROUTES.DASHBOARD);
      expect(getSafeRedirectUrl(null)).toBe(ROUTES.DASHBOARD);
      expect(getSafeRedirectUrl(undefined, "/custom-fallback")).toBe("/custom-fallback");
    });
  });

  describe("getAuthorizedRedirectUrl", () => {
    it("redirects generic dashboards, landing page, and legacy workspace URLs to /u by default", () => {
      expect(getAuthorizedRedirectUrl("/", "member")).toBe(ROUTES.DASHBOARD);
      expect(getAuthorizedRedirectUrl("/dashboard", "member")).toBe(ROUTES.DASHBOARD);
      expect(getAuthorizedRedirectUrl("/u", "member")).toBe(ROUTES.DASHBOARD);
      expect(getAuthorizedRedirectUrl("/select-workspace", "member")).toBe(ROUTES.DASHBOARD);
      expect(getAuthorizedRedirectUrl("/choose-workspace", "member")).toBe(ROUTES.DASHBOARD);
      expect(getAuthorizedRedirectUrl("/e-team/dashboard", "member")).toBe(ROUTES.DASHBOARD);
      expect(getAuthorizedRedirectUrl(null, "member")).toBe(ROUTES.DASHBOARD);
    });

    it("preserves specific intended destinations and maps legacy E-Team vocab paths when authorized", () => {
      expect(getAuthorizedRedirectUrl("/u/vocabulary/set-1", "member")).toBe("/u/vocabulary/set-1");
      expect(getAuthorizedRedirectUrl("/e-team/vocabs", "member")).toBe("/u/vocabulary");
      expect(getAuthorizedRedirectUrl("/e-team/vocabs/set-1/learn", "member")).toBe("/u/vocabulary/set-1/learn");
      expect(getAuthorizedRedirectUrl("/admin/users", "admin")).toBe("/admin/users");
    });

    it("redirects unauthorized intended destinations to /u", () => {
      expect(getAuthorizedRedirectUrl("/admin/users", "member")).toBe(ROUTES.DASHBOARD);
      expect(getAuthorizedRedirectUrl("/admin/users", "user")).toBe(ROUTES.DASHBOARD);
    });
  });
});
