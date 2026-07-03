import { createClient } from "@/lib/supabase/server";
import { Database } from "@/types/database";

export type UserProfile = Database["public"]["Tables"]["profiles"]["Row"];

export async function getCurrentUser(): Promise<UserProfile | null> {
  try {
    const supabase = await createClient();
    
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return null;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return null;
    }

    return profile;
  } catch (error) {
    console.error("Lỗi lấy thông tin user hiện tại:", error);
    return null;
  }
}
