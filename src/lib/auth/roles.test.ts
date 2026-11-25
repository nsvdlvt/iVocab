import { describe, it, expect } from "vitest";
import {
  normalizeRole,
  canAccessMember,
  canAccessVocabeer,
  canAccessAdmin,
  ROLE_DISPLAY_NAMES,
} from "./roles";

describe("Roles and Access Control (roles.ts)", () => {
  describe("normalizeRole", () => {
    it("maps legacy 'user' and 'e_team' to canonical 'member'", () => {
      expect(normalizeRole("user")).toBe("member");
      expect(normalizeRole("e_team")).toBe("member");
      expect(normalizeRole("eteam")).toBe("member");
    });

    it("preserves 'member'", () => {
      expect(normalizeRole("member")).toBe("member");
    });

    it("preserves 'admin'", () => {
      expect(normalizeRole("admin")).toBe("admin");
    });

    it("defaults unknown or nullish roles safely to 'member'", () => {
      expect(normalizeRole(null)).toBe("member");
      expect(normalizeRole(undefined)).toBe("member");
      expect(normalizeRole("guest")).toBe("member");
      expect(normalizeRole("")).toBe("member");
    });
  });

  describe("canAccessMember", () => {
    it("permits member (and legacy user / e_team)", () => {
      expect(canAccessMember("member")).toBe(true);
      expect(canAccessMember("user")).toBe(true);
      expect(canAccessMember("e_team")).toBe(true);
      expect(canAccessVocabeer("member")).toBe(true);
    });

    it("permits admin", () => {
      expect(canAccessMember("admin")).toBe(true);
    });
  });

  describe("canAccessAdmin", () => {
    it("permits only admin", () => {
      expect(canAccessAdmin("admin")).toBe(true);
    });

    it("denies member, legacy user, and legacy e_team", () => {
      expect(canAccessAdmin("member")).toBe(false);
      expect(canAccessAdmin("user")).toBe(false);
      expect(canAccessAdmin("e_team")).toBe(false);
    });
  });

  describe("ROLE_DISPLAY_NAMES", () => {
    it("formats display names strictly for Member and Admin", () => {
      expect(ROLE_DISPLAY_NAMES.member).toBe("Member");
      expect(ROLE_DISPLAY_NAMES.admin).toBe("Admin");
    });
  });
});
