import dotenv from "dotenv";
import fs from "node:fs";
import { Client } from "pg";

dotenv.config({ path: ".env.local" });

async function run() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set in .env.local");
    process.exit(1);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log("Connected to PostgreSQL database.");

  const sqlFile = "supabase/migrations/20261018_automated_notifications_dynamic_templates.sql";
  const sql = fs.readFileSync(sqlFile, "utf-8");

  console.log(`Executing migration ${sqlFile}...`);
  await client.query(sql);
  console.log("Migration executed successfully!");

  await client.end();
}

run().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
