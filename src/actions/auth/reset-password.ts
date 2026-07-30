"use server";

import { createClient } from "@/lib/supabase/server";
import { resetPasswordSchema, type ResetPasswordFormValues } from "@/lib/validators/auth";
import { mapAuthError } from "@/lib/auth/error-map";

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
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return {
      success: false,
      error: "Phiên khôi phục đã hết hạn hoặc không hợp lệ. Vui lòng yêu cầu đặt lại mật khẩu mới.",
    };
  }

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    return {
      success: false,
      error: mapAuthError(error),
    };
  }

  return {
    success: true,
    message: "Mật khẩu mới đã được cập nhật thành công.",
  };
}
