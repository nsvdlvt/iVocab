import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { Database } from "@/types/database";

export class AdminUserRepository {
  private static async getSupabase() {
    const cookieStore = await cookies();
    return createServerClient<Database>(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      }
    );
  }

  static async getUsers(page: number = 1, pageSize: number = 10, search?: string) {
    const supabase = await this.getSupabase();
    
    let query = supabase.from("profiles").select("*", { count: "exact" });
    
    if (search) {
      query = query.or(`email.ilike.%${search}%,display_name.ilike.%${search}%`);
    }
    
    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);
      
    if (error) throw error;
    
    return {
      data,
      count: count || 0,
      page,
      pageSize,
    };
  }

  static async getUserById(id: string) {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase.from("profiles").select("*").eq("id", id).single();
    if (error) throw error;
    return data;
  }
}
