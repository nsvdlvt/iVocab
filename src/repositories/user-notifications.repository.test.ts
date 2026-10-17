import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserNotificationsRepository } from "./user-notifications.repository";

describe("UserNotificationsRepository", () => {
  describe("sanitizeActionUrl", () => {
    it("should accept valid relative URLs", () => {
      expect(UserNotificationsRepository.sanitizeActionUrl("/vocabulary")).toBe("/vocabulary");
      expect(UserNotificationsRepository.sanitizeActionUrl("/review/session/123")).toBe("/review/session/123");
      expect(UserNotificationsRepository.sanitizeActionUrl("/reading?topic=science")).toBe("/reading?topic=science");
    });

    it("should reject protocol-relative URLs (open redirect)", () => {
      expect(UserNotificationsRepository.sanitizeActionUrl("//evil.com")).toBeNull();
      expect(UserNotificationsRepository.sanitizeActionUrl("//attacker.org/steal")).toBeNull();
    });

    it("should reject malicious XSS schemes", () => {
      expect(UserNotificationsRepository.sanitizeActionUrl("javascript:alert(1)")).toBeNull();
      expect(UserNotificationsRepository.sanitizeActionUrl("javascript:void(0)")).toBeNull();
      expect(UserNotificationsRepository.sanitizeActionUrl("data:text/html,<script>alert(1)</script>")).toBeNull();
      expect(UserNotificationsRepository.sanitizeActionUrl("vbscript:msgbox(1)")).toBeNull();
    });

    it("should accept valid http and https URLs", () => {
      expect(UserNotificationsRepository.sanitizeActionUrl("https://vocabee.app")).toBe("https://vocabee.app");
      expect(UserNotificationsRepository.sanitizeActionUrl("http://localhost:3000/docs")).toBe("http://localhost:3000/docs");
    });

    it("should handle null, undefined, empty and whitespace strings gracefully", () => {
      expect(UserNotificationsRepository.sanitizeActionUrl(null)).toBeNull();
      expect(UserNotificationsRepository.sanitizeActionUrl(undefined)).toBeNull();
      expect(UserNotificationsRepository.sanitizeActionUrl("")).toBeNull();
      expect(UserNotificationsRepository.sanitizeActionUrl("   ")).toBeNull();
      expect(UserNotificationsRepository.sanitizeActionUrl("   /review   ")).toBe("/review");
    });
  });
});
