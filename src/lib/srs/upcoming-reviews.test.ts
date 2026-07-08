import { describe, expect, it } from "vitest";
import { buildUpcomingReviewForecast } from "./upcoming-reviews";

const now = new Date("2026-07-08T10:00:00.000Z");

describe("buildUpcomingReviewForecast", () => {
  it("groups scheduled reviews into the next 7 days and excludes unscheduled or out-of-range rows", () => {
    const forecast = buildUpcomingReviewForecast(
      [
        { next_review: "2026-07-08T12:00:00.000Z", status: "lv2" },
        { next_review: "2026-07-08T18:00:00.000Z", status: "lv3" },
        { next_review: "2026-07-09T09:00:00.000Z", status: "lv4" },
        { next_review: "2026-07-10T09:00:00.000Z", status: "lv1" },
        { next_review: null, status: "lv3" },
        { next_review: "2026-07-16T09:00:00.000Z", status: "lv2" },
      ],
      7,
      now
    );

    expect(forecast).toHaveLength(7);
    expect(forecast[0]).toMatchObject({ label: "Hôm nay", count: 1, isToday: true });
    expect(forecast[1]).toMatchObject({ label: "Ngày mai", count: 2, isTomorrow: true });
    expect(forecast[2]).toMatchObject({ label: "+2 ngày", count: 0 });
    expect(forecast[6]).toMatchObject({ label: "+6 ngày", count: 0 });
  });
});
