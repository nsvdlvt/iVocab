"use server";

import { createClient } from "@/lib/supabase/server";
import { verifyOtpSchema, type VerifyOtpFormValues } from "@/lib/validators/auth";
import { mapAuthError } from "@/lib/auth/error-map";
import { getSafeRedirectUrl } from "@/lib/auth/redirect-utils";
import { ROUTES } from "@/constants/routes";
import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

export type VerifyOtpActionResult = {
  success: boolean;
  error?: string;
  message?: string;
  redirectTo?: string;
};

export async function verifyOtpAction(values: VerifyOtpFormValues): Promise<VerifyOtpActionResult> {
  const validated = verifyOtpSchema.safeParse(values);
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.issues[0]?.message ?? "Dữ liệu nhập vào không hợp lệ.",
    };
  }

  const { email, token, type, redirectTo } = validated.data;
  const supabase = await createClient();

  // 1. For signup / email confirmation OTP
  if (type === "signup" || type === "email") {
    let verifyResponse = await supabase.auth.verifyOtp({
      email,
      token,
      type: "signup" as EmailOtpType,
    });

    // Fallback attempt to type: 'email' if project configuration requires 'email'
    if (verifyResponse.error && (type === "email" || verifyResponse.error.message.toLowerCase().includes("invalid"))) {
      const fallbackResponse = await supabase.auth.verifyOtp({
        email,
        token,
        type: "email" as EmailOtpType,
      });
      if (!fallbackResponse.error) {
        verifyResponse = fallbackResponse;
      }
    }

    if (verifyResponse.error) {
      return {
        success: false,
        error: mapAuthError(verifyResponse.error),
      };
    }

    const destination = getSafeRedirectUrl(redirectTo, ROUTES.DASHBOARD);
    redirect(destination);
  }

  // 2. For password recovery OTP
  if (type === "recovery") {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "recovery" as EmailOtpType,
    });

    if (error) {
      return {
        success: false,
        error: mapAuthError(error),
      };
    }

    // Once recovery OTP is verified, user has an active recovery session -> redirect to set new password
    redirect(ROUTES.RESET_PASSWORD);
  }

  // 3. For email change OTP
  if (type === "email_change") {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email_change" as EmailOtpType,
    });

    if (error) {
      return {
        success: false,
        error: mapAuthError(error),
      };
    }

    const destination = getSafeRedirectUrl(redirectTo, ROUTES.SETTINGS);
    redirect(destination);
  }

  return {
    success: false,
    error: "Loại xác thực không được hỗ trợ.",
  };
}
