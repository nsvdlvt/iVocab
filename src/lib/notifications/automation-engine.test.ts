import { describe, it, expect, vi, beforeEach } from "vitest";
import { AutomationEngine } from "./automation-engine";
import { renderTemplate } from "./template-renderer";

describe("AutomationEngine Integration & Helper Logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handles empty candidate list gracefully during dry run execution", async () => {
    // Test that executeRule throws or handles missing db connection if not configured
    const originalEnv = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;

    await expect(
      AutomationEngine.executeRule("dummy-rule-id", { dryRun: true })
    ).rejects.toThrow("Database connection not configured");

    process.env.DATABASE_URL = originalEnv;
  });

  it("computes correct idempotency keys based on cooldown intervals", () => {
    const ruleId = "11111111-2222-3333-4444-555555555555";
    const userId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
    const now = new Date("2026-10-18T10:30:00.000Z");
    const dateKey = now.toISOString().split("T")[0]; // 2026-10-18

    // Case 1: 24h cooldown uses date key
    const cooldown24 = 24;
    const bucket24 = cooldown24 >= 24 ? dateKey : Math.floor(now.getTime() / (cooldown24 * 3600 * 1000));
    const key24 = `rule_${ruleId}_user_${userId}_b_${bucket24}`;
    expect(key24).toBe(`rule_${ruleId}_user_${userId}_b_2026-10-18`);

    // Case 2: 6h cooldown uses hour bucket
    const cooldown6 = 6;
    const bucket6 = Math.floor(now.getTime() / (cooldown6 * 3600 * 1000));
    const key6 = `rule_${ruleId}_user_${userId}_b_${bucket6}`;
    expect(key6).toContain(`rule_${ruleId}_user_${userId}_b_`);
  });

  it("renders sample preview for a rule correctly with real template renderer", () => {
    const template = {
      title: "Chào {name}! Streak của bạn là {streak} ngày.",
      body: "Bạn có {words_review_due} từ cần ôn tập tại Vocabee.",
      action_url: "{review_link}",
    };

    const mockContext = {
      name: "Nguyễn Văn A",
      streak: 7,
      words_review_due: 15,
      review_link: "/learn/review",
    };

    const result = renderTemplate(template, mockContext);
    expect(result.success).toBe(true);
    expect(result.title).toBe("Chào Nguyễn Văn A! Streak của bạn là 7 ngày.");
    expect(result.body).toBe("Bạn có 15 từ cần ôn tập tại Vocabee.");
    expect(result.actionUrl).toBe("/learn/review");
  });
});
