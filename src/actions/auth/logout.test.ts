import { describe, it, expect, vi, beforeEach } from "vitest";
import { logoutAction } from "./logout";
import { ROUTES } from "@/constants/routes";

const mockSignOut = vi.fn();
const mockDeleteCookie = vi.fn();
const mockCookiesList = [
  { name: "sb-access-token", value: "abc" },
  { name: "sb-refresh-token", value: "def" },
  { name: "other-cookie", value: "ghi" },
  { name: "custom-auth-token-1", value: "jkl" },
];

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      signOut: mockSignOut,
    },
  })),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    getAll: () => mockCookiesList,
    delete: mockDeleteCookie,
  })),
}));

describe("logoutAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("successfully signs out and deletes supabase auth cookies", async () => {
    mockSignOut.mockResolvedValueOnce({ error: null });

    const result = await logoutAction();

    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(mockDeleteCookie).toHaveBeenCalledWith("sb-access-token");
    expect(mockDeleteCookie).toHaveBeenCalledWith("sb-refresh-token");
    expect(mockDeleteCookie).toHaveBeenCalledWith("custom-auth-token-1");
    expect(mockDeleteCookie).not.toHaveBeenCalledWith("other-cookie");
    expect(result).toEqual({
      success: true,
      redirectTo: ROUTES.LOGIN,
    });
  });

  it("handles Supabase signOut errors without crashing and still purges cookies", async () => {
    mockSignOut.mockRejectedValueOnce(new Error("Network timeout"));

    const result = await logoutAction();

    expect(mockDeleteCookie).toHaveBeenCalledWith("sb-access-token");
    expect(mockDeleteCookie).toHaveBeenCalledWith("sb-refresh-token");
    expect(result.success).toBe(true);
    expect(result.redirectTo).toBe(ROUTES.LOGIN);
  });
});
