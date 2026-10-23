"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/auth/admin";
import { AdminUserRepository } from "@/repositories/admin/user.repository";
import { AdminAuditRepository } from "@/repositories/admin/audit.repository";

export async function changeUserRoleAction(userId: string, newRole: "user" | "member" | "e_team" | "admin") {
  const { user } = await assertAdmin();

  // Prevent self-demotion to avoid locking out the current administrator
  if (user.id === userId && newRole !== "admin") {
    return { ok: false, error: "Bạn không thể tự hạ quyền quản trị viên của chính mình" };
  }

  const result = await AdminUserRepository.updateUserRole(userId, newRole);
  if (!result.success) {
    return { ok: false, error: result.error || "Không thể cập nhật phân quyền người dùng" };
  }

  await AdminAuditRepository.logAction(
    "change_user_role",
    "user",
    userId,
    { newRole, changedBy: user.email }
  );

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  return { ok: true };
}

export async function updateUserMetadataAction(
  userId: string,
  updates: { display_name?: string; level?: string; daily_goal?: number }
) {
  const { user } = await assertAdmin();

  const result = await AdminUserRepository.updateUserMetadata(userId, updates);
  if (!result.success) {
    return { ok: false, error: result.error || "Không thể cập nhật thông tin người dùng" };
  }

  await AdminAuditRepository.logAction(
    "update_user_metadata",
    "user",
    userId,
    { updates, updatedBy: user.email }
  );

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  return { ok: true };
}
