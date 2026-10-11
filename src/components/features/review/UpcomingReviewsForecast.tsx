import React from "react";
import { CalendarDays, CheckCircle2 } from "lucide-react";
import { SectionCard } from "@/components/common/SectionCard";
import { UpcomingReviewSummary } from "@/repositories/review.repository";
import { cn } from "@/lib/utils";

interface UpcomingReviewsForecastProps {
  forecast: UpcomingReviewSummary;
  compact?: boolean;
}

function formatDayLabel(day: { isToday: boolean; isTomorrow: boolean; date: string }, compact?: boolean) {
  if (day.isToday) return "H.nay";
  if (day.isTomorrow) return compact ? "N.mai" : "Ngày mai";

  const value = new Date(`${day.date}T00:00:00`);
  return new Intl.DateTimeFormat("vi-VN", { weekday: "short" }).format(value);
}

function formatDateLabel(date: string) {
  const value = new Date(`${date}T00:00:00`);
  return new Intl.DateTimeFormat("vi-VN", {
    day: "numeric",
    month: "numeric",
  }).format(value);
}

export function UpcomingReviewsForecast({ forecast, compact = false }: UpcomingReviewsForecastProps) {
  const maxCount = Math.max(...forecast.days.map((day) => day.count), 0);

  const chartBody =
    forecast.total === 0 ? (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/15 px-4 py-6 text-center gap-1.5">
        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
        <p className="text-xs font-semibold text-foreground">Lịch ôn tập trống</p>
        <p className="text-xs text-muted-foreground">
          Không có từ vựng nào đến hạn trong 7 ngày tới.
        </p>
      </div>
    ) : (
      <div
        className={cn(
          "rounded-xl border border-border/70 bg-muted/15 p-3.5 sm:p-4",
          !compact && "bg-card/60"
        )}
      >
        <div
          className={cn(
            "grid grid-cols-7 gap-1.5 sm:gap-2.5 items-end",
            compact ? "h-[140px]" : "h-[190px]"
          )}
        >
          {forecast.days.map((day) => {
            const heightPercent =
              maxCount > 0 && day.count > 0
                ? Math.max(14, Math.round((day.count / maxCount) * 100))
                : 6;

            return (
              <div
                key={day.date}
                className="flex h-full flex-col items-center justify-end gap-1.5"
              >
                <span
                  className={cn(
                    "text-[11px] font-semibold tabular-nums leading-none",
                    day.count > 0 ? "text-foreground" : "text-muted-foreground/60"
                  )}
                >
                  {day.count}
                </span>

                <div className="flex flex-1 w-full items-end justify-center">
                  <div
                    className={cn(
                      "w-full max-w-[28px] rounded-t-md transition-all duration-300 ease-out",
                      day.count === 0
                        ? "bg-border/70"
                        : day.isToday
                          ? "bg-primary shadow-2xs"
                          : day.isTomorrow
                            ? "bg-emerald-500/85"
                            : "bg-primary/45"
                    )}
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>

                <div className="flex flex-col items-center justify-start gap-0.5 text-center pt-1 border-t border-border/50 w-full">
                  <span
                    className={cn(
                      "text-[10px] font-semibold leading-tight truncate max-w-full",
                      day.isToday
                        ? "text-primary"
                        : day.isTomorrow
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-foreground/80"
                    )}
                  >
                    {formatDayLabel(day, compact)}
                  </span>
                  <span className="text-[10px] tabular-nums leading-tight text-muted-foreground">
                    {formatDateLabel(day.date)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );

  if (compact) {
    return (
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-muted-foreground flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 text-primary" />
            Dự báo 7 ngày tới
          </span>
          <span className="font-semibold tabular-nums text-foreground">
            Tổng {forecast.total} từ
          </span>
        </div>
        {chartBody}
      </div>
    );
  }

  return (
    <SectionCard className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <CalendarDays className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground leading-snug">
              Lịch ôn tập 7 ngày tới
            </h3>
            <p className="text-xs text-muted-foreground">
              Phân bổ khối lượng từ vựng đến hạn theo thuật toán SRS
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>
            Tổng cộng:{" "}
            <strong className="font-semibold text-foreground tabular-nums">
              {forecast.total}
            </strong>
          </span>
          <span>
            Trung bình:{" "}
            <strong className="font-semibold text-foreground tabular-nums">
              {forecast.averagePerDay}/ngày
            </strong>
          </span>
        </div>
      </div>

      {chartBody}
    </SectionCard>
  );
}
