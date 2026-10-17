"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/auth/admin";
import { AdminSettingsRepository } from "@/repositories/admin/settings.repository";
import { AdminAuditRepository } from "@/repositories/admin/audit.repository";

export async function saveSettingsAction(key: string, value: Record<string, unknown>) {
  try {
    const { user } = await assertAdmin();

    const result = await AdminSettingsRepository.updateSetting(key, value);
    if (!result.ok) {
      return { ok: false, error: result.error };
    }

    try {
      await AdminAuditRepository.logAction(
        "save_settings",
        "settings",
        key,
        { value, updatedBy: user.email }
      );
    } catch {
      // Audit log failures should not block settings save if audit table doesn't exist
    }

    revalidatePath("/admin/settings");
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message || "Không có quyền quản trị hoặc xảy ra lỗi" };
  }
}
