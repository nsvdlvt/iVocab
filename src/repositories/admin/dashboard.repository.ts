import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { Database } from "@/types/database";

// Abstract class for dashboard metrics
export class AdminDashboardRepository {
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

  static async getTotalUsers(): Promise<number> {
    const supabase = await this.getSupabase();
    // Simulate delay for skeleton
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    const { count } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });
      
    return count || 0;
  }

  static async getTotalVocabularySets(): Promise<number> {
    const supabase = await this.getSupabase();
    await new Promise((resolve) => setTimeout(resolve, 600));
    
    const { count } = await supabase
      .from("vocab_sets")
      .select("*", { count: "exact", head: true });
      
    return count || 0;
  }

  static async getAiRequestsToday(): Promise<{ total: number; cost: number }> {
    await new Promise((resolve) => setTimeout(resolve, 400));
    // Mocked for now since there's no ai_requests table yet
    return { total: 8901, cost: 12.45 };
  }

  static async getDictCacheHitRate(): Promise<number> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return 94.2;
  }

  static async getRecentErrors(): Promise<Array<{id: number; type: string; message: string; time: string}>> {
    await new Promise((resolve) => setTimeout(resolve, 700));
    return [
      { id: 1, type: "API", message: "Failed to fetch OpenAI response", time: "2 mins ago" },
      { id: 2, type: "Auth", message: "Invalid session token", time: "15 mins ago" },
      { id: 3, type: "Database", message: "Connection timeout", time: "1 hour ago" },
    ];
  }
}
