import type { Metadata } from "next";
import { AdminSettingsRepository } from "@/repositories/admin/settings.repository";
import { SettingsClient } from "@/components/admin/settings/settings-client";
import { requireAdmin } from "@/lib/auth/admin";

export const metadata: Metadata = {
  title: "Cài đặt & Cấu hình Hệ thống | Vocabee Admin",
  description: "Cấu hình chung ứng dụng, thuật toán học tập SRS, kết nối Google Gemini AI và chính sách bảo mật.",
};

export default async function AdminSettingsPage() {
  await requireAdmin();

  const { settings, isDatabaseLive } = await AdminSettingsRepository.getAllSettings();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Cài đặt Hệ thống (Settings)
          </h1>
          <p className="text-sm text-muted-foreground">
            Quản trị các tham số vận hành, cấu hình thuật toán Spaced Repetition và hạn mức tài nguyên AI.
          </p>
        </div>
      </div>

      <SettingsClient initialSettings={settings} isDatabaseLive={isDatabaseLive} />
    </div>
  );
}
