import type { Database } from "@/types/database";

type StudySessionRow = Database["public"]["Tables"]["study_sessions"]["Row"];

const DEFAULT_TIME_ZONE = "Asia/Bangkok";

export function getCalendarDayKey(date: Date, timeZone: string = DEFAULT_TIME_ZONE): number {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);

  return Date.UTC(year, month - 1, day);
}

function hasAnyActivity(session: StudySessionRow): boolean {
  return (
    (session.studied_words ?? 0) > 0 ||
    (session.reviews_completed ?? 0) > 0 ||
    (session.quizzes_completed ?? 0) > 0 ||
    (session.dictations_completed ?? 0) > 0 ||
    (session.sentences_completed ?? 0) > 0
  );
}

export function getStudyDateKeys(sessions: StudySessionRow[], timeZone: string = DEFAULT_TIME_ZONE): number[] {
  const uniqueDates = new Set<number>();

  for (const session of sessions) {
    if (!hasAnyActivity(session)) continue;
    uniqueDates.add(getCalendarDayKey(new Date(session.started_at), timeZone));
  }

  return [...uniqueDates].sort((a, b) => a - b);
}

export function calculateCurrentStreak(
  sessions: StudySessionRow[],
  now: Date = new Date(),
  timeZone: string = DEFAULT_TIME_ZONE
): number {
  const dates = getStudyDateKeys(sessions, timeZone);
  if (dates.length === 0) return 0;

  const todayKey = getCalendarDayKey(now, timeZone);
  const yesterdayKey = todayKey - 24 * 60 * 60 * 1000;
  const anchorKey = dates.includes(todayKey) ? todayKey : dates.includes(yesterdayKey) ? yesterdayKey : null;

  if (anchorKey === null) return 0;

  let streak = 1;
  let cursor = anchorKey - 24 * 60 * 60 * 1000;

  for (let i = dates.length - 2; i >= 0; i--) {
    const current = dates[i];
    if (current !== cursor) break;
    streak += 1;
    cursor -= 24 * 60 * 60 * 1000;
  }

  return streak;
}

export function getActiveStudyDaysMap(
  sessions: StudySessionRow[],
  timeZone: string = DEFAULT_TIME_ZONE
): Set<number> {
  return new Set(getStudyDateKeys(sessions, timeZone));
}
