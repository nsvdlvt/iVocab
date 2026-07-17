import { createClient } from "@/lib/supabase/server";
import { Database } from "@/types/database";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export const ProfileRepository = {
  async getProfile(userId: string): Promise<ProfileRow | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getPublicProfile(userId: string): Promise<Pick<ProfileRow, "id" | "display_name" | "avatar_url"> | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .eq("id", userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async updateProfile(userId: string, updates: Partial<Database["public"]["Tables"]["profiles"]["Update"]>): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId);

    if (error) throw error;
  },
};
