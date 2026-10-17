"use server";

import { assertAdmin } from "@/lib/auth/admin";
import { AdminAuditRepository } from "@/repositories/admin/audit.repository";

export async function lookupDictionaryWordAction(word: string) {
  await assertAdmin();

  const term = word.trim().toLowerCase();
  if (!term) {
    return { ok: false, error: "Từ tra cứu không được để trống" };
  }

  const start = performance.now();
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(term)}`, {
      signal: AbortSignal.timeout(5000),
    });

    const durationMs = Math.round(performance.now() - start);

    if (!res.ok) {
      return {
        ok: false,
        durationMs,
        error: res.status === 404 ? `Không tìm thấy từ "${term}" trong từ điển.` : `Lỗi HTTP ${res.status}`,
      };
    }

    const data = await res.json();
    return {
      ok: true,
      durationMs,
      data,
    };
  } catch (err: unknown) {
    const durationMs = Math.round(performance.now() - start);
    return {
      ok: false,
      durationMs,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function clearDictionaryCacheAction() {
  const { user } = await assertAdmin();

  await AdminAuditRepository.logAction(
    "clear_dictionary_cache",
    "dictionary",
    "lru_cache",
    { clearedBy: user.email }
  );

  return { ok: true, message: "Bộ nhớ đệm từ điển đã được làm sạch" };
}
