import React from "react";
import { CalendarDays } from "lucide-react";
import { SectionCard } from "@/components/common/SectionCard";
import { UpcomingReviewSummary } from "@/repositories/review.repository";

interface UpcomingReviewsForecastProps {
  forecast: UpcomingReviewSummary;
}

function formatDayLabel(day: { isToday: boolean; isTomorrow: boolean; date: string }) {
  if (day.isToday) return "Hôm nay";
  if (day.isTomorrow) return "Ngày mai";

  const value = new Date(`${day.date}T00:00:00`);
  return new Intl.DateTimeFormat("vi-VN", { weekday: "long" }).format(value);
}

function formatDateLabel(date: string) {
  const value = new Date(`${date}T00:00:00`);
  return new Intl.DateTimeFormat("vi-VN", {
    day: "numeric",
    month: "numeric",
  }).format(value);
}

export function UpcomingReviewsForecast({ forecast }: UpcomingReviewsForecastProps) {
  const maxCount = Math.max(...forecast.days.map((day) => day.count), 0);

  return (
    <SectionCard className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-black text-foreground">Lịch ôn sắp tới (7 ngày)</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Dự báo dựa trên lịch SRS hiện có, chỉ tính các từ đến hạn trong 7 ngày tới.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
          <span className="rounded-full border bg-muted/30 px-3 py-1">
            Tổng: <span className="font-bold text-foreground">{forecast.total}</span>
          </span>
          <span className="rounded-full border bg-muted/30 px-3 py-1">
            TB/ngày: <span className="font-bold text-foreground">{forecast.averagePerDay}</span>
          </span>
          <span className="rounded-full border bg-muted/30 px-3 py-1">
            Đỉnh: <span className="font-bold text-foreground">{forecast.busiestDay?.label ?? "-"}</span>
            {forecast.busiestDay ? ` (${forecast.busiestDay.count})` : ""}
          </span>
        </div>
      </div>

      {forecast.total === 0 ? (
        <div className="rounded-2xl border border-dashed bg-muted/20 p-6 text-center space-y-2">
          <p className="text-lg font-bold">Tuyệt vời!</p>
          <p className="text-sm text-muted-foreground">
            Không có bài ôn nào được lên lịch trong 7 ngày tới.
          </p>
        </div>
      ) : (
        <div className="rounded-3xl border bg-card/80 p-4 sm:p-5 shadow-sm">
          <div className="grid grid-cols-7 gap-2 sm:gap-3 items-end min-h-[280px]">
            {forecast.days.map((day) => {
              const heightPercent = maxCount > 0 ? Math.max(10, (day.count / maxCount) * 100) : 10;

              return (
                <div key={day.date} className="flex h-full flex-col items-center justify-end gap-2">
                  <div className="flex h-6 items-end text-[11px] font-bold text-muted-foreground">
                    {day.count}
                  </div>

                  <div className="flex h-[180px] w-full items-end justify-center">
                    <div
                      className={`w-full max-w-[38px] rounded-t-xl transition-all duration-500 ease-out ${
                        day.count === 0
                          ? "bg-muted-foreground/30"
                          : day.isToday
                            ? "bg-primary"
                            : day.isTomorrow
                              ? "bg-emerald-500"
                              : "bg-sky-500"
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>

                  <div className="flex h-12 flex-col items-center justify-start gap-0.5 text-center">
                    <span
                      className={`text-[11px] font-semibold leading-tight ${
                        day.isToday
                          ? "text-primary"
                          : day.isTomorrow
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-muted-foreground"
                      }`}
                    >
                      {formatDayLabel(day)}
                    </span>
                    <span className="text-[11px] font-medium leading-tight text-muted-foreground">
                      {formatDateLabel(day.date)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </SectionCard>
  );
}
