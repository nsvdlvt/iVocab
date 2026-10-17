import pg from "pg";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Missing DATABASE_URL in .env.local or process.env");
  process.exit(1);
}

async function run() {
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Connected to PostgreSQL pooler!");

    const sql = fs.readFileSync("supabase/migrations/20261017_web_push_notifications.sql", "utf8");
    console.log("Applying web push notifications migration...");
    await client.query(sql);
    console.log("Migration applied successfully!");

    // Verify tables exist
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('push_subscriptions', 'announcement_push_deliveries', 'admin_announcements')
    `);
    console.log("Verified tables in database:", res.rows.map(r => r.table_name));

    // Verify columns on admin_announcements
    const colRes = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'admin_announcements' 
      AND column_name LIKE 'push%' OR column_name = 'delivery_channels'
    `);
    console.table(colRes.rows);

  } catch (err) {
    console.error("Migration error:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
