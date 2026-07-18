"use client";

import React, { useEffect, useState } from "react";
import { Flame } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { calculateCurrentStreak, getCalendarDayKey, getStudyDateKeys } from "@/lib/streak";
import type { Database } from "@/types/database";

interface StreakBadgeProps {
  className?: string;
}

type StudySessionRow = Database["public"]["Tables"]["study_sessions"]["Row"];

export function StreakBadge({ className }: StreakBadgeProps) {
  const [sessions, setSessions] = useState<StudySessionRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isHintOpen, setIsHintOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;

    async function fetchSessions() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          if (mounted) setSessions([]);
          return;
        }

        const { data, error } = await supabase
          .from("study_sessions")
          .select("started_at, studied_words, reviews_completed, quizzes_completed, dictations_completed, sentences_completed")
          .eq("user_id", user.id)
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

    return () => {
      mounted = false;
    };
  }, [supabase]);

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
    ? "border-orange-400/40 bg-gradient-to-r from-amber-400/20 via-orange-400/20 to-rose-400/20 text-orange-600 shadow-[0_0_0_1px_rgba(251,146,60,0.16),0_8px_24px_rgba(251,146,60,0.15)] hover:border-orange-400/60 hover:bg-gradient-to-r hover:from-amber-400/25 hover:via-orange-400/25 hover:to-rose-400/25 dark:text-amber-300 dark:shadow-[0_0_0_1px_rgba(251,146,60,0.18),0_8px_24px_rgba(251,146,60,0.16)]"
    : "border-slate-300/80 bg-slate-100/90 text-slate-500 hover:border-slate-400 hover:bg-slate-200/90 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:bg-slate-800";

  const label = isActive ? `${streak} ngày` : `${streak} ngày`;
  const tooltip = isActive
    ? "Study today completed."
    : isPending
      ? "Study today to keep your streak."
      : isBroken
        ? "Start a new streak today."
        : "Study to light your streak.";

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        aria-label={isActive ? `Current streak ${streak} days` : isPending ? `Streak pending ${streak} days` : "No streak yet"}
        aria-describedby={!isActive && isHintOpen ? "streak-hint" : undefined}
        className={cn(
          "group inline-flex h-9 items-center gap-1.5 rounded-xl border px-2.5 text-xs font-bold transition-all duration-200 active:scale-95",
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
            isActive ? "text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.45)] dark:text-amber-400" : "text-slate-400 dark:text-slate-500"
          )}
        />
        <span className={cn("tabular-nums", isLoading && "opacity-0")}>
          <span className="sm:hidden">{label}</span>
          <span className="hidden sm:inline">{label}</span>
        </span>
      </button>

      {!isActive && !isLoading && isHintOpen ? (
        <div
          id="streak-hint"
          role="tooltip"
          className="absolute left-0 top-full z-50 mt-2 w-max max-w-[220px] rounded-xl border border-border/70 bg-popover px-3 py-2 text-xs font-medium text-popover-foreground shadow-lg"
        >
          {tooltip}
        </div>
      ) : null}
    </div>
  );
}
