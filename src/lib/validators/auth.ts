import { z } from "zod";
import { AUTH_CONSTANTS } from "@/constants/auth";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email không được để trống")
    .email("Email không đúng định dạng"),
  password: z
    .string()
    .min(1, "Mật khẩu không được để trống")
    .min(AUTH_CONSTANTS.MIN_PASSWORD_LENGTH, `Mật khẩu phải chứa ít nhất ${AUTH_CONSTANTS.MIN_PASSWORD_LENGTH} ký tự`),
});

export const registerSchema = z
  .object({
    name: z.string().min(1, "Họ và tên không được để trống"),
    email: z
      .string()
      .min(1, "Email không được để trống")
      .email("Email không đúng định dạng"),
    password: z
      .string()
      .min(1, "Mật khẩu không được để trống")
      .min(AUTH_CONSTANTS.MIN_PASSWORD_LENGTH, `Mật khẩu phải chứa ít nhất ${AUTH_CONSTANTS.MIN_PASSWORD_LENGTH} ký tự`),
    confirmPassword: z.string().min(1, "Vui lòng xác nhận lại mật khẩu"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Xác nhận mật khẩu không trùng khớp",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email không được để trống")
    .email("Email không đúng định dạng"),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(1, "Mật khẩu mới không được để trống")
      .min(AUTH_CONSTANTS.MIN_PASSWORD_LENGTH, `Mật khẩu phải chứa ít nhất ${AUTH_CONSTANTS.MIN_PASSWORD_LENGTH} ký tự`),
    confirmPassword: z.string().min(1, "Vui lòng xác nhận lại mật khẩu mới"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Xác nhận mật khẩu mới không trùng khớp",
    path: ["confirmPassword"],
  });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
