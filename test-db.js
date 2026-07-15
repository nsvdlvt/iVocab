import dotenv from "dotenv";
import fs from "node:fs";
import { Client } from "pg";

dotenv.config({ path: ".env.local" });

async function test() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();

  const { rows: profiles } = await client.query(
    "SELECT * FROM profiles WHERE display_name = 'Nguyá»…n Sá»¹ Viá»‡t DÅ©ng'"
  );
  console.log("Profile:", profiles[0]);

  const sql = fs.readFileSync("supabase/migrations/20260712_add_study_activity_fields.sql", "utf-8");
  console.log("Running migration...");
  try {
    await client.query(sql);
    console.log("Migration executed successfully!");
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error("Migration failed:", error.message);
  }

  const { rows: profiles2 } = await client.query(
    "SELECT * FROM profiles WHERE display_name = 'Nguyá»…n Sá»¹ Viá»‡t DÅ©ng'"
  );
  console.log("Keys after migration:", Object.keys(profiles2[0]));

  await client.end();
}

test().catch(console.error);
