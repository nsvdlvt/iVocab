import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateSession } from "./middleware";
import { NextRequest } from "next/server";

const mockGetUser = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
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

  it("should redirect authenticated users away from guest-only pages to /dashboard", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: "logged-in-user" } }, error: null });

    const request = new NextRequest("http://localhost:3000/login");
    const response = await updateSession(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toBe("http://localhost:3000/dashboard");
  });

  it("should redirect authenticated users on /login to preserved next parameter if safe", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: "logged-in-user" } }, error: null });

    const request = new NextRequest("http://localhost:3000/login?next=/vocabulary");
    const response = await updateSession(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toBe("http://localhost:3000/vocabulary");
  });

  it("should block malicious next parameter on guest-only page redirect", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: "logged-in-user" } }, error: null });

    const request = new NextRequest("http://localhost:3000/login?next=https://evil.com");
    const response = await updateSession(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toBe("http://localhost:3000/dashboard");
  });
});
