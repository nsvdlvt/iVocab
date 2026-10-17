"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { Database } from "@/types/database";
import { UserNotificationsRepository } from "@/repositories/user-notifications.repository";

async function getAuthUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return null;
  }
  return user;
}

export async function getUserNotificationsAction(filter: "all" | "unread" = "all", limit = 30) {
  const user = await getAuthUser();
  if (!user) {
    return { ok: false, error: "Chưa đăng nhập", items: [], unreadCount: 0 };
  }

  const result = await UserNotificationsRepository.getUserNotifications(user.id, filter, limit);
  return { ok: true, items: result.items, unreadCount: result.unreadCount };
}

export async function getUnreadNotificationCountAction() {
  const user = await getAuthUser();
  if (!user) {
    return { ok: false, count: 0 };
  }

  const count = await UserNotificationsRepository.getUnreadCount(user.id);
  return { ok: true, count };
}

export async function markNotificationAsReadAction(announcementId: string) {
  const user = await getAuthUser();
  if (!user) {
    return { ok: false, error: "Chưa đăng nhập" };
  }

  if (!announcementId) {
    return { ok: false, error: "Mã thông báo không hợp lệ" };
  }

  const success = await UserNotificationsRepository.markAsRead(user.id, announcementId);
  if (!success) {
    return { ok: false, error: "Không thể đánh dấu đã đọc" };
  }

  revalidatePath("/notifications");
  return { ok: true };
}

export async function markAllNotificationsAsReadAction() {
  const user = await getAuthUser();
  if (!user) {
    return { ok: false, error: "Chưa đăng nhập" };
  }

  const success = await UserNotificationsRepository.markAllAsRead(user.id);
  if (!success) {
    return { ok: false, error: "Không thể đánh dấu tất cả đã đọc" };
  }

  revalidatePath("/notifications");
  return { ok: true };
}

export async function dismissNotificationAction(announcementId: string) {
  const user = await getAuthUser();
  if (!user) {
    return { ok: false, error: "Chưa đăng nhập" };
  }

  if (!announcementId) {
    return { ok: false, error: "Mã thông báo không hợp lệ" };
  }

  const success = await UserNotificationsRepository.dismissNotification(user.id, announcementId);
  if (!success) {
    return { ok: false, error: "Không thể ẩn thông báo" };
  }

  revalidatePath("/notifications");
  return { ok: true };
}
