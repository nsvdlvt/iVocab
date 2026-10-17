import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const envFile = fs.readFileSync(".env.local", "utf8");
const envVars = {};
for (const line of envFile.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const idx = trimmed.indexOf("=");
  if (idx !== -1) {
    const key = trimmed.slice(0, idx).trim();
    let val = trimmed.slice(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    envVars[key] = val;
  }
}

const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const [sets, words, articles, sessions, quizzes, reviews, stats] = await Promise.all([
    supabase.from("vocab_sets").select("id", { count: "exact", head: true }),
    supabase.from("vocabularies").select("id", { count: "exact", head: true }),
    supabase.from("reading_articles").select("id", { count: "exact", head: true }),
    supabase.from("study_sessions").select("id", { count: "exact", head: true }),
    supabase.from("quiz_history").select("id", { count: "exact", head: true }),
    supabase.from("reviews").select("id", { count: "exact", head: true }),
    supabase.from("user_statistics").select("user_id", { count: "exact", head: true })
  ]);

  console.log("REAL SUPABASE METRICS:", {
    vocabSets: sets.count,
    vocabWords: words.count,
    readingArticles: articles.count,
    studySessions: sessions.count,
    quizHistory: quizzes.count,
    reviews: reviews.count,
    userStatistics: stats.count
  });
}

run().catch(console.error);
