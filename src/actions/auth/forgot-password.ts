"use server";

import { createClient } from "@/lib/supabase/server";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "@/lib/validators/auth";
import { mapAuthError } from "@/lib/auth/error-map";
import { headers } from "next/headers";

export async function forgotPasswordAction(values: ForgotPasswordFormValues) {
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
  const host = headersList.get("host");
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const redirectUrl = `${protocol}://${host}/auth/callback?next=/reset-password`;

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
    message: "Liên kết đặt lại mật khẩu đã được gửi về email của bạn.",
  };
}
