"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/auth/admin";
import { AdminFeatureFlagsRepository } from "@/repositories/admin/feature-flags.repository";
import { AdminAuditRepository } from "@/repositories/admin/audit.repository";

export async function toggleFeatureFlagAction(key: string, isEnabled: boolean): Promise<{ ok: boolean; error?: string }> {
  try {
    const { user } = await assertAdmin();

    const res = await AdminFeatureFlagsRepository.toggleFlag(key, isEnabled);
    if (!res.success) {
      return { ok: false, error: res.error };
    }

    await AdminAuditRepository.logAction(
      "toggle_feature_flag",
      "feature_flag",
      key,
      { is_enabled: isEnabled, updatedBy: user.email }
    );

    revalidatePath("/admin/feature-flags");
    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
