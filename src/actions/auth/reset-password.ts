"use server";

import { createClient } from "@/lib/supabase/server";
import { resetPasswordSchema, type ResetPasswordFormValues } from "@/lib/validators/auth";
import { mapAuthError } from "@/lib/auth/error-map";
import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";

export async function resetPasswordAction(values: ResetPasswordFormValues) {
  const validatedFields = resetPasswordSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      success: false,
      error: "Mật khẩu mới không hợp lệ.",
    };
  }

  const { password } = validatedFields.data;
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    return {
      success: false,
      error: mapAuthError(error),
    };
  }

  redirect(ROUTES.LOGIN);
}
