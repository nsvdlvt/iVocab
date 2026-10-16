import { z } from "zod";
import { AUTH_CONSTANTS } from "@/constants/auth";

export const emailValidator = z
  .string()
  .trim()
  .min(1, "Email không được để trống")
  .email("Email không đúng định dạng")
  .toLowerCase();

export const passwordValidator = z
  .string()
  .min(1, "Mật khẩu không được để trống")
  .min(
    AUTH_CONSTANTS.MIN_PASSWORD_LENGTH,
    `Mật khẩu phải chứa ít nhất ${AUTH_CONSTANTS.MIN_PASSWORD_LENGTH} ký tự`
  );

export const otpTokenValidator = z
  .string()
  .trim()
  .length(6, "Mã xác thực phải gồm đúng 6 chữ số")
  .regex(/^\d{6}$/, "Mã xác thực chỉ bao gồm số");

export const loginSchema = z.object({
  email: emailValidator,
  password: passwordValidator,
  redirectTo: z.string().optional(),
});

export const registerSchema = z
  .object({
    name: z.string().trim().min(1, "Họ và tên không được để trống"),
    email: emailValidator,
    password: passwordValidator,
    confirmPassword: z.string().min(1, "Vui lòng xác nhận lại mật khẩu"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Xác nhận mật khẩu không trùng khớp",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: emailValidator,
});

export const resetPasswordSchema = z
  .object({
    password: passwordValidator,
    confirmPassword: z.string().min(1, "Vui lòng xác nhận lại mật khẩu mới"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Xác nhận mật khẩu mới không trùng khớp",
    path: ["confirmPassword"],
  });

export const resendVerificationSchema = z.object({
  email: emailValidator,
});

export const verifyOtpSchema = z.object({
  email: emailValidator,
  token: otpTokenValidator,
  type: z.enum(["signup", "recovery", "email", "email_change"]).default("signup"),
  redirectTo: z.string().optional(),
});

export const resendOtpSchema = z.object({
  email: emailValidator,
  type: z.enum(["signup", "recovery", "email_change"]).default("signup"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
export type ResendVerificationFormValues = z.infer<typeof resendVerificationSchema>;
export type VerifyOtpFormValues = z.infer<typeof verifyOtpSchema>;
export type ResendOtpFormValues = z.infer<typeof resendOtpSchema>;

/**
 * Partially masks an email address to protect user privacy in UI displays.
 * e.g. "dungbnlvt@gmail.com" -> "du***t@gmail.com"
 * e.g. "hi@example.com" -> "h***@example.com"
 */
export function maskEmail(email: string): string {
  if (!email || typeof email !== "string") {
    return "";
  }

  if (!email.includes("@")) {
    return email;
  }

  const [username, domain] = email.trim().split("@");
  if (!username || !domain) {
    return email;
  }

  if (username.length <= 2) {
    return `${username[0]}***@${domain}`;
  }

  if (username.length === 3) {
    return `${username[0]}***${username[2]}@${domain}`;
  }

  return `${username.slice(0, 2)}***${username.slice(-1)}@${domain}`;
}
