import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateSession } from "./middleware";
import { NextRequest } from "next/server";

const mockGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  })),
}));

vi.mock("@/lib/env", () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "test-anon-key",
  },
}));

describe("Supabase Proxy/Middleware (updateSession)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should permit public routes like / and /offline without authentication", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    const request = new NextRequest("http://localhost:3000/");
    const response = await updateSession(request);

    expect(response.status).toBe(200);
  });

  it("should permit /auth/callback unconditionally so callback route handler can run", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    const request = new NextRequest("http://localhost:3000/auth/callback?code=xyz");
    const response = await updateSession(request);

    expect(response.status).toBe(200);
  });

  it("should permit /reset-password for users with an active recovery session", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: "recovery-user" } }, error: null });

    const request = new NextRequest("http://localhost:3000/reset-password");
    const response = await updateSession(request);

    expect(response.status).toBe(200);
  });

  it("should redirect unauthenticated users from protected routes to /login with next param", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    const request = new NextRequest("http://localhost:3000/u/vocabulary/set-123");
    const response = await updateSession(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toContain("/login");
    expect(location).toContain("next=%2Fu%2Fvocabulary%2Fset-123");
  });

  it("should redirect authenticated users away from guest-only pages directly to /u", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: "logged-in-user" } }, error: null });

    const request = new NextRequest("http://localhost:3000/login");
    const response = await updateSession(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toBe("http://localhost:3000/u");
  });

  it("should redirect authenticated users on /login to preserved next parameter if safe and authorized", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: "logged-in-user" } }, error: null });
    mockFrom.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValueOnce({ data: { role: "member" }, error: null }),
    });

    const request = new NextRequest("http://localhost:3000/login?next=/u/vocabulary");
    const response = await updateSession(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toBe("http://localhost:3000/u/vocabulary");
  });

  it("should permit unauthenticated visitors on /verify-otp", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    const request = new NextRequest("http://localhost:3000/verify-otp?email=user@example.com");
    const response = await updateSession(request);

    expect(response.status).toBe(200);
  });

  it("should redirect authenticated users on /verify-otp directly to /u", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: "logged-in-user" } }, error: null });

    const request = new NextRequest("http://localhost:3000/verify-otp");
    const response = await updateSession(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toBe("http://localhost:3000/u");
  });

  it("should permit unauthenticated visitors on /dictionary and /dictionary?q=word", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    const request = new NextRequest("http://localhost:3000/dictionary?q=eloquent");
    const response = await updateSession(request);

    expect(response.status).toBe(200);
  });

  it("should permit unauthenticated visitors on /api/dictionary/lookup", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    const request = new NextRequest("http://localhost:3000/api/dictionary/lookup?q=eloquent");
    const response = await updateSession(request);

    expect(response.status).toBe(200);
  });

  it("should return 401 JSON (not 307 redirect) for unauthenticated protected API requests", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    const request = new NextRequest("http://localhost:3000/api/dictionary/save", { method: "POST" });
    const response = await updateSession(request);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.success).toBe(false);
  });

  it("should block malicious next parameter on guest-only page redirect and fallback to /u", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: "logged-in-user" } }, error: null });

    const request = new NextRequest("http://localhost:3000/login?next=https://evil.com");
    const response = await updateSession(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toBe("http://localhost:3000/u");
  });

  describe("Legacy Workspace & E-Team URL compatibility redirects", () => {
    it("redirects authenticated users on /select-workspace and /choose-workspace to /u", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "user-member" } }, error: null });
      const res1 = await updateSession(new NextRequest("http://localhost:3000/select-workspace"));
      expect(res1.status).toBe(307);
      expect(res1.headers.get("location")).toBe("http://localhost:3000/u");

      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "user-member" } }, error: null });
      const res2 = await updateSession(new NextRequest("http://localhost:3000/choose-workspace"));
      expect(res2.status).toBe(307);
      expect(res2.headers.get("location")).toBe("http://localhost:3000/u");
    });

    it("redirects authenticated users from /e-team/* to corresponding /u/* pages without loops", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "user-member" } }, error: null });
      const resDash = await updateSession(new NextRequest("http://localhost:3000/e-team/dashboard"));
      expect(resDash.status).toBe(307);
      expect(resDash.headers.get("location")).toBe("http://localhost:3000/u");

      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "user-member" } }, error: null });
      const resVocabs = await updateSession(new NextRequest("http://localhost:3000/e-team/vocabs"));
      expect(resVocabs.status).toBe(307);
      expect(resVocabs.headers.get("location")).toBe("http://localhost:3000/u/vocabulary");

      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "user-member" } }, error: null });
      const resLearn = await updateSession(new NextRequest("http://localhost:3000/e-team/vocabs/set-1/learn"));
      expect(resLearn.status).toBe(307);
      expect(resLearn.headers.get("location")).toBe("http://localhost:3000/u/vocabulary/set-1/learn");
    });

    it("redirects unauthenticated users on legacy /e-team/vocabs to /login with mapped /u/vocabulary next", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
      const res = await updateSession(new NextRequest("http://localhost:3000/e-team/vocabs"));
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toBe("http://localhost:3000/login?next=%2Fu%2Fvocabulary");
    });
  });

  describe("Role-based route authorization guards", () => {
    it("permits member accessing /u and /u/vocabulary (including on reload)", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "user-member" } }, error: null });
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValueOnce({ data: { role: "member" }, error: null }),
      });

      const request = new NextRequest("http://localhost:3000/u/vocabulary");
      const response = await updateSession(request);

      expect(response.status).toBe(200);
    });

    it("redirects member attempting to access /admin to /403", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "user-member" } }, error: null });
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValueOnce({ data: { role: "member" }, error: null }),
      });

      const request = new NextRequest("http://localhost:3000/admin/users");
      const response = await updateSession(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe("http://localhost:3000/403");
    });

    it("permits Admin accessing /admin and /u", async () => {
      // 1. /admin
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "user-admin" } }, error: null });
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValueOnce({ data: { role: "admin" }, error: null }),
      });
      const reqAdmin = new NextRequest("http://localhost:3000/admin");
      expect((await updateSession(reqAdmin)).status).toBe(200);

      // 2. /u
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "user-admin" } }, error: null });
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValueOnce({ data: { role: "admin" }, error: null }),
      });
      const reqMember = new NextRequest("http://localhost:3000/u");
      expect((await updateSession(reqMember)).status).toBe(200);
    });
  });
});
