import type { Metadata } from "next";
import { AdminAnnouncementRepository } from "@/repositories/admin/announcement.repository";
import {
  NotificationTemplateRepository,
  type NotificationTemplateRow,
  type NotificationAutomationRuleRow,
  type NotificationAutomationRunRow,
  type NotificationDeliveryLogRow,
  type AutomationDashboardStats,
} from "@/repositories/admin/notification-template.repository";
import { AdminAnnouncementsHub } from "@/components/admin/announcements/admin-announcements-hub";
import { requireAdmin } from "@/lib/auth/admin";
import type { FallbackAnnouncement } from "@/lib/admin/fallback-store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Thông báo & Mẫu tự động hóa | Vocabee Admin",
  description: "Hệ thống quản lý thông báo, mẫu động hóa và quy tắc gửi tự động thông minh cho Vocabee.",
};

export default async function AdminAnnouncementsPage() {
  await requireAdmin();

  let announcements: FallbackAnnouncement[] = [];
  let isDatabaseLive = false;
  let templates: NotificationTemplateRow[] = [];
  let rules: Array<NotificationAutomationRuleRow & { template_name?: string; template_title?: string }> = [];
  let stats: AutomationDashboardStats = {
    totalTemplates: 0,
    activeTemplates: 0,
    totalRules: 0,
    activeRules: 0,
    totalSent: 0,
    totalFailed: 0,
    lastRunAt: null,
    totalSubscribers: 0,
  };
  let runs: Array<NotificationAutomationRunRow & { rule_name?: string }> = [];
  let logs: Array<NotificationDeliveryLogRow & { user_name?: string; user_email?: string; rule_name?: string }> = [];

  try {
    const [announcementsResult, t, r, s, ru, l] = await Promise.all([
      AdminAnnouncementRepository.getAnnouncements(),
      NotificationTemplateRepository.getTemplates(),
      NotificationTemplateRepository.getRules(),
      NotificationTemplateRepository.getDashboardStats(),
      NotificationTemplateRepository.getAutomationRuns(15),
      NotificationTemplateRepository.getDeliveryLogs(30),
    ]);

    announcements = announcementsResult.announcements;
    isDatabaseLive = announcementsResult.isDatabaseLive;
    templates = t;
    rules = r;
    stats = s;
    runs = ru;
    logs = l;
  } catch (err) {
    console.error("[AdminAnnouncementsPage] Failed to load data:", err);
  }

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
