"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/auth/admin";
import { AdminAnnouncementRepository } from "@/repositories/admin/announcement.repository";
import { AdminAuditRepository } from "@/repositories/admin/audit.repository";
import { UserNotificationsRepository } from "@/repositories/user-notifications.repository";
import { WebPushService, type PushDeliverySummary } from "@/lib/push/web-push-service";
import { PushSubscriptionRepository } from "@/repositories/push-subscription.repository";

export interface CreateAnnouncementPayload {
  title: string;
  content: string;
  summary?: string | null;
  type: "info" | "warning" | "success" | "broadcast";
  priority?: "low" | "normal" | "high" | "urgent";
  target_audience: "all" | "free" | "premium" | "admin";
  status?: "draft" | "scheduled" | "published" | "archived";
  delivery_channels?: "in_app" | "push" | "both";
  action_url?: string | null;
  start_at?: string | null;
  end_at?: string | null;
}

export async function createAnnouncementAction(payload: CreateAnnouncementPayload) {
  try {
    const { user } = await assertAdmin();

    const title = payload.title?.trim();
    const content = payload.content?.trim();

    if (!title || title.length < 3) {
      return { ok: false, error: "Tiêu đề thông báo phải có ít nhất 3 ký tự" };
    }
    if (title.length > 200) {
      return { ok: false, error: "Tiêu đề thông báo không được vượt quá 200 ký tự" };
    }

    if (!content || content.length < 5) {
      return { ok: false, error: "Nội dung thông báo phải có ít nhất 5 ký tự" };
    }
    if (content.length > 3000) {
      return { ok: false, error: "Nội dung thông báo không được vượt quá 3000 ký tự" };
    }

    // Validate and sanitize action URL if provided
    let sanitizedUrl: string | null = null;
    if (payload.action_url && payload.action_url.trim()) {
      sanitizedUrl = UserNotificationsRepository.sanitizeActionUrl(payload.action_url);
      if (!sanitizedUrl) {
        return { ok: false, error: "Liên kết đính kèm không hợp lệ (chỉ chấp nhận đường dẫn tương đối hoặc https://)" };
      }
    }

    // Validate dates if scheduling is provided
    if (payload.start_at && payload.end_at) {
      const start = new Date(payload.start_at).getTime();
      const end = new Date(payload.end_at).getTime();
      if (end <= start) {
        return { ok: false, error: "Thời gian kết thúc phải diễn ra sau thời gian bắt đầu" };
      }
    }

    const res = await AdminAnnouncementRepository.createAnnouncement({
      title,
      content,
      summary: payload.summary?.trim() || null,
      type: payload.type || "info",
      priority: payload.priority || "normal",
      target_audience: payload.target_audience || "all",
      status: payload.status || "published",
      action_url: sanitizedUrl,
      start_at: payload.start_at || null,
      end_at: payload.end_at || null,
      created_by: user.id,
      delivery_channels: payload.delivery_channels || "in_app",
    });

    if (!res.ok || !res.data) {
      return { ok: false, error: res.error || "Lỗi khi lưu thông báo vào cơ sở dữ liệu" };
    }

    try {
      await AdminAuditRepository.logAction(
        "create_announcement",
        "announcement",
        res.data.id,
        {
          title: res.data.title,
          type: res.data.type,
          status: res.data.status,
          target_audience: res.data.target_audience,
          delivery_channels: res.data.delivery_channels,
          createdBy: user.email,
        }
      );
    } catch {}

    // If published and push is selected, broadcast via Web Push
    let pushSummary: PushDeliverySummary | undefined;
    if (
      res.data.status === "published" &&
      (res.data.delivery_channels === "push" || res.data.delivery_channels === "both")
    ) {
      try {
        pushSummary = await WebPushService.broadcastAnnouncement(res.data);
      } catch (pushErr: any) {
        console.error("Lỗi khi gửi Web Push:", pushErr);
      }
    }

    revalidatePath("/admin/announcements");
    revalidatePath("/notifications");
    return { ok: true, id: res.data.id, pushSummary };
  } catch (err: any) {
    return { ok: false, error: err.message || "Không có quyền quản trị hoặc xảy ra lỗi" };
  }
}

export async function updateAnnouncementAction(
  id: string,
  payload: Partial<CreateAnnouncementPayload> & { is_active?: boolean }
) {
  try {
    const { user } = await assertAdmin();

    if (!id) return { ok: false, error: "Thiếu mã thông báo (ID)" };

    const updates: Record<string, unknown> = {};

    if (payload.title !== undefined) {
      const title = payload.title.trim();
      if (!title || title.length < 3) return { ok: false, error: "Tiêu đề không được để trống" };
      updates.title = title;
    }

    if (payload.content !== undefined) {
      const content = payload.content.trim();
      if (!content || content.length < 5) return { ok: false, error: "Nội dung không được để trống" };
      updates.content = content;
    }

    if (payload.summary !== undefined) updates.summary = payload.summary?.trim() || null;
    if (payload.type !== undefined) updates.type = payload.type;
    if (payload.priority !== undefined) updates.priority = payload.priority;
    if (payload.target_audience !== undefined) updates.target_audience = payload.target_audience;
    if (payload.status !== undefined) updates.status = payload.status;
    if (payload.is_active !== undefined) updates.is_active = payload.is_active;
    if (payload.start_at !== undefined) updates.start_at = payload.start_at;
    if (payload.end_at !== undefined) updates.end_at = payload.end_at;

    if (payload.action_url !== undefined) {
      if (payload.action_url && payload.action_url.trim()) {
        const sanitized = UserNotificationsRepository.sanitizeActionUrl(payload.action_url);
        if (!sanitized) return { ok: false, error: "Đường dẫn liên kết không an toàn" };
        updates.action_url = sanitized;
      } else {
        updates.action_url = null;
      }
    }

    const res = await AdminAnnouncementRepository.updateAnnouncement(id, updates);
    if (!res.ok) {
      return { ok: false, error: res.error || "Không thể cập nhật thông báo" };
    }

    try {
      await AdminAuditRepository.logAction(
        "update_announcement",
        "announcement",
        id,
        { updates, updatedBy: user.email }
      );
    } catch {}

    revalidatePath("/admin/announcements");
    revalidatePath("/notifications");
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message || "Không có quyền quản trị hoặc xảy ra lỗi" };
  }
}

export async function publishAnnouncementAction(id: string, options?: { sendPush?: boolean }) {
  try {
    const { user } = await assertAdmin();

    const res = await AdminAnnouncementRepository.publishAnnouncement(id);
    if (!res.ok) {
      return { ok: false, error: res.error || "Không thể phát hành thông báo" };
    }

    try {
      await AdminAuditRepository.logAction(
        "publish_announcement",
        "announcement",
        id,
        { publishedBy: user.email }
      );
    } catch {}

    // Trigger push notification if requested or configured on the announcement
    let pushSummary: PushDeliverySummary | undefined;
    try {
      const { announcements } = await AdminAnnouncementRepository.getAnnouncements();
      const ann = announcements.find((a) => a.id === id);
      if (ann && (options?.sendPush || ann.delivery_channels === "push" || ann.delivery_channels === "both")) {
        pushSummary = await WebPushService.broadcastAnnouncement(ann);
      }
    } catch (pushErr: any) {
      console.error("Lỗi gửi push khi phát hành:", pushErr);
    }

    revalidatePath("/admin/announcements");
    revalidatePath("/notifications");
    return { ok: true, pushSummary };
  } catch (err: any) {
    return { ok: false, error: err.message || "Không có quyền quản trị hoặc xảy ra lỗi" };
  }
}

export async function archiveAnnouncementAction(id: string) {
  try {
    const { user } = await assertAdmin();

    const res = await AdminAnnouncementRepository.archiveAnnouncement(id);
    if (!res.ok) {
      return { ok: false, error: res.error || "Không thể lưu trữ thông báo" };
    }

    try {
      await AdminAuditRepository.logAction(
        "archive_announcement",
        "announcement",
        id,
        { archivedBy: user.email }
      );
    } catch {}

    revalidatePath("/admin/announcements");
    revalidatePath("/notifications");
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message || "Không có quyền quản trị hoặc xảy ra lỗi" };
  }
}

export async function toggleAnnouncementActiveAction(id: string, isActive: boolean) {
  try {
    const { user } = await assertAdmin();

    const res = await AdminAnnouncementRepository.updateAnnouncement(id, {
      is_active: isActive,
      status: isActive ? "published" : "draft",
    });

    if (!res.ok) {
      return { ok: false, error: res.error || "Lỗi khi cập nhật trạng thái thông báo" };
    }

    try {
      await AdminAuditRepository.logAction(
        "toggle_announcement",
        "announcement",
        id,
        { is_active: isActive, updatedBy: user.email }
      );
    } catch {}

    revalidatePath("/admin/announcements");
    revalidatePath("/notifications");
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message || "Không có quyền quản trị hoặc xảy ra lỗi" };
  }
}

export async function deleteAnnouncementAction(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { user } = await assertAdmin();

    const res = await AdminAnnouncementRepository.deleteAnnouncement(id);
    if (!res.ok) {
      return { ok: false, error: res.error || "Lỗi khi xóa thông báo" };
    }

    try {
      await AdminAuditRepository.logAction(
        "delete_announcement",
        "announcement",
        id,
        { deletedBy: user.email }
      );
    } catch {}

    revalidatePath("/admin/announcements");
    revalidatePath("/notifications");
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message || "Không có quyền quản trị hoặc xảy ra lỗi" };
  }
}

export async function getAudienceEstimateAction(audience: "all" | "free" | "premium" | "admin") {
  try {
    await assertAdmin();
    const count = await AdminAnnouncementRepository.getAudienceEstimate(audience);
    const pushSubscribersCount = await PushSubscriptionRepository.countActiveSubscriptions(audience);
    return { ok: true, count, pushSubscribersCount };
  } catch (err: any) {
    return { ok: false, error: err.message || "Lỗi khi ước tính đối tượng" };
  }
}
