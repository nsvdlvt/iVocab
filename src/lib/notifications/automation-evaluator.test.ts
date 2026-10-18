import { describe, it, expect } from "vitest";
import {
  AutomationEvaluator,
  ConditionRule,
  UserPreferencesConfig,
} from "./automation-evaluator";
import { UserContextData } from "./user-context-provider";

describe("AutomationEvaluator", () => {
  const baseUserContext: UserContextData = {
    name: "Dũng",
    email: "dung@vocabee.site",
    streak: 7,
    longest_streak: 14,
    last_study_date: "18/10/2026",
    days_inactive: 0,
    timezone: "Asia/Ho_Chi_Minh",

    word_count: 50,
    words_learned_today: 10,
    words_review_due: 5,
    words_reviewed_today: 5,
    words_mastered: 20,
    learning_goal: 20,
    goal_progress: "75%",
    goal_remaining: 5,
    study_minutes_today: 15,

    quiz_count: 8,
    quizzes_today: 1,
    last_quiz_score: "9/10",
    best_quiz_score: "10/10",
    quiz_accuracy: "90%",
    pending_tasks: 10,

    app_name: "Vocabee",
    current_date: "18/10/2026",
    current_time: "12:00",
    notification_link: "/notifications",
    review_link: "/review",
    learn_link: "/vocabulary",
    quiz_link: "/quiz",
  };

  describe("6. evaluateCondition & evaluateConditions (Logical operators & type safety)", () => {
    it("should evaluate numerical >=, >, <=, <, ==, !=", () => {
      expect(
        AutomationEvaluator.evaluateCondition(baseUserContext, {
          field: "streak",
          operator: ">=",
          value: 7,
        })
      ).toBe(true);

      expect(
        AutomationEvaluator.evaluateCondition(baseUserContext, {
          field: "streak",
          operator: ">",
          value: 7,
        })
      ).toBe(false);

      expect(
        AutomationEvaluator.evaluateCondition(baseUserContext, {
          field: "words_review_due",
          operator: ">",
          value: 0,
        })
      ).toBe(true);

      expect(
        AutomationEvaluator.evaluateCondition(baseUserContext, {
          field: "words_learned_today",
          operator: "<=",
          value: 10,
        })
      ).toBe(true);

      expect(
        AutomationEvaluator.evaluateCondition(baseUserContext, {
          field: "word_count",
          operator: "==",
          value: 50,
        })
      ).toBe(true);
    });

    it("should evaluate AND logic (all conditions must match)", () => {
      const conditions: ConditionRule[] = [
        { field: "streak", operator: ">=", value: 5 },
        { field: "words_review_due", operator: ">", value: 0 },
        { field: "word_count", operator: ">=", value: 30 },
      ];

      expect(
        AutomationEvaluator.evaluateConditions(baseUserContext, conditions, "AND")
      ).toBe(true);

      const failingConditions: ConditionRule[] = [
        { field: "streak", operator: ">=", value: 5 },
        { field: "words_learned_today", operator: ">=", value: 99 }, // false
      ];

      expect(
        AutomationEvaluator.evaluateConditions(baseUserContext, failingConditions, "AND")
      ).toBe(false);
    });

    it("should evaluate OR logic (at least one condition must match)", () => {
      const conditions: ConditionRule[] = [
        { field: "days_inactive", operator: ">=", value: 3 }, // false (days_inactive=0)
        { field: "words_review_due", operator: ">", value: 0 }, // true (words_review_due=5)
      ];

      expect(
        AutomationEvaluator.evaluateConditions(baseUserContext, conditions, "OR")
      ).toBe(true);
    });

    it("8. Không gửi khi người dùng đã hoàn thành hoạt động (e.g. goal_remaining == 0 or words_learned_today >= learning_goal)", () => {
      const completedUserContext: UserContextData = {
        ...baseUserContext,
        words_learned_today: 25,
        goal_remaining: 0,
      };

      const reminderCondition: ConditionRule = {
        field: "goal_remaining",
        operator: ">",
        value: 0,
      };

      // Active learner who hasn't finished goal matches
      expect(
        AutomationEvaluator.evaluateCondition(baseUserContext, reminderCondition)
      ).toBe(true);

      // Completed learner does NOT match reminder
      expect(
        AutomationEvaluator.evaluateCondition(completedUserContext, reminderCondition)
      ).toBe(false);
    });
  });

  describe("7. matchesAudience & isAllowedByPreferences (User preferences control)", () => {
    it("should block review reminders when user toggled review_reminders off", () => {
      const prefs: UserPreferencesConfig = {
        study_reminders: true,
        review_reminders: false, // disabled
        streak_reminders: true,
        inactivity_reminders: true,
        milestone_reminders: true,
        quiet_hours_enabled: false,
        quiet_hours_start: "22:00",
        quiet_hours_end: "07:00",
        timezone: "Asia/Ho_Chi_Minh",
      };

      expect(
        AutomationEvaluator.isAllowedByPreferences("activity", "Nhắc ôn tập SRS đến hạn", prefs)
      ).toBe(false);

      expect(
        AutomationEvaluator.isAllowedByPreferences("scheduled", "Nhắc học 20:00 hằng ngày", prefs)
      ).toBe(true);
    });

    it("should block inactivity reminders when user toggled inactivity_reminders off", () => {
      const prefs: UserPreferencesConfig = {
        study_reminders: true,
        review_reminders: true,
        streak_reminders: true,
        inactivity_reminders: false, // disabled
        milestone_reminders: true,
        quiet_hours_enabled: false,
        quiet_hours_start: "22:00",
        quiet_hours_end: "07:00",
        timezone: "Asia/Ho_Chi_Minh",
      };

      expect(
        AutomationEvaluator.isAllowedByPreferences("inactivity", "Vocabee nhớ bạn!", prefs)
      ).toBe(false);
    });

    it("should block streak reminders when user toggled streak_reminders off", () => {
      const prefs: UserPreferencesConfig = {
        study_reminders: true,
        review_reminders: true,
        streak_reminders: false, // disabled
        inactivity_reminders: true,
        milestone_reminders: true,
        quiet_hours_enabled: false,
        quiet_hours_start: "22:00",
        quiet_hours_end: "07:00",
        timezone: "Asia/Ho_Chi_Minh",
      };

      expect(
        AutomationEvaluator.isAllowedByPreferences("activity", "Cảnh báo giữ chuỗi streak", prefs)
      ).toBe(false);
    });
  });

  describe("15. isQuietHours (Timezone and Quiet Hours Handling)", () => {
    it("should detect quiet hours when time is within overnight quiet window (e.g. 23:30 within 22:00-07:00)", () => {
      const prefs: UserPreferencesConfig = {
        study_reminders: true,
        review_reminders: true,
        streak_reminders: true,
        inactivity_reminders: true,
        milestone_reminders: true,
        quiet_hours_enabled: true,
        quiet_hours_start: "22:00",
        quiet_hours_end: "07:00",
        timezone: "Asia/Ho_Chi_Minh", // UTC+7
      };

      // 23:30 Vietnam time (UTC 16:30)
      const lateNight = new Date("2026-10-18T16:30:00Z");
      expect(AutomationEvaluator.isQuietHours(prefs, lateNight)).toBe(true);

      // 03:00 Vietnam time (UTC 20:00 prev day)
      const earlyMorning = new Date("2026-10-17T20:00:00Z");
      expect(AutomationEvaluator.isQuietHours(prefs, earlyMorning)).toBe(true);

      // 14:00 Vietnam time (UTC 07:00)
      const afternoon = new Date("2026-10-18T07:00:00Z");
      expect(AutomationEvaluator.isQuietHours(prefs, afternoon)).toBe(false);
    });

    it("should return false when quiet_hours_enabled is false", () => {
      const prefs: UserPreferencesConfig = {
        study_reminders: true,
        review_reminders: true,
        streak_reminders: true,
        inactivity_reminders: true,
        milestone_reminders: true,
        quiet_hours_enabled: false,
        quiet_hours_start: "22:00",
        quiet_hours_end: "07:00",
        timezone: "Asia/Ho_Chi_Minh",
      };

      const lateNight = new Date("2026-10-18T16:30:00Z");
      expect(AutomationEvaluator.isQuietHours(prefs, lateNight)).toBe(false);
    });
  });
});
