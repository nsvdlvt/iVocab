import { describe, expect, it } from "vitest";
import { filterDueReviews, getDueReviewCutoff, isDueReview } from "./due-reviews";

describe("due-reviews", () => {
  const now = new Date("2026-07-13T10:00:00.000Z");

  it("uses the end of today as the due cutoff", () => {
    const cutoff = getDueReviewCutoff(now);
    expect(cutoff.getHours()).toBe(0);
    expect(cutoff.getMinutes()).toBe(0);
    expect(cutoff.getSeconds()).toBe(0);
    expect(cutoff.getDate()).toBe(14);
  });

  it("treats today, yesterday, and overdue items as due", () => {
    expect(isDueReview("2026-07-13T08:00:00.000Z", now)).toBe(true);
    expect(isDueReview("2026-07-12T23:59:59.000Z", now)).toBe(true);
    expect(isDueReview("2026-07-06T09:00:00.000Z", now)).toBe(true);
  });

  it("does not treat tomorrow as due", () => {
    expect(isDueReview("2026-07-14T00:00:00.000Z", now)).toBe(false);
  });

  it("filters a due queue consistently", () => {
    const rows = filterDueReviews(
      [
        { next_review: "2026-07-13T01:00:00.000Z" },
        { next_review: "2026-07-12T00:00:00.000Z" },
        { next_review: "2026-07-06T00:00:00.000Z" },
        { next_review: "2026-07-14T00:00:00.000Z" },
        { next_review: null },
      ],
      now
    );

    expect(rows).toHaveLength(3);
  });
});
