import { describe, it, expect } from "vitest";
import {
  normalizeRole,
  canAccessVocabeer,
  canAccessETeam,
  canAccessAdmin,
  canSwitchWorkspace,
  ROLE_DISPLAY_NAMES,
} from "./roles";

describe("Roles and Access Control (roles.ts)", () => {
  describe("normalizeRole", () => {
    it("maps legacy 'user' to canonical 'member'", () => {
      expect(normalizeRole("user")).toBe("member");
    });

    it("preserves 'member'", () => {
      expect(normalizeRole("member")).toBe("member");
    });

    it("preserves 'e_team' and 'eteam'", () => {
      expect(normalizeRole("e_team")).toBe("e_team");
      expect(normalizeRole("eteam")).toBe("e_team");
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

  describe("canAccessVocabeer", () => {
    it("permits member (and legacy user)", () => {
      expect(canAccessVocabeer("member")).toBe(true);
      expect(canAccessVocabeer("user")).toBe(true);
    });

    it("permits admin", () => {
      expect(canAccessVocabeer("admin")).toBe(true);
    });

    it("permits e_team member (all roles are allowed in Vocabeer)", () => {
      expect(canAccessVocabeer("e_team")).toBe(true);
      expect(canAccessVocabeer("eteam")).toBe(true);
    });
  });

  describe("canAccessETeam", () => {
    it("denies standard member (and legacy user)", () => {
      expect(canAccessETeam("member")).toBe(false);
      expect(canAccessETeam("user")).toBe(false);
    });

    it("permits e_team member", () => {
      expect(canAccessETeam("e_team")).toBe(true);
    });

    it("permits admin", () => {
      expect(canAccessETeam("admin")).toBe(true);
    });
  });

  describe("canAccessAdmin", () => {
    it("permits only admin", () => {
      expect(canAccessAdmin("admin")).toBe(true);
    });

    it("denies member and e_team", () => {
      expect(canAccessAdmin("member")).toBe(false);
      expect(canAccessAdmin("user")).toBe(false);
      expect(canAccessAdmin("e_team")).toBe(false);
    });
  });

  describe("canSwitchWorkspace", () => {
    it("permits admin and e_team", () => {
      expect(canSwitchWorkspace("admin")).toBe(true);
      expect(canSwitchWorkspace("e_team")).toBe(true);
    });

    it("denies standard member (only has Vocabeer)", () => {
      expect(canSwitchWorkspace("member")).toBe(false);
      expect(canSwitchWorkspace("user")).toBe(false);
    });
  });

  describe("ROLE_DISPLAY_NAMES", () => {
    it("formats display names strictly according to requirements", () => {
      expect(ROLE_DISPLAY_NAMES.member).toBe("Member");
      expect(ROLE_DISPLAY_NAMES.e_team).toBe("E-Team");
      expect(ROLE_DISPLAY_NAMES.admin).toBe("Admin");
    });
  });
});
