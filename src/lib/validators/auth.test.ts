import { describe, it, expect } from "vitest";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  resendVerificationSchema,
  verifyOtpSchema,
  resendOtpSchema,
  maskEmail,
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

  describe("maskEmail helper", () => {
    it("should correctly mask standard email addresses", () => {
      expect(maskEmail("dungbnlvt@gmail.com")).toBe("du***t@gmail.com");
      expect(maskEmail("john.doe@example.org")).toBe("jo***e@example.org");
    });

    it("should handle short usernames gracefully", () => {
      expect(maskEmail("ab@example.com")).toBe("a***@example.com");
      expect(maskEmail("a@example.com")).toBe("a***@example.com");
    });

    it("should return unchanged for invalid or malformed strings", () => {
      expect(maskEmail("invalid-email")).toBe("invalid-email");
      expect(maskEmail("")).toBe("");
    });
  });

  describe("verifyOtpSchema & resendOtpSchema", () => {
    it("should accept valid 6-digit OTP code and normalize email and type", () => {
      const result = verifyOtpSchema.safeParse({
        email: " User@Example.COM ",
        token: " 123456 ",
        type: "signup",
        redirectTo: "/dashboard",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("user@example.com");
        expect(result.data.token).toBe("123456");
        expect(result.data.type).toBe("signup");
        expect(result.data.redirectTo).toBe("/dashboard");
      }
    });

    it("should reject non-6-digit tokens", () => {
      expect(verifyOtpSchema.safeParse({ email: "user@example.com", token: "12345", type: "signup" }).success).toBe(false);
      expect(verifyOtpSchema.safeParse({ email: "user@example.com", token: "1234567", type: "signup" }).success).toBe(false);
      expect(verifyOtpSchema.safeParse({ email: "user@example.com", token: "abcdef", type: "signup" }).success).toBe(false);
      expect(verifyOtpSchema.safeParse({ email: "user@example.com", token: "123 45", type: "signup" }).success).toBe(false);
    });

    it("should reject invalid verification types", () => {
      const result = verifyOtpSchema.safeParse({
        email: "user@example.com",
        token: "123456",
        type: "unsupported_type",
      });
      expect(result.success).toBe(false);
    });

    it("should validate resendOtpSchema", () => {
      const valid = resendOtpSchema.safeParse({
        email: " User@Example.COM ",
        type: "recovery",
      });
      expect(valid.success).toBe(true);
      if (valid.success) {
        expect(valid.data.email).toBe("user@example.com");
        expect(valid.data.type).toBe("recovery");
      }
    });
  });
});
