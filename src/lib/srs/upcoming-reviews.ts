import { Database } from "@/types/database";

type ReviewRow = Database["public"]["Tables"]["reviews"]["Row"];

export interface UpcomingReviewForecastDay {
  label: string;
  date: string;
  count: number;
  isToday: boolean;
  isTomorrow: boolean;
}

function startOfDay(value: Date) {
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(base: Date, days: number) {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next;
}

function dayKey(value: Date) {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function buildUpcomingReviewForecast(
  rows: Pick<ReviewRow, "next_review" | "status">[],
  days = 7,
  now = new Date()
): UpcomingReviewForecastDay[] {
  const base = startOfDay(now);
  const buckets = new Map<string, number>();

  for (const row of rows) {
    if (!row.next_review) continue;
    if (!["lv2", "lv3", "lv4"].includes(row.status ?? "")) continue;
    const reviewDate = new Date(row.next_review);
    const dayStart = startOfDay(reviewDate);
    const diffDays = Math.floor((dayStart.getTime() - base.getTime()) / (24 * 60 * 60 * 1000));
    if (diffDays < 0 || diffDays >= days) continue;
    const key = dayKey(dayStart);
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  return Array.from({ length: days }, (_, index) => {
    const day = addDays(base, index);
    const key = dayKey(day);
    return {
      label: index === 0 ? "Hôm nay" : index === 1 ? "Ngày mai" : `+${index} ngày`,
      date: key,
      count: buckets.get(key) ?? 0,
      isToday: index === 0,
      isTomorrow: index === 1,
    };
  });
}
