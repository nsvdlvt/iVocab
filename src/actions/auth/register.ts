"use server";

import { createClient } from "@/lib/supabase/server";
import { registerSchema, type RegisterFormValues } from "@/lib/validators/auth";
import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { env } from "@/lib/env";

export async function registerAction(values: RegisterFormValues) {
  console.log("🔍 [registerAction] Connecting to Supabase URL:", env.NEXT_PUBLIC_SUPABASE_URL);
  console.log("🔍 [registerAction] Key length:", env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.length);
  console.log("🔍 [registerAction] Key preview:", env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.substring(0, 15) + "...");

  const validatedFields = registerSchema.safeParse(values);

  if (!validatedFields.success) {
    console.error("❌ [registerAction] Validation failed:", validatedFields.error.format());
    return {
      success: false,
      error: "Dữ liệu nhập vào không hợp lệ.",
    };
  }

  const { name, email, password } = validatedFields.data;
  const supabase = await createClient();

  console.log("⚡ [registerAction] Sending signUp request to Supabase Auth...");
  const signupResponse = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        avatar_url: null,
      },
    },
  });

  console.log("📦 [registerAction] signUp raw response data:", JSON.stringify(signupResponse.data, null, 2));
  console.log("⚠️ [registerAction] signUp raw response error:", JSON.stringify(signupResponse.error, null, 2));

  if (signupResponse.error) {
    return {
      success: false,
      error: signupResponse.error.message, // Return the exact error message
    };
  }

  if (signupResponse.data?.session) {
    console.log("✅ [registerAction] Session established immediately. Redirecting...");
    redirect(ROUTES.DASHBOARD);
  }

  return {
    success: true,
    message: "Đăng ký thành công! Vui lòng kiểm tra hòm thư email để kích hoạt tài khoản.",
  };
}
