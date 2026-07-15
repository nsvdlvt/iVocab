import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { Database } from "@/types/database";

export type HealthStatus = "healthy" | "degraded" | "unhealthy" | "unknown";

export type SystemHealthResult = {
  service: string;
  status: HealthStatus;
  latencyMs?: number;
  message?: string;
};

export class AdminHealthRepository {
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

  static async checkDatabase(): Promise<SystemHealthResult> {
    try {
      const start = Date.now();
      const supabase = await this.getSupabase();
      
      // Perform a lightweight query: fetch 1 profile
      const { error } = await supabase.from("profiles").select("id").limit(1);
      
      const latencyMs = Date.now() - start;

      if (error) {
        return { service: "Database", status: "unhealthy", latencyMs, message: error.message };
      }

      return { service: "Database", status: "healthy", latencyMs };
    } catch (e: unknown) {
      return { service: "Database", status: "unhealthy", message: e instanceof Error ? e.message : String(e) };
    }
  }

  static async checkStorage(): Promise<SystemHealthResult> {
    try {
      const start = Date.now();
      const supabase = await this.getSupabase();
      
      // Perform a lightweight query: list buckets
      const { error } = await supabase.storage.listBuckets();
      
      const latencyMs = Date.now() - start;

      if (error) {
        return { service: "Storage", status: "unhealthy", latencyMs, message: error.message };
      }

      return { service: "Storage", status: "healthy", latencyMs };
    } catch (e: unknown) {
      return { service: "Storage", status: "unhealthy", message: e instanceof Error ? e.message : String(e) };
    }
  }

  static async checkAiProvider(): Promise<SystemHealthResult> {
    // We would ping the OpenAI / Google AI / Anthropic API here.
    // For now, since we don't have a direct health endpoint readily accessible in the repo,
    // we'll return unknown unless we can actually hit it.
    return { service: "AI Provider", status: "unknown", message: "Health check not implemented yet" };
  }

  static async checkDictionaryApi(): Promise<SystemHealthResult> {
    // We would ping the Dictionary API (e.g. Free Dictionary API or Wordnik) here.
    return { service: "Dictionary API", status: "unknown", message: "Health check not implemented yet" };
  }

  static async checkBackgroundJobs(): Promise<SystemHealthResult> {
    // If we have an Inngest or Upstash scheduler, check it here.
    return { service: "Background Jobs", status: "unknown", message: "No scheduler configured yet" };
  }

  static async getSystemHealth(): Promise<SystemHealthResult[]> {
    // Run checks in parallel
    const results = await Promise.all([
      this.checkDatabase(),
      this.checkStorage(),
      this.checkAiProvider(),
      this.checkDictionaryApi(),
      this.checkBackgroundJobs(),
    ]);

    return results;
  }
}
