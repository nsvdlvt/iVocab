"use server";

import { createClient } from "@/lib/supabase/server";
import { loginSchema, type LoginFormValues } from "@/lib/validators/auth";
import { mapAuthError } from "@/lib/auth/error-map";
import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { getSafeRedirectUrl } from "@/lib/auth/redirect-utils";

export type LoginActionResult = {
  success: boolean;
  error?: string;
  unconfirmed?: boolean;
  email?: string;
};

export async function loginAction(values: LoginFormValues): Promise<LoginActionResult> {
  const validatedFields = loginSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      success: false,
      error: "Dữ liệu nhập vào không hợp lệ.",
    };
  }

  const { email, password, redirectTo } = validatedFields.data;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    const isUnconfirmed = error.message.toLowerCase().includes("email not confirmed");
    return {
      success: false,
      error: mapAuthError(error),
      unconfirmed: isUnconfirmed,
      email: isUnconfirmed ? email : undefined,
    };
  }

  const destination = getSafeRedirectUrl(redirectTo, ROUTES.SELECT_WORKSPACE);
  redirect(destination);
}
