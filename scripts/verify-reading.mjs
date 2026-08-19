import dotenv from "dotenv";
import { Client } from "pg";

dotenv.config({ path: ".env.local" });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();

  const tableResult = await client.query("select to_regclass('public.reading_articles') as tbl");
  const columnsResult = await client.query(`
    select column_name, data_type, is_nullable, column_default
    from information_schema.columns
    where table_schema = 'public' and table_name = 'reading_articles'
    order by ordinal_position
  `);
  const pkResult = await client.query(`
    select kcu.column_name
    from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu
      on tc.constraint_name = kcu.constraint_name
     and tc.table_schema = kcu.table_schema
    where tc.table_schema = 'public'
      and tc.table_name = 'reading_articles'
      and tc.constraint_type = 'PRIMARY KEY'
    order by kcu.ordinal_position
  `);
  const uniqueResult = await client.query(`
    select kcu.column_name, tc.constraint_name
    from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu
      on tc.constraint_name = kcu.constraint_name
     and tc.table_schema = kcu.table_schema
    where tc.table_schema = 'public'
      and tc.table_name = 'reading_articles'
      and tc.constraint_type = 'UNIQUE'
    order by tc.constraint_name, kcu.ordinal_position
  `);
  const indexesResult = await client.query(`
    select indexname, indexdef
    from pg_indexes
    where schemaname = 'public' and tablename = 'reading_articles'
    order by indexname
  `);
  const policiesResult = await client.query(`
    select policyname, cmd, permissive, roles, qual
    from pg_policies
    where schemaname = 'public' and tablename = 'reading_articles'
    order by policyname
  `);
  const countResult = await client.query(`
    select count(*)::int as count,
      bool_and(status = 'published') as all_published
    from public.reading_articles
  `);
  const rowsResult = await client.query(`
    select title, slug, status
    from public.reading_articles
    order by published_at desc, created_at desc, title asc
    limit 5
  `);

  console.log(JSON.stringify({
    connected: true,
    tableExists: tableResult.rows[0].tbl !== null,
    columns: columnsResult.rows,
    primaryKey: pkResult.rows.map((row) => row.column_name),
    uniqueConstraints: uniqueResult.rows,
    indexes: indexesResult.rows,
    policies: policiesResult.rows,
    articleCount: countResult.rows[0].count,
    allPublished: countResult.rows[0].all_published,
    articles: rowsResult.rows,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.end().catch(() => {});
  });
