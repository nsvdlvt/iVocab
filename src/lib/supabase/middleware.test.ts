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

    // Must NOT redirect away to /vocabulary or /dashboard
    expect(response.status).toBe(200);
  });

  it("should redirect unauthenticated users from protected routes to /login with next param", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    const request = new NextRequest("http://localhost:3000/vocabulary/set-123");
    const response = await updateSession(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toContain("/login");
    expect(location).toContain("next=%2Fvocabulary%2Fset-123");
  });

  it("should redirect authenticated users away from guest-only pages to /select-workspace", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: "logged-in-user" } }, error: null });

    const request = new NextRequest("http://localhost:3000/login");
    const response = await updateSession(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toBe("http://localhost:3000/select-workspace");
  });

  it("should redirect authenticated users on /login to preserved next parameter if safe and authorized", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: "logged-in-user" } }, error: null });
    mockFrom.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValueOnce({ data: { role: "member" }, error: null }),
    });

    const request = new NextRequest("http://localhost:3000/login?next=/vocabulary");
    const response = await updateSession(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toBe("http://localhost:3000/vocabulary");
  });

  it("should permit unauthenticated visitors on /verify-otp", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    const request = new NextRequest("http://localhost:3000/verify-otp?email=user@example.com");
    const response = await updateSession(request);

    expect(response.status).toBe(200);
  });

  it("should redirect authenticated users on /verify-otp to /select-workspace", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: "logged-in-user" } }, error: null });

    const request = new NextRequest("http://localhost:3000/verify-otp");
    const response = await updateSession(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toBe("http://localhost:3000/select-workspace");
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

  it("should block malicious next parameter on guest-only page redirect", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: "logged-in-user" } }, error: null });

    const request = new NextRequest("http://localhost:3000/login?next=https://evil.com");
    const response = await updateSession(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toBe("http://localhost:3000/select-workspace");
  });

  describe("Role-based route authorization guards", () => {
    it("redirects member attempting to access /e-team to /403", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "user-member" } }, error: null });
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValueOnce({ data: { role: "member" }, error: null }),
      });

      const request = new NextRequest("http://localhost:3000/e-team/dashboard");
      const response = await updateSession(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe("http://localhost:3000/403");
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

    it("permits E-Team member accessing /e-team", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "user-eteam" } }, error: null });
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValueOnce({ data: { role: "e_team" }, error: null }),
      });

      const request = new NextRequest("http://localhost:3000/e-team/dashboard");
      const response = await updateSession(request);

      expect(response.status).toBe(200);
    });

    it("permits E-Team member accessing /u (Vocabeer)", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "user-eteam" } }, error: null });
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValueOnce({ data: { role: "e_team" }, error: null }),
      });

      const request = new NextRequest("http://localhost:3000/u/vocabulary");
      const response = await updateSession(request);

      expect(response.status).toBe(200);
    });

    it("redirects E-Team member attempting to access /admin to /403", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "user-eteam" } }, error: null });
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValueOnce({ data: { role: "e_team" }, error: null }),
      });

      const request = new NextRequest("http://localhost:3000/admin");
      const response = await updateSession(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe("http://localhost:3000/403");
    });

    it("permits Admin accessing /admin, /e-team, and /u", async () => {
      // 1. /admin
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "user-admin" } }, error: null });
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValueOnce({ data: { role: "admin" }, error: null }),
      });
      const reqAdmin = new NextRequest("http://localhost:3000/admin");
      expect((await updateSession(reqAdmin)).status).toBe(200);

      // 2. /e-team
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "user-admin" } }, error: null });
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValueOnce({ data: { role: "admin" }, error: null }),
      });
      const reqETeam = new NextRequest("http://localhost:3000/e-team");
      expect((await updateSession(reqETeam)).status).toBe(200);

      // 3. /u
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "user-admin" } }, error: null });
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValueOnce({ data: { role: "admin" }, error: null }),
      });
      const reqVocabeer = new NextRequest("http://localhost:3000/u");
      expect((await updateSession(reqVocabeer)).status).toBe(200);
    });
  });
});
