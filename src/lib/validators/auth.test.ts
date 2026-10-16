import { describe, it, expect } from "vitest";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  resendVerificationSchema,
} from "./auth";

describe("auth validators", () => {
  describe("loginSchema", () => {
    it("should accept valid login input and normalize email", () => {
      const result = loginSchema.safeParse({
        email: "  Test.User@Example.COM  ",
        password: "secretpassword123",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("test.user@example.com");
      }
    });

    it("should reject invalid email format", () => {
      const result = loginSchema.safeParse({
        email: "not-an-email",
        password: "password123",
      });
      expect(result.success).toBe(false);
    });

    it("should reject short passwords", () => {
      const result = loginSchema.safeParse({
        email: "user@example.com",
        password: "123",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("registerSchema", () => {
    it("should accept valid registration with matching passwords", () => {
      const result = registerSchema.safeParse({
        name: "  Nguyen Van A  ",
        email: "user@example.com",
        password: "password123",
        confirmPassword: "password123",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Nguyen Van A");
      }
    });

    it("should reject password confirmation mismatch", () => {
      const result = registerSchema.safeParse({
        name: "User",
        email: "user@example.com",
        password: "password123",
        confirmPassword: "differentPassword456",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Xác nhận mật khẩu không trùng khớp");
      }
    });

    it("should reject empty name", () => {
      const result = registerSchema.safeParse({
        name: "   ",
        email: "user@example.com",
        password: "password123",
        confirmPassword: "password123",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("resetPasswordSchema", () => {
    it("should validate and require matching passwords", () => {
      const valid = resetPasswordSchema.safeParse({
        password: "new-password-123",
        confirmPassword: "new-password-123",
      });
      expect(valid.success).toBe(true);

      const mismatch = resetPasswordSchema.safeParse({
        password: "new-password-123",
        confirmPassword: "mismatched-password",
      });
      expect(mismatch.success).toBe(false);
    });
  });

  describe("forgotPasswordSchema & resendVerificationSchema", () => {
    it("should validate email format and trim", () => {
      const forgot = forgotPasswordSchema.safeParse({ email: " user@example.com " });
      expect(forgot.success).toBe(true);
      if (forgot.success) {
        expect(forgot.data.email).toBe("user@example.com");
      }

      const resend = resendVerificationSchema.safeParse({ email: "invalid" });
      expect(resend.success).toBe(false);
    });
  });
});
