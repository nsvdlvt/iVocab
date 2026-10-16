import { describe, it, expect } from "vitest";
import { isSafeRedirectPath, getSafeRedirectUrl } from "./redirect-utils";

describe("redirect-utils", () => {
  describe("isSafeRedirectPath", () => {
    it("should accept valid relative application paths", () => {
      expect(isSafeRedirectPath("/")).toBe(true);
      expect(isSafeRedirectPath("/dashboard")).toBe(true);
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

  describe("getSafeRedirectUrl", () => {
    it("should return target if it is safe", () => {
      expect(getSafeRedirectUrl("/vocabulary")).toBe("/vocabulary");
      expect(getSafeRedirectUrl("/review/session/1")).toBe("/review/session/1");
    });

    it("should return fallback when target is invalid or malicious", () => {
      expect(getSafeRedirectUrl("https://evil.com")).toBe("/dashboard");
      expect(getSafeRedirectUrl("//evil.com")).toBe("/dashboard");
      expect(getSafeRedirectUrl(null)).toBe("/dashboard");
      expect(getSafeRedirectUrl(undefined, "/custom-fallback")).toBe("/custom-fallback");
    });
  });
});
