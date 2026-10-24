"use server";

import { createClient } from "@/lib/supabase/server";
import { loginSchema, type LoginFormValues } from "@/lib/validators/auth";
import { mapAuthError } from "@/lib/auth/error-map";
import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { getAuthorizedRedirectUrl } from "@/lib/auth/redirect-utils";

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

  const { data: signInData, error } = await supabase.auth.signInWithPassword({
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

  let userRole: string | null = null;
  if (signInData?.user?.id && typeof supabase.from === "function") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", signInData.user.id)
      .maybeSingle();
    userRole = profile?.role ?? null;
  }

  const destination = getAuthorizedRedirectUrl(redirectTo, userRole, ROUTES.SELECT_WORKSPACE);
  redirect(destination);
}
