"use server";

import { createClient } from "@/lib/supabase/server";
import { registerSchema, type RegisterFormValues } from "@/lib/validators/auth";
import { mapAuthError } from "@/lib/auth/error-map";
import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { headers } from "next/headers";
import { env } from "@/lib/env";

export type RegisterActionResult = {
  success: boolean;
  error?: string;
  emailConfirmationRequired?: boolean;
  email?: string;
  message?: string;
};

export async function registerAction(values: RegisterFormValues): Promise<RegisterActionResult> {
  const validatedFields = registerSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      success: false,
      error: "Dữ liệu nhập vào không hợp lệ.",
    };
  }

  const { name, email, password } = validatedFields.data;
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

  const signupResponse = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        avatar_url: null,
      },
      emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
    },
  });

  if (signupResponse.error) {
    return {
      success: false,
      error: mapAuthError(signupResponse.error),
    };
  }

  // If immediate session is provided (email confirmation disabled in Supabase)
  if (signupResponse.data?.session) {
    redirect(ROUTES.DASHBOARD);
  }

  // Email confirmation required flow
  return {
    success: true,
    emailConfirmationRequired: true,
    email,
    message: "Đăng ký thành công! Vui lòng kiểm tra hòm thư email để kích hoạt tài khoản.",
  };
}
