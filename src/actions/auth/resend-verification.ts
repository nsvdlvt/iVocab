"use server";

import { createClient } from "@/lib/supabase/server";
import { resendVerificationSchema } from "@/lib/validators/auth";
import { mapAuthError } from "@/lib/auth/error-map";
import { headers } from "next/headers";
import { env } from "@/lib/env";

export async function resendVerificationAction(rawEmail: string) {
  const validated = resendVerificationSchema.safeParse({ email: rawEmail });

  if (!validated.success) {
    return {
      success: false,
      error: "Email không hợp lệ.",
    };
  }

  const { email } = validated.data;
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

  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
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
    message: "Email kích hoạt đã được gửi lại. Vui lòng kiểm tra hộp thư của bạn.",
  };
}
