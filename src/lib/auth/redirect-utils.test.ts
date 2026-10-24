import { describe, it, expect } from "vitest";
import {
  isSafeRedirectPath,
  isDestinationAuthorized,
  getSafeRedirectUrl,
  getAuthorizedRedirectUrl,
} from "./redirect-utils";
import { ROUTES } from "@/constants/routes";

describe("redirect-utils", () => {
  describe("isSafeRedirectPath", () => {
    it("should accept valid relative application paths", () => {
      expect(isSafeRedirectPath("/")).toBe(true);
      expect(isSafeRedirectPath("/dashboard")).toBe(true);
      expect(isSafeRedirectPath("/select-workspace")).toBe(true);
      expect(isSafeRedirectPath("/vocabulary/123")).toBe(true);
      expect(isSafeRedirectPath("/vocabulary?page=2&sort=asc")).toBe(true);
      expect(isSafeRedirectPath("/review/session/abc#card-1")).toBe(true);
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

  describe("isDestinationAuthorized", () => {
    it("permits member to access Vocabeer and general routes, blocks E-Team and Admin", () => {
      expect(isDestinationAuthorized("/u", "member")).toBe(true);
      expect(isDestinationAuthorized("/u/vocabulary", "member")).toBe(true);
      expect(isDestinationAuthorized("/select-workspace", "member")).toBe(true);
      expect(isDestinationAuthorized("/e-team", "member")).toBe(false);
      expect(isDestinationAuthorized("/e-team/dashboard", "member")).toBe(false);
      expect(isDestinationAuthorized("/admin", "member")).toBe(false);
      expect(isDestinationAuthorized("/admin/users", "member")).toBe(false);
    });

    it("permits e_team to access Vocabeer and E-Team, blocks Admin", () => {
      expect(isDestinationAuthorized("/u", "e_team")).toBe(true);
      expect(isDestinationAuthorized("/u/vocabulary", "e_team")).toBe(true);
      expect(isDestinationAuthorized("/e-team", "e_team")).toBe(true);
      expect(isDestinationAuthorized("/e-team/dashboard", "e_team")).toBe(true);
      expect(isDestinationAuthorized("/admin", "e_team")).toBe(false);
      expect(isDestinationAuthorized("/admin/users", "e_team")).toBe(false);
    });

    it("permits admin to access all workspaces", () => {
      expect(isDestinationAuthorized("/u", "admin")).toBe(true);
      expect(isDestinationAuthorized("/u/vocabulary", "admin")).toBe(true);
      expect(isDestinationAuthorized("/e-team", "admin")).toBe(true);
      expect(isDestinationAuthorized("/e-team/dashboard", "admin")).toBe(true);
      expect(isDestinationAuthorized("/admin", "admin")).toBe(true);
      expect(isDestinationAuthorized("/admin/users", "admin")).toBe(true);
    });

    it("rejects malicious or invalid paths regardless of role", () => {
      expect(isDestinationAuthorized("https://evil.com", "admin")).toBe(false);
      expect(isDestinationAuthorized("//evil.com", "admin")).toBe(false);
      expect(isDestinationAuthorized(null, "admin")).toBe(false);
    });
  });

  describe("getSafeRedirectUrl", () => {
    it("should return target if it is safe", () => {
      expect(getSafeRedirectUrl("/vocabulary")).toBe("/vocabulary");
      expect(getSafeRedirectUrl("/review/session/1")).toBe("/review/session/1");
    });

    it("should return fallback when target is invalid or malicious", () => {
      expect(getSafeRedirectUrl("https://evil.com")).toBe(ROUTES.SELECT_WORKSPACE);
      expect(getSafeRedirectUrl("//evil.com")).toBe(ROUTES.SELECT_WORKSPACE);
      expect(getSafeRedirectUrl(null)).toBe(ROUTES.SELECT_WORKSPACE);
      expect(getSafeRedirectUrl(undefined, "/custom-fallback")).toBe("/custom-fallback");
    });
  });

  describe("getAuthorizedRedirectUrl", () => {
    it("redirects generic dashboards and landing page to select-workspace by default", () => {
      expect(getAuthorizedRedirectUrl("/", "member")).toBe(ROUTES.SELECT_WORKSPACE);
      expect(getAuthorizedRedirectUrl("/dashboard", "member")).toBe(ROUTES.SELECT_WORKSPACE);
      expect(getAuthorizedRedirectUrl("/u", "member")).toBe(ROUTES.SELECT_WORKSPACE);
      expect(getAuthorizedRedirectUrl(null, "member")).toBe(ROUTES.SELECT_WORKSPACE);
    });

    it("preserves specific intended destinations when user is authorized", () => {
      expect(getAuthorizedRedirectUrl("/u/vocabulary/set-1", "member")).toBe("/u/vocabulary/set-1");
      expect(getAuthorizedRedirectUrl("/e-team/vocabs", "e_team")).toBe("/e-team/vocabs");
      expect(getAuthorizedRedirectUrl("/admin/users", "admin")).toBe("/admin/users");
    });

    it("redirects unauthorized intended destinations to select-workspace", () => {
      expect(getAuthorizedRedirectUrl("/admin/users", "member")).toBe(ROUTES.SELECT_WORKSPACE);
      expect(getAuthorizedRedirectUrl("/admin/users", "e_team")).toBe(ROUTES.SELECT_WORKSPACE);
      expect(getAuthorizedRedirectUrl("/e-team/dashboard", "member")).toBe(ROUTES.SELECT_WORKSPACE);
    });
  });
});
