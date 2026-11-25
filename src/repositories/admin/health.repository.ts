import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { Database } from "@/types/database";
import {
  getCloudflareApiToken,
  getCloudflareHealthCheckUrl,
  isCloudflareConfigured,
} from "@/lib/ai/cloudflare/config";

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
    const serviceName = "Cloudflare Workers AI";

    if (!isCloudflareConfigured()) {
      return {
        service: serviceName,
        status: "unhealthy",
        message: "Chưa cấu hình CLOUDFLARE_API_TOKEN hoặc CLOUDFLARE_ACCOUNT_ID",
      };
    }

    const apiToken = getCloudflareApiToken();
    const healthUrl = getCloudflareHealthCheckUrl();
    const start = performance.now();

    try {
      const res = await fetch(healthUrl, {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(5000),
      });
      const latencyMs = Math.round(performance.now() - start);
      if (res.ok) {
        const body = (await res.json().catch(() => null)) as { success?: boolean } | null;
        if (body && body.success === false) {
          return { service: serviceName, status: "degraded", latencyMs, message: "Cloudflare API returned success=false" };
        }
        return { service: serviceName, status: "healthy", latencyMs };
      }
      return { service: serviceName, status: "degraded", latencyMs, message: `Status code: ${res.status}` };
    } catch (e: unknown) {
      return { service: serviceName, status: "unhealthy", message: e instanceof Error ? e.message : String(e) };
    }
  }

  static async checkDictionaryApi(): Promise<SystemHealthResult> {
    const start = performance.now();
    try {
      const res = await fetch("https://api.dictionaryapi.dev/api/v2/entries/en/hello", {
        signal: AbortSignal.timeout(3000),
      });
      const latencyMs = Math.round(performance.now() - start);
      if (res.ok) {
        return { service: "Free Dictionary API", status: "healthy", latencyMs };
      }
      return { service: "Free Dictionary API", status: "degraded", latencyMs, message: `Status code: ${res.status}` };
    } catch (e: unknown) {
      return {
        service: "Free Dictionary API",
        status: "unhealthy",
        message: e instanceof Error ? e.message : String(e),
      };
    }
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
