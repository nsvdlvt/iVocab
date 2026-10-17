"use server";

import { assertAdmin } from "@/lib/auth/admin";
import { AdminUserRepository } from "@/repositories/admin/user.repository";
import { AdminVocabularyRepository } from "@/repositories/admin/vocabulary.repository";
import { AdminSrsRepository } from "@/repositories/admin/srs.repository";

function escapeCsvField(val: unknown): string {
  if (val === null || val === undefined) return '""';
  let str = String(val);
  // Mitigate CSV Formula Injection (CWE-1236)
  if (/^[=+\-@\t\r]/.test(str)) {
    str = "'" + str;
  }
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

function toCsv(headers: string[], rows: (string | number | boolean | null | undefined)[][]): string {
  const headerLine = headers.map(escapeCsvField).join(",");
  const dataLines = rows.map((row) => row.map(escapeCsvField).join(","));
  return [headerLine, ...dataLines].join("\r\n");
}

export async function exportUsersCsvAction() {
  await assertAdmin();

  const { data: users } = await AdminUserRepository.getUsers(1, 5000);

  const headers = ["User ID", "Email", "Display Name", "Role", "Created At"];
  const rows = (users || []).map((u) => [
    u.id,
    u.email || "",
    u.display_name || "",
    u.role,
    u.created_at,
  ]);

  const csv = toCsv(headers, rows);
  const filename = `vocabee-users-${new Date().toISOString().slice(0, 10)}.csv`;

  return { success: true, csv, filename };
}

export async function exportVocabSetsCsvAction() {
  await assertAdmin();

  const { data: sets } = await AdminVocabularyRepository.getSets(1, 5000);

  const headers = ["Set ID", "Title", "Description", "User ID", "Visibility", "Word Count", "Created At"];
  const rows = (sets || []).map((s: any) => [
    s.id,
    s.title,
    s.description || "",
    s.user_id,
    s.visibility || "private",
    s.word_count || 0,
    s.created_at,
  ]);

  const csv = toCsv(headers, rows);
  const filename = `vocabee-sets-${new Date().toISOString().slice(0, 10)}.csv`;

  return { success: true, csv, filename };
}

export async function exportVocabWordsCsvAction() {
  await assertAdmin();

  const { data: words } = await AdminVocabularyRepository.getWords(1, 5000);

  const headers = ["Word ID", "Word", "IPA", "Meaning", "Part of Speech", "Example", "Set ID", "Created At"];
  const rows = (words || []).map((w: any) => [
    w.id,
    w.word,
    w.ipa || "",
    w.meaning,
    w.part_of_speech || "",
    w.example || "",
    w.set_id,
    w.created_at,
  ]);

  const csv = toCsv(headers, rows);
  const filename = `vocabee-words-${new Date().toISOString().slice(0, 10)}.csv`;

  return { success: true, csv, filename };
}

export async function exportStudySessionsCsvAction() {
  await assertAdmin();

  const { data: sessions } = await AdminSrsRepository.getRecentStudySessions(1, 5000);
  const headers = ["Session ID", "User ID", "Started At", "Study Seconds", "Remembered Words"];
  const rows = (sessions || []).map((s: any) => [
    s.id,
    s.user_id,
    s.started_at,
    s.study_seconds || 0,
    s.remembered_words || 0,
  ]);

  const csv = toCsv(headers, rows);
  const filename = `vocabee-study-sessions-${new Date().toISOString().slice(0, 10)}.csv`;

  return { success: true, csv, filename };
}
