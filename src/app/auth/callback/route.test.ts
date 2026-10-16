import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";

const mockExchangeCodeForSession = vi.fn();
const mockVerifyOtp = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      exchangeCodeForSession: mockExchangeCodeForSession,
      verifyOtp: mockVerifyOtp,
    },
  })),
}));

vi.mock("@/lib/env", () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "test-anon-key",
  },
}));

describe("Auth Callback Route Handler (GET /auth/callback)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should handle OAuth provider errors such as access_denied", async () => {
    const request = new Request("http://localhost:3000/auth/callback?error=access_denied");
    const response = await GET(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toBe("http://localhost:3000/login?error=access_denied");
  });

  it("should handle missing code and token_hash parameters", async () => {
    const request = new Request("http://localhost:3000/auth/callback");
    const response = await GET(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toBe("http://localhost:3000/login?error=auth-code-missing");
  });

  it("should redirect to /reset-password if credentials missing during recovery flow", async () => {
    const request = new Request(
      "http://localhost:3000/auth/callback?next=/reset-password"
    );
    const response = await GET(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toBe("http://localhost:3000/reset-password?error=missing-code");
  });

  it("should successfully exchange code and redirect to validated internal destination", async () => {
    mockExchangeCodeForSession.mockResolvedValueOnce({ data: { session: {} }, error: null });

    const request = new Request(
      "http://localhost:3000/auth/callback?code=valid-code&next=/vocabulary/set-456"
    );
    const response = await GET(request);

    expect(mockExchangeCodeForSession).toHaveBeenCalledWith("valid-code");
    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toBe("http://localhost:3000/vocabulary/set-456");
  });

  it("should block open redirect attacks and fallback to /dashboard", async () => {
    mockExchangeCodeForSession.mockResolvedValueOnce({ data: { session: {} }, error: null });

    const request = new Request(
      "http://localhost:3000/auth/callback?code=valid-code&next=https://evil.com"
    );
    const response = await GET(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toBe("http://localhost:3000/dashboard");
  });

  it("should redirect to /reset-password?error=expired-link if recovery code exchange fails", async () => {
    mockExchangeCodeForSession.mockResolvedValueOnce({
      data: null,
      error: new Error("invalid claim or code expired"),
    });

    const request = new Request(
      "http://localhost:3000/auth/callback?code=expired-code&next=/reset-password"
    );
    const response = await GET(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toBe("http://localhost:3000/reset-password?error=expired-link");
  });

  it("should successfully verify token_hash OTP and redirect to destination", async () => {
    mockVerifyOtp.mockResolvedValueOnce({ data: { session: {} }, error: null });

    const request = new Request(
      "http://localhost:3000/auth/callback?token_hash=otp-token&type=signup&next=/dashboard"
    );
    const response = await GET(request);

    expect(mockVerifyOtp).toHaveBeenCalledWith({ token_hash: "otp-token", type: "signup" });
    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toBe("http://localhost:3000/dashboard");
  });

  it("should handle failed token_hash OTP verification for recovery", async () => {
    mockVerifyOtp.mockResolvedValueOnce({
      data: null,
      error: new Error("Token is expired or invalid"),
    });

    const request = new Request(
      "http://localhost:3000/auth/callback?token_hash=expired-token&type=recovery&next=/reset-password"
    );
    const response = await GET(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toBe("http://localhost:3000/reset-password?error=expired-link");
  });
});
