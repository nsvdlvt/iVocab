import { describe, it, expect, vi, beforeEach } from "vitest";
import { hasRole, can, cannot, assertAdmin, requireAdmin } from "./admin";

// Mock next/navigation
const mockRedirect = vi.fn();
vi.mock("next/navigation", () => ({
  redirect: (url: string) => mockRedirect(url),
}));

// Mock next/headers
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    getAll: () => [],
    set: vi.fn(),
  }),
}));

// Mock supabase client
let mockUser: { id: string; email: string } | null = null;
let mockRole: string | null = "user";

vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: {
      getUser: vi.fn().mockImplementation(async () => ({
        data: { user: mockUser },
        error: null,
      })),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: vi.fn().mockImplementation(async () => ({
            data: mockRole ? { role: mockRole } : null,
            error: null,
          })),
        }),
      }),
    }),
  }),
}));

describe("Admin Authorization Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = null;
    mockRole = "user";
  });

  describe("Role & Permission Checkers", () => {
    it("hasRole evaluates roles accurately", () => {
      expect(hasRole("admin", "admin")).toBe(true);
      expect(hasRole("user", "admin")).toBe(false);
      expect(hasRole(null, "admin")).toBe(false);
      expect(hasRole("admin", ["admin", "user"])).toBe(true);
      expect(hasRole("user", ["admin"])).toBe(false);
    });

    it("can and cannot verify admin permissions", () => {
      expect(can("admin", "accessAdmin")).toBe(true);
      expect(can("admin", "manageUsers")).toBe(true);
      expect(can("admin", "manageVocabulary")).toBe(true);
      expect(can("user", "accessAdmin")).toBe(false);
      expect(can(null, "accessAdmin")).toBe(false);

      expect(cannot("user", "accessAdmin")).toBe(true);
      expect(cannot("admin", "accessAdmin")).toBe(false);
    });
  });

  describe("assertAdmin (Server Actions / API boundary)", () => {
    it("throws UNAUTHENTICATED error when session does not exist", async () => {
      mockUser = null;
      await expect(assertAdmin()).rejects.toThrow("UNAUTHENTICATED");
    });

    it("throws FORBIDDEN error when user has non-admin role", async () => {
      mockUser = { id: "user_123", email: "student@example.com" };
      mockRole = "user";
      await expect(assertAdmin()).rejects.toThrow("FORBIDDEN");
    });

    it("succeeds and returns admin session when user has admin role in database", async () => {
      mockUser = { id: "admin_123", email: "admin@vocabee.site" };
      mockRole = "admin";
      const session = await assertAdmin();
      expect(session.user.id).toBe("admin_123");
      expect(session.role).toBe("admin");
    });
  });

  describe("requireAdmin (Page Server Components)", () => {
    it("redirects unauthenticated guest to login with preserved next param", async () => {
      mockUser = null;
      await requireAdmin("/admin/vocabulary-sets");
      expect(mockRedirect).toHaveBeenCalledWith("/login?next=%2Fadmin%2Fvocabulary-sets");
    });

    it("redirects authenticated non-admin user to /403", async () => {
      mockUser = { id: "user_456", email: "learner@vocabee.site" };
      mockRole = "user";
      await requireAdmin("/admin");
      expect(mockRedirect).toHaveBeenCalledWith("/403");
    });

    it("allows access and returns admin session when verified", async () => {
      mockUser = { id: "admin_456", email: "headadmin@vocabee.site" };
      mockRole = "admin";
      const session = await requireAdmin("/admin");
      expect(session.user.id).toBe("admin_456");
      expect(session.role).toBe("admin");
      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });
});
