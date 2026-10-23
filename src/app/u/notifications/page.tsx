import React from "react";
import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { requireUser } from "@/lib/auth/require-user";
import { UserNotificationsRepository } from "@/repositories/user-notifications.repository";
import { NotificationCenterClient } from "@/components/notifications/NotificationCenterClient";

export const metadata: Metadata = {
  title: "Trung tâm thông báo",
  description: "Cập nhật tin tức, bài học mới và thông báo quan trọng trên Vocabee.",
};

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const profile = await requireUser();
  const notifications = await UserNotificationsRepository.getUserNotifications(
    profile.id,
    "all",
    50
  );

  return (
    <PageContainer className="max-w-4xl space-y-6 md:space-y-8">
      <PageHeader
        title="Trung tâm thông báo"
        description="Xem toàn bộ tin tức hệ thống, bản tin cập nhật và nhắc nhở học tập dành riêng cho bạn."
      />

      <NotificationCenterClient
        initialItems={notifications.items}
        initialUnreadCount={notifications.unreadCount}
      />
    </PageContainer>
  );
}
