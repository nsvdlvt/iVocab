// src/lib/ai/agent/__tests__/srs-orchestrator.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AgentExecutor } from "../executor";
import { AGENT_TOOLS } from "../tools";
import { consolidateToolEvents, runAgentConversation } from "../orchestrator";
import { AgentToolEvent } from "../types";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/statistics/vocabulary-stats.service", () => ({
  VocabularyStatsService: {
    getUserVocabularyStats: vi.fn(),
  },
}));

vi.mock("@/lib/statistics/vocab-set-summary.service", () => ({
  VocabSetSummaryService: {
    getUserVocabSetSummaries: vi.fn(),
  },
}));

vi.mock("@/repositories/vocab-set.repository", () => ({
  VocabSetRepository: {
    getVocabSets: vi.fn(),
    getVocabSetById: vi.fn(),
  },
}));

vi.mock("@/lib/openai", () => ({
  openai: {
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
  },
}));

describe("SRS Sets Distribution Tool (100% Census)", () => {
  const userId = "user-srs-test";
  let executor: AgentExecutor;

  beforeEach(() => {
    vi.clearAllMocks();
    executor = new AgentExecutor(userId);
  });

  it("should have get_srs_sets_distribution defined in AGENT_TOOLS with explicit census description", () => {
    const srsDistTool = AGENT_TOOLS.find(
      (t) => (t as { function: { name: string } }).function.name === "get_srs_sets_distribution"
    ) as { function: { name: string; description: string } };

    expect(srsDistTool).toBeDefined();
    expect(srsDistTool.function.description).toContain("100%");
    expect(srsDistTool.function.description).toContain("phân bố");
  });

  it("computes accurate census across multiple sets, distinguishes overdue vs today, and detects duplicates", async () => {
    const { VocabularyStatsService } = await import("@/lib/statistics/vocabulary-stats.service");
    const { createClient } = await import("@/lib/supabase/server");

    const now = new Date();
    const pastOverdueDate = new Date(now.getTime() - 24 * 60 * 60 * 1000 * 5).toISOString(); // 5 days ago
    const todayDueDate = new Date(now.getTime() - 1000 * 60).toISOString(); // 1 minute ago, today
    const futureDate = new Date(now.getTime() + 24 * 60 * 60 * 1000 * 3).toISOString(); // 3 days in future

    // Mock sets in database
    const mockSets = [
      { id: "set-hsg-17", title: "Đề ôn HSG số 17", color: "#4f46e5" },
      { id: "set-ielts", title: "IELTS Advanced", color: "#0ea5e9" },
      { id: "set-toeic", title: "TOEIC 850", color: "#10b981" },
    ];

    const mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "vocab_sets") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockResolvedValue({ data: mockSets }),
              }),
            }),
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
        };
      }),
    };
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

    // Mock rows in VocabularyStatsService
    // Status must be >= lv2 according to Vocabee's SRS design (lv1 is new/unlearned)
    // Row 1: set-hsg-17, overdue, word: "ubiquitous"
    // Row 2: set-hsg-17, due today, word: "ephemeral"
    // Row 3: set-ielts, overdue, word: "ubiquitous" (shared/duplicate word in another set!)
    // Row 4: set-toeic, overdue, word: "lucrative"
    // Row 5: set-hsg-17, FUTURE (not due), word: "serendipity"
    // Row 6: no set (unassigned), overdue, word: "orphan"
    const mockRows = [
      {
        id: "v-1",
        word: "ubiquitous",
        set_id: "set-hsg-17",
        review: { next_review: pastOverdueDate, status: "lv2" },
      },
      {
        id: "v-2",
        word: "ephemeral",
        set_id: "set-hsg-17",
        review: { next_review: todayDueDate, status: "lv3" },
      },
      {
        id: "v-3",
        word: "ubiquitous",
        set_id: "set-ielts",
        review: { next_review: pastOverdueDate, status: "lv2" },
      },
      {
        id: "v-4",
        word: "lucrative",
        set_id: "set-toeic",
        review: { next_review: pastOverdueDate, status: "lv4" },
      },
      {
        id: "v-5",
        word: "serendipity",
        set_id: "set-hsg-17",
        review: { next_review: futureDate, status: "lv2" },
      },
      {
        id: "v-6",
        word: "orphan",
        set_id: null,
        review: { next_review: pastOverdueDate, status: "lv2" },
      },
    ];

    vi.mocked(VocabularyStatsService.getUserVocabularyStats).mockResolvedValueOnce({
      totalVocabularies: mockRows.length,
      masteredCount: 0,
      learningCount: mockRows.length,
      notStartedCount: 0,
      dueReviewsCount: 5, // 5 due rows (v-1, v-2, v-3, v-4, v-6)
      rows: mockRows as any,
    } as any);

    const result = await executor.execute("get_srs_sets_distribution", {});

    expect(result.error).toBeUndefined();
    const data = result.data as any;

    expect(data.verified_by_database).toBe(true);
    expect(data.data_scope).toContain("100%");
    expect(data.account_totals.total_due_reviews).toBe(5);
    expect(data.account_totals.total_overdue_reviews).toBe(4); // v-1, v-3, v-4, v-6
    expect(data.account_totals.total_due_today_only).toBe(1); // v-2
    expect(data.account_totals.total_unique_due_words).toBe(5); // v-1, v-2, v-3, v-4, v-6 are distinct IDs

    // Sets distribution check
    expect(data.sets_distribution).toHaveLength(3);
    const hsgGroup = data.sets_distribution.find((s: any) => s.set_id === "set-hsg-17");
    expect(hsgGroup).toBeDefined();
    expect(hsgGroup.due_count).toBe(2);
    expect(hsgGroup.overdue_count).toBe(1);
    expect(hsgGroup.due_today_only_count).toBe(1);

    const ieltsGroup = data.sets_distribution.find((s: any) => s.set_id === "set-ielts");
    expect(ieltsGroup).toBeDefined();
    expect(ieltsGroup.due_count).toBe(1);

    const toeicGroup = data.sets_distribution.find((s: any) => s.set_id === "set-toeic");
    expect(toeicGroup).toBeDefined();
    expect(toeicGroup.due_count).toBe(1);

    // Multi-set duplicate detection check
    expect(data.duplicate_words_in_multiple_sets.count).toBe(1);
    expect(data.duplicate_words_in_multiple_sets.words).toContain("ubiquitous");

    // Unassigned words check
    expect(data.unassigned.count).toBe(1);
    expect(data.unassigned.sample_words).toContain("orphan");
  });

  it("handles case when user has 0 reviews due gracefully", async () => {
    const { VocabularyStatsService } = await import("@/lib/statistics/vocabulary-stats.service");
    const { createClient } = await import("@/lib/supabase/server");

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockResolvedValue({ data: [] }),
          }),
        }),
      }),
    };
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

    vi.mocked(VocabularyStatsService.getUserVocabularyStats).mockResolvedValueOnce({
      totalVocabularies: 0,
      masteredCount: 0,
      learningCount: 0,
      notStartedCount: 0,
      dueReviewsCount: 0,
      rows: [],
    } as any);

    const result = await executor.execute("get_srs_sets_distribution", {});
    expect(result.error).toBeUndefined();
    const data = result.data as any;
    expect(data.account_totals.total_due_reviews).toBe(0);
    expect(data.sets_distribution).toHaveLength(0);
    expect(result.summary).toContain("Hiện không có từ nào đến hạn ôn tập");
  });
});

describe("consolidateToolEvents UI Aggregator", () => {
  it("consolidates duplicate sequential tool events into a single entry with (N lần)", () => {
    const rawEvents: AgentToolEvent[] = [
      {
        toolName: "search_vocabulary",
        displayName: "Tìm kiếm từ vựng",
        status: "completed",
        summary: "Tìm thấy từ A",
      },
      {
        toolName: "search_vocabulary",
        displayName: "Tìm kiếm từ vựng",
        status: "completed",
        summary: "Tìm thấy từ B",
      },
      {
        toolName: "search_vocabulary",
        displayName: "Tìm kiếm từ vựng",
        status: "completed",
        summary: "Tìm thấy từ C",
      },
      {
        toolName: "get_srs_sets_distribution",
        displayName: "Phân tích phân bố SRS theo bộ từ",
        status: "completed",
        summary: "Đã phân tích 100%",
      },
    ];

    const consolidated = consolidateToolEvents(rawEvents);
    expect(consolidated).toHaveLength(2);
    expect(consolidated[0].displayName).toBe("Tìm kiếm từ vựng (3 lần)");
    expect(consolidated[1].displayName).toBe("Phân tích phân bố SRS theo bộ từ");
  });

  it("marks consolidated event status as error if any occurrence errored", () => {
    const rawEvents: AgentToolEvent[] = [
      {
        toolName: "search_vocabulary",
        displayName: "Tìm kiếm từ vựng",
        status: "completed",
      },
      {
        toolName: "search_vocabulary",
        displayName: "Tìm kiếm từ vựng",
        status: "error",
      },
    ];

    const consolidated = consolidateToolEvents(rawEvents);
    expect(consolidated).toHaveLength(1);
    expect(consolidated[0].displayName).toBe("Tìm kiếm từ vựng (2 lần)");
    expect(consolidated[0].status).toBe("error");
  });
});

describe("Orchestrator Loop Detection & Rate Limiting", () => {
  const userId = "user-loop-test";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("caches duplicate tool calls with warning note to prevent infinite loops", async () => {
    const { openai } = await import("@/lib/openai");
    const { createClient } = await import("@/lib/supabase/server");

    const queryMock: any = {
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [] }),
    };

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue(queryMock),
      }),
    };
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

    // First turn: model calls search_vocabulary with "apple"
    // Second turn: model tries calling search_vocabulary with "apple" again (duplicate)
    // Third turn: model returns final text
    vi.mocked(openai.chat.completions.create)
      .mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: "assistant",
              content: null,
              tool_calls: [
                {
                  id: "call_1",
                  type: "function",
                  function: {
                    name: "search_vocabulary",
                    arguments: JSON.stringify({ query: "apple" }),
                  },
                },
              ],
            },
          },
        ],
      } as any)
      .mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: "assistant",
              content: null,
              tool_calls: [
                {
                  id: "call_2",
                  type: "function",
                  function: {
                    name: "search_vocabulary",
                    arguments: JSON.stringify({ query: "apple" }),
                  },
                },
              ],
            },
          },
        ],
      } as any)
      .mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: "assistant",
              content: "Tôi đã hoàn tất việc tra cứu.",
            },
          },
        ],
      } as any);

    const response = await runAgentConversation(userId, [
      { role: "user", content: "Tìm từ apple" },
    ]);

    expect(response.success).toBe(true);
    expect(response.reply).toBe("Tôi đã hoàn tất việc tra cứu.");
    // Tool call should be consolidated to 1 event chip
    expect(response.toolEvents).toHaveLength(1);
    expect(response.toolEvents?.[0]?.displayName).toBe("Tìm kiếm từ vựng");
  });
});
