"use server";

import { assertAdmin } from "@/lib/auth/admin";
import { AdminAuditRepository } from "@/repositories/admin/audit.repository";
import { dictionaryService } from "@/lib/dictionary/dictionary.service";

export async function lookupDictionaryWordAction(word: string) {
  await assertAdmin();

  const term = word.trim();
  if (!term) {
    return { ok: false, error: "Từ tra cứu không được để trống" };
  }

  const start = performance.now();
  try {
    const data = await dictionaryService.lookup(term);
    const durationMs = Math.round(performance.now() - start);

    if (!data) {
      return {
        ok: false,
        durationMs,
        error: `Không tìm thấy từ "${term}" trong từ điển.`,
      };
    }

    return {
      ok: true,
      durationMs,
      data: [data],
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

  dictionaryService.clearCache();

  await AdminAuditRepository.logAction(
    "clear_dictionary_cache",
    "dictionary",
    "lru_cache",
    { clearedBy: user.email }
  );

  return { ok: true, message: "Bộ nhớ đệm từ điển đã được làm sạch thành công" };
}
