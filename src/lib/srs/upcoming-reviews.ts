import { Database } from "@/types/database";

type ReviewRow = Database["public"]["Tables"]["reviews"]["Row"];

export interface UpcomingReviewForecastDay {
  label: string;
  date: string;
  count: number;
  isToday: boolean;
  isTomorrow: boolean;
}

export interface SrsForecastSourceRow {
  next_review: string | null;
  status: string | null;
}

export interface SrsForecastBucketSummary {
  today: number;
  overdue: number;
  future: number;
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

function parseLevel(status: string | null): number | null {
  if (!status) return null;
  if (!status.startsWith("lv")) return null;
  const level = Number(status.slice(2));
  return Number.isFinite(level) ? level : null;
}

function isScheduledReview(status: string | null, nextReviewAt: string | null): boolean {
  const level = parseLevel(status);
  return level !== null && level >= 2 && !!nextReviewAt;
}

export function classifyForecastRow(row: SrsForecastSourceRow, now = new Date()): "today" | { dayOffset: number } | null {
  const base = startOfDay(now);
  const reviewDate = row.next_review ? new Date(row.next_review) : null;

  if (!isScheduledReview(row.status, row.next_review) || !reviewDate) return null;

  const dayStart = startOfDay(reviewDate);
  const diffDays = Math.floor((dayStart.getTime() - base.getTime()) / (24 * 60 * 60 * 1000));

  if (diffDays <= 0) return "today";
  return { dayOffset: diffDays };
}

export function summarizeSrsForecast(rows: SrsForecastSourceRow[], days = 7, now = new Date()): {
  buckets: UpcomingReviewForecastDay[];
  summary: SrsForecastBucketSummary;
} {
  const base = startOfDay(now);
  const buckets = new Map<string, number>();
  let today = 0;
  let overdue = 0;
  let future = 0;

  for (const row of rows) {
    const classification = classifyForecastRow(row, now);
    if (!classification) continue;

    if (classification === "today") {
      today += 1;
      if (row.next_review && new Date(row.next_review).getTime() < base.getTime()) {
        overdue += 1;
      }
      continue;
    }

    if (classification.dayOffset >= days) continue;
    future += 1;
    const day = addDays(base, classification.dayOffset);
    const key = dayKey(day);
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  const bucketsArray = Array.from({ length: days }, (_, index) => {
    const day = addDays(base, index);
    const key = dayKey(day);
    return {
      label: index === 0 ? "Hôm nay" : index === 1 ? "Ngày mai" : `+${index} ngày`,
      date: key,
      count: index === 0 ? today : buckets.get(key) ?? 0,
      isToday: index === 0,
      isTomorrow: index === 1,
    };
  });

  return {
    buckets: bucketsArray,
    summary: {
      today,
      overdue,
      future,
    },
  };
}

export function buildUpcomingReviewForecast(
  rows: Pick<ReviewRow, "next_review" | "status">[],
  days = 7,
  now = new Date()
): UpcomingReviewForecastDay[] {
  return summarizeSrsForecast(rows, days, now).buckets;
}
