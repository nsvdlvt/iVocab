"use server";

import { createClient } from "@/lib/supabase/server";
import { resendOtpSchema, type ResendOtpFormValues } from "@/lib/validators/auth";
import { mapAuthError } from "@/lib/auth/error-map";
import { headers } from "next/headers";
import { env } from "@/lib/env";
import { ROUTES } from "@/constants/routes";

export type ResendOtpActionResult = {
  success: boolean;
  error?: string;
  message?: string;
};

export async function resendOtpAction(values: ResendOtpFormValues): Promise<ResendOtpActionResult> {
  const validated = resendOtpSchema.safeParse(values);
  if (!validated.success) {
    return {
      success: false,
      error: "Email không hợp lệ.",
    };
  }

  const { email, type } = validated.data;
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

  // Resend for Password Recovery
  if (type === "recovery") {
    const redirectUrl = `${origin}/auth/callback?next=${encodeURIComponent(ROUTES.RESET_PASSWORD)}`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      return {
        success: false,
        error: mapAuthError(error),
      };
    }

    return {
      success: true,
      message: "Mã khôi phục mới đã được gửi về email của bạn.",
    };
  }

  // Resend for Signup / Email verification
  const redirectUrl = `${origin}/auth/callback?next=/dashboard`;
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: redirectUrl,
    },
  });

  if (error) {
    return {
      success: false,
      error: mapAuthError(error),
    };
  }

  return {
    success: true,
    message: "Mã xác thực mới đã được gửi về email của bạn.",
  };
}
