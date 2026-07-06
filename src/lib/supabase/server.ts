import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Database } from "@/types/database";
import { env } from "@/lib/env";
import { perfEnd, perfStart } from "@/lib/perf";

export const createClient = async () => {
  const timer = perfStart("createServerClient");
  const cookieStore = await cookies();
  const client = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Handled in middleware
          }
        },
      },
    }
  );

  perfEnd(timer);
  return client;
};
