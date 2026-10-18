import type { Metadata } from "next";
import { AdminAnnouncementRepository } from "@/repositories/admin/announcement.repository";
import { NotificationTemplateRepository } from "@/repositories/admin/notification-template.repository";
import { AdminAnnouncementsHub } from "@/components/admin/announcements/admin-announcements-hub";
import { requireAdmin } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Thông báo & Mẫu tự động hóa | Vocabee Admin",
  description: "Hệ thống quản lý thông báo, mẫu động hóa và quy tắc gửi tự động thông minh cho Vocabee.",
};

export default async function AdminAnnouncementsPage() {
  await requireAdmin();

  const [
    { announcements, isDatabaseLive },
    templates,
    rules,
    stats,
    runs,
    logs,
  ] = await Promise.all([
    AdminAnnouncementRepository.getAnnouncements(),
    NotificationTemplateRepository.getTemplates(),
    NotificationTemplateRepository.getRules(),
    NotificationTemplateRepository.getDashboardStats(),
    NotificationTemplateRepository.getAutomationRuns(15),
    NotificationTemplateRepository.getDeliveryLogs(30),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Thông báo & Động hóa (Automation Hub)
          </h1>
          <p className="text-sm text-muted-foreground">
            Thiết kế mẫu thông báo động, thiết lập trigger kích hoạt thông minh và theo dõi phân phối In-App &amp; Web Push.
          </p>
        </div>
      </div>

      <AdminAnnouncementsHub
        announcements={announcements}
        isDatabaseLive={isDatabaseLive}
        templates={templates}
        rules={rules}
        stats={stats}
        runs={runs}
        logs={logs}
      />
    </div>
  );
}
