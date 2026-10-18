import { UserContextData } from "./user-context-provider";

export interface ConditionRule {
  field: string;
  operator: "==" | "!=" | ">" | ">=" | "<" | "<=";
  value: string | number | boolean;
}

export interface UserPreferencesConfig {
  study_reminders: boolean;
  review_reminders: boolean;
  streak_reminders: boolean;
  inactivity_reminders: boolean;
  milestone_reminders: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  timezone: string;
}

export class AutomationEvaluator {
  /**
   * Safely evaluates a single condition rule against user context data.
   */
  static evaluateCondition(
    context: Record<string, unknown> | UserContextData,
    condition: ConditionRule
  ): boolean {
    const rawVal = (context as Record<string, unknown>)[condition.field];
    if (rawVal === undefined || rawVal === null) {
      return false;
    }

    const targetVal = condition.value;

    // Numerical comparison if both can be parsed as numbers
    const numRaw = Number(rawVal);
    const numTarget = Number(targetVal);

    if (!isNaN(numRaw) && !isNaN(numTarget) && typeof targetVal !== "boolean") {
      switch (condition.operator) {
        case "==":
          return numRaw === numTarget;
        case "!=":
          return numRaw !== numTarget;
        case ">":
          return numRaw > numTarget;
        case ">=":
          return numRaw >= numTarget;
        case "<":
          return numRaw < numTarget;
        case "<=":
          return numRaw <= numTarget;
        default:
          return false;
      }
    }

    // String / Boolean comparison
    const strRaw = String(rawVal).toLowerCase().trim();
    const strTarget = String(targetVal).toLowerCase().trim();

    switch (condition.operator) {
      case "==":
        return strRaw === strTarget;
      case "!=":
        return strRaw !== strTarget;
      default:
        return false;
    }
  }

  /**
   * Evaluates an array of condition rules with AND / OR logic.
   */
  static evaluateConditions(
    context: Record<string, unknown> | UserContextData,
    conditions: ConditionRule[] = [],
    logic: "AND" | "OR" = "AND"
  ): boolean {
    if (!conditions || conditions.length === 0) {
      return true;
    }

    if (logic === "OR") {
      return conditions.some((c) => this.evaluateCondition(context, c));
    }

    // Default AND
    return conditions.every((c) => this.evaluateCondition(context, c));
  }

  /**
   * Checks if user matches the rule's target audience category.
   */
  static matchesAudience(
    context: UserContextData,
    targetAudience: "all" | "learners" | "has_due_reviews" | "inactive" | "goal_not_completed" | "custom"
  ): boolean {
    switch (targetAudience) {
      case "all":
        return true;
      case "learners":
        return context.word_count > 0;
      case "has_due_reviews":
        return context.words_review_due > 0;
      case "inactive":
        return context.days_inactive >= 3;
      case "goal_not_completed":
        return context.goal_remaining > 0;
      case "custom":
        return true; // Filtered exclusively by custom conditions
      default:
        return true;
    }
  }

  /**
   * Checks if the notification category is enabled in the user's notification preferences.
   */
  static isAllowedByPreferences(
    ruleTriggerType: string,
    ruleName: string,
    preferences?: UserPreferencesConfig | null
  ): boolean {
    if (!preferences) return true; // Default allow if no custom preferences set

    const lowerName = (ruleName || "").toLowerCase();

    if (ruleTriggerType === "activity" && lowerName.includes("ôn tập")) {
      return preferences.review_reminders;
    }
    if (lowerName.includes("review") || lowerName.includes("ôn tập")) {
      return preferences.review_reminders;
    }
    if (ruleTriggerType === "inactivity" || lowerName.includes("nhớ bạn") || lowerName.includes("quay lại")) {
      return preferences.inactivity_reminders;
    }
    if (lowerName.includes("streak") || lowerName.includes("chuỗi")) {
      return preferences.streak_reminders;
    }
    if (lowerName.includes("mốc") || lowerName.includes("thành tích") || lowerName.includes("milestone")) {
      return preferences.milestone_reminders;
    }

    return preferences.study_reminders;
  }

  /**
   * Checks whether the current time falls inside the user's configured Quiet Hours.
   * e.g., 22:00 to 07:00
   */
  static isQuietHours(
    preferences?: UserPreferencesConfig | null,
    now: Date = new Date()
  ): boolean {
    if (!preferences || !preferences.quiet_hours_enabled) {
      return false;
    }

    const startStr = preferences.quiet_hours_start || "22:00";
    const endStr = preferences.quiet_hours_end || "07:00";
    const userTimezone = preferences.timezone || "Asia/Ho_Chi_Minh";

    try {
      // Get current hour and minute in user's timezone
      const timeInTz = now.toLocaleTimeString("en-US", {
        timeZone: userTimezone,
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
      });

      const [curH, curM] = timeInTz.split(":").map(Number);
      const curMinutes = curH * 60 + curM;

      const [startH, startM] = startStr.split(":").map(Number);
      const startMinutes = startH * 60 + startM;

      const [endH, endM] = endStr.split(":").map(Number);
      const endMinutes = endH * 60 + endM;

      if (startMinutes <= endMinutes) {
        // e.g. 13:00 to 15:00
        return curMinutes >= startMinutes && curMinutes < endMinutes;
      } else {
        // Over midnight: e.g. 22:00 to 07:00
        return curMinutes >= startMinutes || curMinutes < endMinutes;
      }
    } catch {
      return false;
    }
  }
}
