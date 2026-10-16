import { describe, it, expect, vi, beforeEach } from "vitest";
import { loginAction } from "./login";
import { registerAction } from "./register";
import { forgotPasswordAction } from "./forgot-password";
import { resetPasswordAction } from "./reset-password";
import { resendVerificationAction } from "./resend-verification";

const mockSignInWithPassword = vi.fn();
const mockSignUp = vi.fn();
const mockResetPasswordForEmail = vi.fn();
const mockUpdateUser = vi.fn();
const mockGetUser = vi.fn();
const mockResend = vi.fn();
const mockRedirect = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUp,
      resetPasswordForEmail: mockResetPasswordForEmail,
      updateUser: mockUpdateUser,
      getUser: mockGetUser,
      resend: mockResend,
    },
  })),
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    mockRedirect(url);
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Map([["host", "localhost:3000"]])),
  cookies: vi.fn(async () => ({
    getAll: () => [],
    set: () => {},
  })),
}));

describe("Authentication Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("loginAction", () => {
    it("should return validation error on empty fields", async () => {
      const result = await loginAction({ email: "", password: "" });
      expect(result.success).toBe(false);
      expect(result.error).toBe("Dữ liệu nhập vào không hợp lệ.");
    });

    it("should return mapped error on invalid credentials", async () => {
      mockSignInWithPassword.mockResolvedValueOnce({
        data: null,
        error: new Error("Invalid login credentials"),
      });

      const result = await loginAction({
        email: "user@example.com",
        password: "password123",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Email hoặc mật khẩu không chính xác.");
    });

    it("should detect unconfirmed email accounts", async () => {
      mockSignInWithPassword.mockResolvedValueOnce({
        data: null,
        error: new Error("Email not confirmed"),
      });

      const result = await loginAction({
        email: "unconfirmed@example.com",
        password: "password123",
      });

      expect(result.success).toBe(false);
      expect(result.unconfirmed).toBe(true);
      expect(result.email).toBe("unconfirmed@example.com");
    });

    it("should redirect to target destination on successful login", async () => {
      mockSignInWithPassword.mockResolvedValueOnce({
        data: { user: { id: "user-123" }, session: {} },
        error: null,
      });

      await expect(
        loginAction({
          email: "valid@example.com",
          password: "password123",
          redirectTo: "/vocabulary/my-set",
        })
      ).rejects.toThrow("NEXT_REDIRECT:/vocabulary/my-set");

      expect(mockRedirect).toHaveBeenCalledWith("/vocabulary/my-set");
    });
  });

  describe("registerAction", () => {
    it("should return validation error when passwords do not match", async () => {
      const result = await registerAction({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
        confirmPassword: "different-password",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Dữ liệu nhập vào không hợp lệ.");
    });

    it("should return mapped error when email is already registered", async () => {
      mockSignUp.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: new Error("User already registered"),
      });

      const result = await registerAction({
        name: "Test User",
        email: "existing@example.com",
        password: "password123",
        confirmPassword: "password123",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Email này đã được đăng ký sử dụng. Vui lòng đăng nhập.");
    });

    it("should return confirmation required flag when session is null", async () => {
      mockSignUp.mockResolvedValueOnce({
        data: { user: { id: "new-user-id" }, session: null },
        error: null,
      });

      const result = await registerAction({
        name: "Test User",
        email: "new@example.com",
        password: "password123",
        confirmPassword: "password123",
      });

      expect(result.success).toBe(true);
      expect(result.emailConfirmationRequired).toBe(true);
      expect(result.email).toBe("new@example.com");
    });
  });

  describe("forgotPasswordAction", () => {
    it("should return neutral success message even when user is not found", async () => {
      mockResetPasswordForEmail.mockResolvedValueOnce({
        data: null,
        error: new Error("User not found"),
      });

      const result = await forgotPasswordAction({ email: "unknown@example.com" });
      expect(result.success).toBe(true);
      expect(result.message).toContain("Nếu email tồn tại trong hệ thống");
    });

    it("should map rate limit errors", async () => {
      mockResetPasswordForEmail.mockResolvedValueOnce({
        data: null,
        error: new Error("Email rate limit exceeded"),
      });

      const result = await forgotPasswordAction({ email: "spammer@example.com" });
      expect(result.success).toBe(false);
      expect(result.error).toBe("Bạn đang thực hiện thao tác quá nhanh. Vui lòng thử lại sau ít phút.");
    });
  });

  describe("resetPasswordAction", () => {
    it("should fail when user has no active recovery session", async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: null },
        error: new Error("Auth session missing"),
      });

      const result = await resetPasswordAction({
        password: "new-password-123",
        confirmPassword: "new-password-123",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Phiên khôi phục đã hết hạn hoặc không hợp lệ");
    });

    it("should update password when recovery session is valid", async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: { id: "recovery-user" } },
        error: null,
      });
      mockUpdateUser.mockResolvedValueOnce({
        data: { user: { id: "recovery-user" } },
        error: null,
      });

      const result = await resetPasswordAction({
        password: "new-password-123",
        confirmPassword: "new-password-123",
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe("Mật khẩu mới đã được cập nhật thành công.");
      expect(mockUpdateUser).toHaveBeenCalledWith({ password: "new-password-123" });
    });
  });

  describe("resendVerificationAction", () => {
    it("should reject invalid email", async () => {
      const result = await resendVerificationAction("invalid-email");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Email không hợp lệ.");
    });

    it("should successfully trigger resend", async () => {
      mockResend.mockResolvedValueOnce({ data: {}, error: null });

      const result = await resendVerificationAction("user@example.com");
      expect(result.success).toBe(true);
      expect(result.message).toContain("Email kích hoạt đã được gửi lại");
      expect(mockResend).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "signup",
          email: "user@example.com",
        })
      );
    });
  });
});
