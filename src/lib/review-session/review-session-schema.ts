import { Client } from "pg";

const REVIEW_SESSION_TABLE = "public.review_sessions";

let schemaCheckPromise: Promise<void> | null = null;

export class ReviewSessionSchemaError extends Error {
  code = "REVIEW_SESSION_SCHEMA_MISSING";
  operation = "schema_check";

  constructor(message: string) {
    super(message);
    this.name = "ReviewSessionSchemaError";
  }
}

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new ReviewSessionSchemaError(
      "DATABASE_URL is not configured. Cannot verify the review_sessions table."
    );
  }
  return url;
}

async function checkReviewSessionTableExists(): Promise<void> {
  const client = new Client({ connectionString: getDatabaseUrl() });
  try {
    await client.connect();
    const result = await client.query("select to_regclass($1) as exists", [REVIEW_SESSION_TABLE]);
    const exists = (result.rows[0] as { exists?: string | null } | undefined)?.exists;
    if (!exists) {
      throw new ReviewSessionSchemaError(
        "The review_sessions table has not been migrated yet. Please apply the latest Supabase migration."
      );
    }
  } finally {
    await client.end().catch(() => {});
  }
}

export async function ensureReviewSessionSchema(): Promise<void> {
  if (!schemaCheckPromise) {
    schemaCheckPromise = checkReviewSessionTableExists().catch((error: unknown) => {
      schemaCheckPromise = null;
      throw error;
    });
  }
  return schemaCheckPromise;
}
