"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface UserPreferencesDto {
  study_reminders: boolean;
  review_reminders: boolean;
  streak_reminders: boolean;
  inactivity_reminders: boolean;
  milestone_reminders: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  timezone: string;
}

export async function getUserNotificationPreferencesAction(): Promise<{
  ok: boolean;
  preferences?: UserPreferencesDto;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, error: "Chưa đăng nhập" };
    }

    const { data, error } = await supabase
      .from("notification_user_preferences")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      return { ok: false, error: error.message };
    }

    const defaultPrefs: UserPreferencesDto = {
      study_reminders: true,
      review_reminders: true,
      streak_reminders: true,
      inactivity_reminders: true,
      milestone_reminders: true,
      quiet_hours_enabled: false,
      quiet_hours_start: "22:00",
      quiet_hours_end: "07:00",
      timezone: "Asia/Ho_Chi_Minh",
    };

    if (!data) {
      return { ok: true, preferences: defaultPrefs };
    }

    return {
      ok: true,
      preferences: {
        study_reminders: data.study_reminders ?? true,
        review_reminders: data.review_reminders ?? true,
        streak_reminders: data.streak_reminders ?? true,
        inactivity_reminders: data.inactivity_reminders ?? true,
        milestone_reminders: data.milestone_reminders ?? true,
        quiet_hours_enabled: data.quiet_hours_enabled ?? false,
        quiet_hours_start: data.quiet_hours_start || "22:00",
        quiet_hours_end: data.quiet_hours_end || "07:00",
        timezone: data.timezone || "Asia/Ho_Chi_Minh",
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg || "Lỗi khi lấy cài đặt thông báo" };
  }
}

export async function updateUserNotificationPreferencesAction(
  updates: Partial<UserPreferencesDto>
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, error: "Chưa đăng nhập" };
    }

    const { error } = await supabase
      .from("notification_user_preferences")
      .upsert(
        {
          user_id: user.id,
          ...updates,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidatePath("/settings");
    return { ok: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg || "Lỗi khi cập nhật cài đặt thông báo" };
  }
}
