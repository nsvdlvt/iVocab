"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { Database } from "@/types/database";
import { PushSubscriptionRepository } from "@/repositories/push-subscription.repository";
import { assertAdmin } from "@/lib/auth/admin";

async function getAuthUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user;
}

export async function getVapidPublicKeyAction(): Promise<{ ok: boolean; publicKey?: string; error?: string }> {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey) {
    return { ok: false, error: "Hệ thống chưa cấu hình VAPID Public Key." };
  }
  return { ok: true, publicKey };
}



export interface RegisterPushSubscriptionPayload {
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string;
  deviceName?: string;
}

export async function registerPushSubscriptionAction(
  payload: RegisterPushSubscriptionPayload
): Promise<{ ok: boolean; error?: string }> {
  const user = await getAuthUser();
  if (!user) {
    return { ok: false, error: "Bạn cần đăng nhập để bật thông báo đẩy." };
  }

  const endpoint = payload.endpoint?.trim();
  const p256dh = payload.p256dh?.trim();
  const auth = payload.auth?.trim();

  if (!endpoint || !endpoint.startsWith("https://")) {
    return { ok: false, error: "Địa chỉ endpoint Push không hợp lệ (phải là URL https://)." };
  }

  if (!p256dh || !auth) {
    return { ok: false, error: "Thiếu khóa mã hóa P256DH hoặc Auth của thiết bị." };
  }

  const res = await PushSubscriptionRepository.upsertSubscription(user.id, {
    endpoint,
    p256dh,
    auth,
    userAgent: payload.userAgent || null,
    deviceName: payload.deviceName || null,
  });

  if (!res.ok) {
    return { ok: false, error: res.error || "Không thể lưu thông tin đăng ký Push." };
  }

  return { ok: true };
}

export async function unregisterPushSubscriptionAction(
  endpoint: string
): Promise<{ ok: boolean; error?: string }> {
  const user = await getAuthUser();
  if (!user) {
    return { ok: false, error: "Bạn cần đăng nhập để thao tác." };
  }

  if (!endpoint) {
    return { ok: false, error: "Thiếu endpoint thiết bị." };
  }

  const res = await PushSubscriptionRepository.deactivateSubscription(user.id, endpoint);
  if (!res.ok) {
    return { ok: false, error: res.error || "Không thể hủy đăng ký Push." };
  }

  return { ok: true };
}

export async function checkDevicePushStatusAction(
  endpoint: string
): Promise<{ ok: boolean; isSubscribed: boolean }> {
  const user = await getAuthUser();
  if (!user || !endpoint) {
    return { ok: true, isSubscribed: false };
  }

  const isSubscribed = await PushSubscriptionRepository.isEndpointActive(user.id, endpoint);
  return { ok: true, isSubscribed };
}

export async function getActivePushSubscribersCountAction(
  audience: "all" | "free" | "premium" | "admin" = "all"
): Promise<{ ok: boolean; count: number; error?: string }> {
  try {
    await assertAdmin();
    const count = await PushSubscriptionRepository.countActiveSubscriptions(audience);
    return { ok: true, count };
  } catch (err: any) {
    return { ok: false, count: 0, error: err.message || "Không có quyền quản trị." };
  }
}
