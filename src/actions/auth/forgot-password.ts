"use server";

import { createClient } from "@/lib/supabase/server";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "@/lib/validators/auth";
import { mapAuthError } from "@/lib/auth/error-map";
import { headers } from "next/headers";
import { ROUTES } from "@/constants/routes";

import { env } from "@/lib/env";

export type ForgotPasswordActionResult = {
  success: boolean;
  error?: string;
  message?: string;
};

export async function forgotPasswordAction(
  values: ForgotPasswordFormValues
): Promise<ForgotPasswordActionResult> {
  const validatedFields = forgotPasswordSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      success: false,
      error: "Email không hợp lệ.",
    };
  }

  const { email } = validatedFields.data;
  const supabase = await createClient();

  const headersList = await headers();
  const host = headersList.get("x-forwarded-host") || headersList.get("host") || "localhost:3000";
  const proto =
    headersList.get("x-forwarded-proto") ||
    (process.env.NODE_ENV === "production" ? "https" : "http");
  const origin =
    process.env.NODE_ENV === "production"
      ? (env.NEXT_PUBLIC_SITE_URL || `${proto}://${host}`)
      : `${proto}://${host}`;
  const redirectUrl = `${origin}/auth/callback?next=${encodeURIComponent(ROUTES.RESET_PASSWORD)}`;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl,
  });

  if (error) {
    const errorMsg = error.message.toLowerCase();
    // Do not disclose user non-existence to prevent email enumeration
    if (errorMsg.includes("user not found")) {
      return {
        success: true,
        message: "Nếu email tồn tại trong hệ thống, bạn sẽ nhận được liên kết đặt lại mật khẩu trong giây lát.",
      };
    }

    return {
      success: false,
      error: mapAuthError(error),
    };
  }

  return {
    success: true,
    message: "Nếu email tồn tại trong hệ thống, bạn sẽ nhận được liên kết đặt lại mật khẩu trong giây lát.",
  };
}
