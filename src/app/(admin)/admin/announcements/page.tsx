import type { Metadata } from "next";
import { AdminAnnouncementRepository } from "@/repositories/admin/announcement.repository";
import { AnnouncementsClient } from "@/components/admin/announcements/announcements-client";
import { requireAdmin } from "@/lib/auth/admin";

export const metadata: Metadata = {
  title: "Thông báo & Tin tức In-App | Vocabee Admin",
  description: "Quản lý thông báo hiển thị cho học viên, banner bảo trì hệ thống và các sự kiện nền tảng.",
};

export default async function AdminAnnouncementsPage() {
  await requireAdmin();

  const { announcements, isDatabaseLive } = await AdminAnnouncementRepository.getAnnouncements();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Thông báo & Tin tức In-App
          </h1>
          <p className="text-sm text-muted-foreground">
            Quản trị các thông báo toàn hệ thống, banner nhắc nhở học viên và điều hướng người dùng.
          </p>
        </div>
      </div>

      <AnnouncementsClient initialAnnouncements={announcements} isDatabaseLive={isDatabaseLive} />
    </div>
  );
}
