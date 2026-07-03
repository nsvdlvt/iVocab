"use server";

import { createClient } from "@/lib/supabase/server";
import { loginSchema, type LoginFormValues } from "@/lib/validators/auth";
import { mapAuthError } from "@/lib/auth/error-map";
import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";

export async function loginAction(values: LoginFormValues) {
  const validatedFields = loginSchema.safeParse(values);
  
  if (!validatedFields.success) {
    return {
      success: false,
      error: "Dữ liệu nhập vào không hợp lệ.",
    };
  }

  const { email, password } = validatedFields.data;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      success: false,
      error: mapAuthError(error),
    };
  }

  redirect(ROUTES.VOCABULARY);
}
