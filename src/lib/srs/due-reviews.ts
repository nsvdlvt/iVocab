export interface DueReviewRow {
  next_review: string | null;
}

export function getDueReviewCutoff(now = new Date()): Date {
  const cutoff = new Date(now);
  cutoff.setHours(24, 0, 0, 0);
  return cutoff;
}

export function isDueReview(nextReviewAt: string | null, now = new Date()): boolean {
  if (!nextReviewAt) return false;
  return new Date(nextReviewAt).getTime() < getDueReviewCutoff(now).getTime();
}

export function filterDueReviews<T extends DueReviewRow>(rows: T[], now = new Date()): T[] {
  const cutoff = getDueReviewCutoff(now).getTime();
  return rows.filter((row) => !!row.next_review && new Date(row.next_review).getTime() < cutoff);
}
