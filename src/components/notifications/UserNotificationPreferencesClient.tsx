"use client";

import React, { useState, useEffect } from "react";
import {
  BookOpen,
  BrainCircuit,
  Flame,
  Clock,
  Trophy,
  Moon,
  Save,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getUserNotificationPreferencesAction,
  updateUserNotificationPreferencesAction,
  type UserPreferencesDto,
} from "@/actions/notification-preferences";

export function UserNotificationPreferencesClient() {
  const [prefs, setPrefs] = useState<UserPreferencesDto>({
    study_reminders: true,
    review_reminders: true,
    streak_reminders: true,
    inactivity_reminders: true,
    milestone_reminders: true,
    quiet_hours_enabled: false,
    quiet_hours_start: "22:00",
    quiet_hours_end: "07:00",
    timezone: "Asia/Ho_Chi_Minh",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      const res = await getUserNotificationPreferencesAction();
      if (isMounted && res.ok && res.preferences) {
        setPrefs(res.preferences);
      }
      if (isMounted) setIsLoading(false);
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggle = (key: keyof UserPreferencesDto) => {
    setPrefs((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setErrorMessage(null);
      const res = await updateUserNotificationPreferencesAction(prefs);
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setErrorMessage(res.error || "Không thể lưu tùy chọn");
      }
    } catch {
      setErrorMessage("Lỗi kết nối khi lưu cài đặt");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span>Đang tải tùy chọn thông báo...</span>
      </div>
    );
  }

  const preferenceItems = [
    {
      key: "study_reminders" as const,
      label: "Nhắc nhở học tập hàng ngày",
      description: "Nhận thông báo khi bạn chưa hoàn thành mục tiêu học từ vựng trong ngày",
      icon: BookOpen,
      enabled: prefs.study_reminders,
    },
    {
      key: "review_reminders" as const,
      label: "Nhắc ôn tập ngắt quãng (SRS)",
      description: "Báo khi có từ vựng đến hạn cần ôn tập để duy trì trí nhớ dài hạn",
      icon: BrainCircuit,
      enabled: prefs.review_reminders,
    },
    {
      key: "streak_reminders" as const,
      label: "Cảnh báo bảo vệ chuỗi Streak",
      description: "Cảnh báo vào buổi tối nếu bạn có nguy cơ bị đứt chuỗi ngày học liên tục",
      icon: Flame,
      enabled: prefs.streak_reminders,
    },
    {
      key: "inactivity_reminders" as const,
      label: "Nhắc nhở khi tạm ngưng học",
      description: "Gửi thông điệp khích lệ quay lại khi bạn vắng mặt từ 3 ngày trở lên",
      icon: Clock,
      enabled: prefs.inactivity_reminders,
    },
    {
      key: "milestone_reminders" as const,
      label: "Cột mốc & Thành tích học tập",
      description: "Thông báo chúc mừng khi bạn đạt kỷ lục mới về số từ hoặc chuỗi ngày học",
      icon: Trophy,
      enabled: prefs.milestone_reminders,
    },
  ];

  return (
    <div className="space-y-5">
      {errorMessage && (
        <div className="p-3 text-xs rounded-xl bg-destructive/10 text-destructive border border-destructive/20 font-medium">
          {errorMessage}
        </div>
      )}

      {/* Preferences List */}
      <div className="space-y-3">
        {preferenceItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.key}
              onClick={() => handleToggle(item.key)}
              className="flex items-center justify-between border border-border/80 rounded-2xl p-4 bg-card text-card-foreground shadow-2xs hover:border-border transition-colors cursor-pointer select-none"
            >
              <div className="flex items-start gap-3 min-w-0 pr-3">
                <div className="mt-0.5 p-2 rounded-xl bg-primary/10 text-primary shrink-0">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <div className="text-xs sm:text-sm font-bold text-foreground">
                    {item.label}
                  </div>
                  <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Toggle switch */}
              <button
                type="button"
                role="switch"
                aria-checked={item.enabled}
                className={`h-6 w-11 rounded-full p-0.5 flex items-center transition-colors shrink-0 cursor-pointer ${
                  item.enabled ? "bg-primary justify-end" : "bg-muted-foreground/30 justify-start"
                }`}
              >
                <div className="h-5 w-5 bg-background rounded-full shadow-sm" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Quiet Hours Section */}
      <div className="border border-border/80 rounded-2xl p-4 sm:p-5 bg-card text-card-foreground shadow-2xs space-y-4">
        <div
          onClick={() => handleToggle("quiet_hours_enabled")}
          className="flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-start gap-3 min-w-0 pr-3">
            <div className="mt-0.5 p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
              <Moon className="h-4 w-4" />
            </div>
            <div className="space-y-0.5">
              <div className="text-xs sm:text-sm font-bold text-foreground">
                Giờ yên tĩnh (Quiet Hours)
              </div>
              <p className="text-[11px] sm:text-xs text-muted-foreground">
                Không làm phiền và không gửi thông báo tự động trong khung giờ nghỉ ngơi của bạn
              </p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={prefs.quiet_hours_enabled}
            className={`h-6 w-11 rounded-full p-0.5 flex items-center transition-colors shrink-0 cursor-pointer ${
              prefs.quiet_hours_enabled ? "bg-primary justify-end" : "bg-muted-foreground/30 justify-start"
            }`}
          >
            <div className="h-5 w-5 bg-background rounded-full shadow-sm" />
          </button>
        </div>

        {prefs.quiet_hours_enabled && (
          <div className="pt-3 border-t border-border/60 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in-50 duration-150">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-muted-foreground uppercase">
                Bắt đầu yên tĩnh từ
              </label>
              <Input
                type="time"
                value={prefs.quiet_hours_start}
                onChange={(e) => {
                  setPrefs((p) => ({ ...p, quiet_hours_start: e.target.value }));
                  setSaveSuccess(false);
                }}
                className="rounded-xl h-10 border-border bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-muted-foreground uppercase">
                Kết thúc yên tĩnh lúc
              </label>
              <Input
                type="time"
                value={prefs.quiet_hours_end}
                onChange={(e) => {
                  setPrefs((p) => ({ ...p, quiet_hours_end: e.target.value }));
                  setSaveSuccess(false);
                }}
                className="rounded-xl h-10 border-border bg-background"
              />
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-xl gap-2 font-semibold cursor-pointer shadow-sm text-xs h-9 sm:h-10 px-4"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saveSuccess ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-300" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span>{saveSuccess ? "Đã lưu cài đặt!" : "Lưu tùy chọn thông báo"}</span>
        </Button>

        {saveSuccess && (
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 animate-in fade-in-50">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Đã cập nhật tùy chọn thông báo thành công.
          </span>
        )}
      </div>
    </div>
  );
}
