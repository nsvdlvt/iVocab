"use client";

import React, { useEffect, useState } from "react";
import { Flame } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface StreakBadgeProps {
  className?: string;
}

type StreakState = {
  streak: number | null;
};

export function StreakBadge({ className }: StreakBadgeProps) {
  const [profile, setProfile] = useState<StreakState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isHintOpen, setIsHintOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;

    async function fetchStreak() {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          if (mounted) {
            setProfile(null);
          }
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("streak")
          .eq("id", user.id)
          .single();

        if (!error && data && mounted) {
          setProfile(data);
        }
      } catch (error) {
        console.error("Lỗi lấy streak:", error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    fetchStreak();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  const streak = profile?.streak ?? 0;
  const isActive = streak > 0;

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        aria-label={isActive ? `Chuỗi hiện tại ${streak} ngày` : "Chưa thắp chuỗi"}
        aria-describedby={!isActive && isHintOpen ? "streak-hint" : undefined}
        className={cn(
          "group inline-flex h-9 items-center gap-1.5 rounded-xl border px-2.5 text-xs font-bold transition-all duration-200 active:scale-95",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
          isLoading
            ? "w-[72px] justify-center border-border bg-muted/40 text-muted-foreground animate-pulse"
            : isActive
              ? "border-orange-400/40 bg-gradient-to-r from-amber-400/20 via-orange-400/20 to-rose-400/20 text-orange-600 shadow-[0_0_0_1px_rgba(251,146,60,0.16),0_8px_24px_rgba(251,146,60,0.15)] hover:border-orange-400/60 hover:bg-gradient-to-r hover:from-amber-400/25 hover:via-orange-400/25 hover:to-rose-400/25 dark:text-amber-300 dark:shadow-[0_0_0_1px_rgba(251,146,60,0.18),0_8px_24px_rgba(251,146,60,0.16)]"
              : "border-slate-300/80 bg-slate-100/90 text-slate-500 hover:border-slate-400 hover:bg-slate-200/90 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:bg-slate-800"
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
            isActive ? "text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.45)] dark:text-amber-400" : "text-muted-foreground"
          )}
        />
        <span className={cn("tabular-nums", isLoading && "opacity-0")}>
          <span className="sm:hidden">{isActive ? streak : 0}</span>
          <span className="hidden sm:inline">{isActive ? `${streak} ngày` : "0 ngày"}</span>
        </span>
      </button>

      {!isActive && !isLoading && isHintOpen ? (
        <div
          id="streak-hint"
          role="tooltip"
          className="absolute left-0 top-full z-50 mt-2 w-max max-w-[220px] rounded-xl border border-border/70 bg-popover px-3 py-2 text-xs font-medium text-popover-foreground shadow-lg"
        >
          Hãy học bài để thắp chuỗi
        </div>
      ) : null}
    </div>
  );
}
