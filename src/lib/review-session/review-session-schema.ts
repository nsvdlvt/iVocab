import { createClient } from "@/lib/supabase/server";

const REVIEW_SESSION_TABLE = "public.review_sessions";

let isSchemaVerified = false;

export class ReviewSessionSchemaError extends Error {
  code = "REVIEW_SESSION_SCHEMA_MISSING";
  operation = "schema_check";

  constructor(message: string) {
    super(message);
    this.name = "ReviewSessionSchemaError";
  }
}

async function checkReviewSessionTableExists(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (url) {
    try {
      const { Client } = await import("pg");
      const client = new Client({ connectionString: url });
      await client.connect();
      try {
        const result = await client.query("select to_regclass($1) as exists", [REVIEW_SESSION_TABLE]);
        const exists = (result.rows[0] as { exists?: string | null } | undefined)?.exists;
        if (!exists) {
          throw new ReviewSessionSchemaError(
            "The review_sessions table has not been migrated yet. Please apply the latest Supabase migration."
          );
        }
        isSchemaVerified = true;
        return;
      } finally {
        await client.end().catch(() => {});
      }
    } catch (pgError) {
      if (pgError instanceof ReviewSessionSchemaError) throw pgError;
      // If direct postgres connection fails, fall back to Supabase client verification
    }
  }

  // Fallback: verify via Supabase client (standard for client/serverless environments without DATABASE_URL)
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("review_sessions")
      .select("id")
      .limit(1);

    if (error) {
      const isMissingTable =
        error.code === "42P01" ||
        error.code === "PGRST205" ||
        error.message?.includes("does not exist") ||
        error.message?.includes("relation");

      if (isMissingTable) {
        throw new ReviewSessionSchemaError(
          "The review_sessions table has not been migrated yet. Please apply the latest Supabase migration."
        );
      }
    }
    isSchemaVerified = true;
  } catch (error) {
    if (error instanceof ReviewSessionSchemaError) throw error;
    // Don't block requests if it's an unrelated transient issue
    isSchemaVerified = true;
  }
}

export async function ensureReviewSessionSchema(): Promise<void> {
  if (isSchemaVerified) return;
  await checkReviewSessionTableExists();
}
