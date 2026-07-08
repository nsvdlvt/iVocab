import { describe, expect, it } from "vitest";
import { SrsService } from "./srs-service";

const now = new Date("2026-07-08T00:00:00.000Z");

describe("SrsService", () => {
  it("advances Lv0 to Lv1 on correct learning answers", () => {
    const result = SrsService.processLearningResult({
      mode: "learn",
      answerResult: "correct",
      currentState: { level: 0, progress: 0, nextReviewAt: null, intervalDays: null },
      now,
    });

    expect(result.shouldPersist).toBe(true);
    expect(result.gainedLevel).toBe(true);
    expect(result.state.level).toBe(1);
    expect(result.state.progress).toBe(0);
    expect(result.state.nextReviewAt).toBeNull();
  });

  it("advances Lv1 to Lv2 and schedules the first SRS review in 3 days", () => {
    const result = SrsService.processLearningResult({
      mode: "dictation",
      answerResult: "correct",
      currentState: { level: 1, progress: 0, nextReviewAt: null, intervalDays: null },
      now,
    });

    expect(result.shouldPersist).toBe(true);
    expect(result.gainedLevel).toBe(true);
    expect(result.state.level).toBe(2);
    expect(result.state.progress).toBe(0);
    expect(result.state.nextReviewAt).toBe("2026-07-11T00:00:00.000Z");
    expect(result.state.intervalDays).toBe(3);
  });

  it("requires due review to advance from Lv2 to Lv3", () => {
    const blocked = SrsService.processLearningResult({
      mode: "learn",
      answerResult: "correct",
      currentState: { level: 2, progress: 0, nextReviewAt: "2026-07-10T00:00:00.000Z", intervalDays: 3 },
      now,
    });

    expect(blocked.shouldPersist).toBe(false);
    expect(blocked.state.level).toBe(2);
    expect(blocked.state.progress).toBe(0);

    const result = SrsService.processLearningResult({
      mode: "learn",
      answerResult: "correct",
      currentState: { level: 2, progress: 0, nextReviewAt: "2026-07-08T00:00:00.000Z", intervalDays: 3 },
      now,
    });

    expect(result.shouldPersist).toBe(true);
    expect(result.gainedLevel).toBe(true);
    expect(result.state.level).toBe(3);
    expect(result.state.nextReviewAt).toBe("2026-07-13T00:00:00.000Z");
    expect(result.state.intervalDays).toBe(5);
  });

  it("advances Lv3 to Lv4 on a due correct review and schedules 7 days later", () => {
    const result = SrsService.processLearningResult({
      mode: "review",
      answerResult: "correct",
      currentState: { level: 3, progress: 2, nextReviewAt: "2026-07-08T00:00:00.000Z", intervalDays: 5 },
      now,
    });

    expect(result.shouldPersist).toBe(true);
    expect(result.gainedLevel).toBe(true);
    expect(result.state.level).toBe(4);
    expect(result.state.nextReviewAt).toBe("2026-07-15T00:00:00.000Z");
    expect(result.state.intervalDays).toBe(7);
  });

  it("advances Lv4 to Lv5 and clears nextReviewAt", () => {
    const result = SrsService.processLearningResult({
      mode: "review",
      answerResult: "correct",
      currentState: { level: 4, progress: 0, nextReviewAt: "2026-07-08T00:00:00.000Z", intervalDays: 7 },
      now,
    });

    expect(result.shouldPersist).toBe(true);
    expect(result.gainedLevel).toBe(true);
    expect(result.state.level).toBe(5);
    expect(result.state.nextReviewAt).toBeNull();
    expect(result.state.intervalDays).toBeNull();
  });

  it("does not change level or scheduling for early correct review answers", () => {
    const result = SrsService.processLearningResult({
      mode: "review",
      answerResult: "correct",
      currentState: { level: 2, progress: 0, nextReviewAt: "2026-07-09T00:00:00.000Z", intervalDays: 3 },
      now,
    });

    expect(result.shouldPersist).toBe(false);
    expect(result.gainedLevel).toBe(false);
    expect(result.state.level).toBe(2);
    expect(result.state.nextReviewAt).toBe("2026-07-09T00:00:00.000Z");
  });

  it("lets Sentence Practice contribute only during due review and never during learning", () => {
    const learning = SrsService.processLearningResult({
      mode: "sentence-practice",
      answerResult: "correct",
      currentState: { level: 1, progress: 0, nextReviewAt: null, intervalDays: null },
      now,
    });

    expect(learning.shouldPersist).toBe(false);
    expect(learning.state.level).toBe(1);

    const review = SrsService.processLearningResult({
      mode: "sentence-practice",
      answerResult: "correct",
      currentState: { level: 2, progress: 0, nextReviewAt: "2026-07-08T00:00:00.000Z", intervalDays: 3 },
      now,
    });

    expect(review.shouldPersist).toBe(true);
    expect(review.state.level).toBe(3);
  });

  it("never lets Flashcard affect SRS", () => {
    const result = SrsService.processLearningResult({
      mode: "flashcard",
      answerResult: "correct",
      currentState: { level: 2, progress: 0, nextReviewAt: "2026-07-08T00:00:00.000Z", intervalDays: 3 },
      now,
    });

    expect(result.shouldPersist).toBe(false);
    expect(result.state.level).toBe(2);
    expect(result.state.nextReviewAt).toBe("2026-07-08T00:00:00.000Z");
  });
});
