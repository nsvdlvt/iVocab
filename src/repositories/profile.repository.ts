import { createClient } from "@/lib/supabase/server";
import { Database } from "@/types/database";
import { Client } from "pg";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

async function queryProfileById(userId: string): Promise<Pick<ProfileRow, "id" | "display_name" | "avatar_url"> | null> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return null;

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    const result = await client.query(
      "select id, display_name, avatar_url from public.profiles where id = $1 limit 1",
      [userId]
    );
    return result.rows[0] ?? null;
  } finally {
    await client.end().catch(() => undefined);
  }
}

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
    try {
      return await queryProfileById(userId);
    } catch {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .eq("id", userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    }
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
