import pg from "pg";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Missing DATABASE_URL in .env.local or process.env");
  process.exit(1);
}

async function verify() {
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Connected to PostgreSQL pooler successfully!");

    // 1. Check announcements count & structure
    const annResult = await client.query(`
      SELECT id, title, type, priority, status, target_audience, is_active, created_at, published_at
      FROM admin_announcements
      ORDER BY created_at DESC
      LIMIT 5
    `);
    console.log(`Found ${annResult.rows.length} announcements:`);
    console.table(annResult.rows);

    // 2. Check user reads table
    const readsResult = await client.query(`
      SELECT count(*) as total_reads FROM user_announcement_reads
    `);
    console.log("Total user announcement reads:", readsResult.rows[0].total_reads);

    // 3. Check profiles count
    const profilesResult = await client.query(`
      SELECT role, count(*) as count FROM profiles GROUP BY role
    `);
    console.log("Profiles by role:");
    console.table(profilesResult.rows);

  } catch (err) {
    console.error("Verification error:", err);
  } finally {
    await client.end();
  }
}

verify();
