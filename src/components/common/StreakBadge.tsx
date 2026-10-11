"use client";

import React, { useEffect, useState } from "react";
import { Flame } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { calculateCurrentStreak, getCalendarDayKey, getStudyDateKeys } from "@/lib/streak";
import type { Database } from "@/types/database";
import type { UserProfile } from "@/lib/auth/get-current-user";
import { subscribeStudyActivityUpdated } from "@/lib/events/study-events";

interface StreakBadgeProps {
  className?: string;
  profile?: UserProfile | null;
}

type StudySessionRow = Database["public"]["Tables"]["study_sessions"]["Row"];

export function StreakBadge({ className, profile }: StreakBadgeProps) {
  const [sessions, setSessions] = useState<StudySessionRow[]>([]);
  const [isLoading, setIsLoading] = useState(!profile);
  const [isHintOpen, setIsHintOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;

    async function fetchSessions() {
      try {
        const userId = profile?.id ?? (await supabase.auth.getUser()).data.user?.id;

        if (!userId) {
          if (mounted) setSessions([]);
          return;
        }

        const { data, error } = await supabase
          .from("study_sessions")
          .select("started_at, studied_words, reviews_completed, quizzes_completed, dictations_completed, sentences_completed")
          .eq("user_id", userId)
          .order("started_at", { ascending: true });

        if (!error && mounted) {
          setSessions((data ?? []) as StudySessionRow[]);
        }
      } catch (error) {
        console.error("Failed to load streak sessions:", error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    fetchSessions();

    const unsubscribeCustomEvent = subscribeStudyActivityUpdated(() => {
      void fetchSessions();
    });

    const handleFocus = () => {
      void fetchSessions();
    };
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    const userId = profile?.id;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    if (userId) {
      channel = supabase
        .channel(`streak_realtime_${userId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "study_sessions",
            filter: `user_id=eq.${userId}`,
          },
          () => {
            void fetchSessions();
          }
        )
        .subscribe();
    }

    return () => {
      mounted = false;
      unsubscribeCustomEvent();
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [profile, supabase]);

  const streak = calculateCurrentStreak(sessions);
  const studyDates = getStudyDateKeys(sessions);
  const todayKey = getCalendarDayKey(new Date());
  const yesterdayKey = todayKey - 24 * 60 * 60 * 1000;
  const todayActive = studyDates.includes(todayKey);
  const yesterdayActive = studyDates.includes(yesterdayKey);
  const isPending = streak > 0 && !todayActive && yesterdayActive;
  const isActive = streak > 0 && todayActive;
  const isBroken = streak === 0;

  const toneClass = isActive
    ? "border-amber-500/30 bg-amber-500/10 text-amber-700 hover:bg-amber-500/15 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300"
    : "border-border bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground";

  const label = `${streak} ngày`;
  const tooltip = isActive
    ? "Đã hoàn thành hoạt động chuỗi hôm nay."
    : isPending
      ? "Học hôm nay để duy trì chuỗi ngày học."
      : isBroken
        ? "Bắt đầu chuỗi học tập mới ngay hôm nay."
        : "Học tập để thắp sáng chuỗi ngày học.";

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        aria-label={isActive ? `Chuỗi hiện tại ${streak} ngày` : isPending ? `Chuỗi chờ duy trì ${streak} ngày` : "Chưa có chuỗi ngày học"}
        aria-describedby={!isActive && isHintOpen ? "streak-hint" : undefined}
        className={cn(
          "group inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold transition-all duration-150 cursor-pointer",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
          isLoading ? "w-[72px] justify-center border-border bg-muted/40 text-muted-foreground animate-pulse" : toneClass
        )}
        onMouseEnter={() => !isActive && setIsHintOpen(true)}
        onMouseLeave={() => setIsHintOpen(false)}
        onFocus={() => !isActive && setIsHintOpen(true)}
        onBlur={() => setIsHintOpen(false)}
        onClick={() => !isActive && setIsHintOpen((open) => !open)}
      >
        <Flame
          className={cn(
            "h-3.5 w-3.5 transition-colors",
            isActive ? "fill-amber-500 text-amber-500 dark:fill-amber-400 dark:text-amber-400" : "text-muted-foreground"
          )}
        />
        <span className={cn("tabular-nums", isLoading && "opacity-0")}>
          {label}
        </span>
      </button>

      {!isActive && !isLoading && isHintOpen ? (
        <div
          id="streak-hint"
          role="tooltip"
          className="absolute right-0 top-full z-50 mt-2 w-max max-w-[220px] rounded-lg border border-border bg-popover px-3 py-2 text-xs font-medium text-popover-foreground shadow-md"
        >
          {tooltip}
        </div>
      ) : null}
    </div>
  );
}
