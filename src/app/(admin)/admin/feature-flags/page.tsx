import type { Metadata } from "next";
import { AdminFeatureFlagsRepository } from "@/repositories/admin/feature-flags.repository";
import { FeatureFlagsClient } from "@/components/admin/feature-flags/feature-flags-client";
import { requireAdmin } from "@/lib/auth/admin";

export const metadata: Metadata = {
  title: "Cờ Tính Năng & Chế độ Bảo trì | Vocabee Admin",
  description: "Bật tắt tính năng tức thì, điều phối phát hành và kiểm soát chế độ bảo trì hệ thống.",
};

export default async function AdminFeatureFlagsPage() {
  await requireAdmin();

  const { flags, isDatabaseLive } = await AdminFeatureFlagsRepository.getFlags();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Cờ Tính Năng (Feature Flags) & Bảo trì
          </h1>
          <p className="text-sm text-muted-foreground">
            Kiểm soát phát hành tính năng theo thời gian thực và quản lý trạng thái bảo trì toàn hệ thống.
          </p>
        </div>
      </div>

      <FeatureFlagsClient initialFlags={flags} isDatabaseLive={isDatabaseLive} />
    </div>
  );
}
