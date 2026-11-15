// src/lib/ai/agent/__tests__/agent.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  generateConfirmationToken,
  verifyConfirmationToken,
} from "../confirmation";
import { AGENT_TOOLS } from "../tools";
import { AgentExecutor, executeConfirmedAction } from "../executor";

// Mock Supabase server client and repositories
vi.mock("@/lib/supabase/server", () => {
  return {
    createClient: vi.fn(),
  };
});

vi.mock("@/repositories/vocab-set.repository", () => {
  return {
    VocabSetRepository: {
      getVocabSets: vi.fn(),
      getVocabSetById: vi.fn(),
      createVocabSet: vi.fn(),
      updateVocabSet: vi.fn(),
      deleteVocabSetCascade: vi.fn(),
    },
  };
});

vi.mock("@/repositories/vocabulary.repository", () => {
  return {
    VocabularyRepository: {
      bulkInsert: vi.fn(),
      softDelete: vi.fn(),
    },
  };
});

vi.mock("@/lib/statistics/vocabulary-stats.service", () => {
  return {
    VocabularyStatsService: {
      getUserVocabularyStats: vi.fn(),
    },
  };
});

vi.mock("@/lib/statistics/vocab-set-summary.service", () => {
  return {
    VocabSetSummaryService: {
      getUserVocabSetSummaries: vi.fn(),
    },
  };
});

vi.mock("@/repositories/review.repository", () => {
  return {
    ReviewRepository: {
      getDueReviews: vi.fn(),
    },
  };
});

vi.mock("next/cache", () => {
  return {
    revalidatePath: vi.fn(),
  };
});

describe("Confirmation Security & Cryptographic Tokens", () => {
  const userId = "user-1234-uuid";
  const targetId = "set-abc-789";

  it("should generate and verify a valid confirmation token", () => {
    const token = generateConfirmationToken("delete_vocab_set", targetId, userId);
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(20);

    const check = verifyConfirmationToken(token, "delete_vocab_set", targetId, userId);
    expect(check.valid).toBe(true);
    expect(check.reason).toBeUndefined();
  });

  it("should reject token if action does not match", () => {
    const token = generateConfirmationToken("delete_vocab_set", targetId, userId);
    const check = verifyConfirmationToken(token, "reset_vocab_set_progress", targetId, userId);
    expect(check.valid).toBe(false);
    expect(check.reason).toContain("không khớp");
  });

  it("should reject token if target ID does not match", () => {
    const token = generateConfirmationToken("delete_vocab_set", targetId, userId);
    const check = verifyConfirmationToken(token, "delete_vocab_set", "different-target", userId);
    expect(check.valid).toBe(false);
    expect(check.reason).toContain("không khớp");
  });

  it("should reject token if user ID does not match (cross-account prevention)", () => {
    const token = generateConfirmationToken("delete_vocab_set", targetId, userId);
    const check = verifyConfirmationToken(token, "delete_vocab_set", targetId, "another-user-999");
    expect(check.valid).toBe(false);
    expect(check.reason).toContain("không thuộc về tài khoản");
  });

  it("should reject tampered or corrupted tokens", () => {
    const check = verifyConfirmationToken("invalid-garbage-token", "delete_vocab_set", targetId, userId);
    expect(check.valid).toBe(false);
  });
});

describe("AGENT_TOOLS Schema Definition", () => {
  it("should define all required vocabulary and progress tools", () => {
    const toolNames = AGENT_TOOLS.map((t) => (t as { function: { name: string } }).function.name);

    // Queries
    expect(toolNames).toContain("get_vocabulary_overview");
    expect(toolNames).toContain("list_vocab_sets");
    expect(toolNames).toContain("get_vocab_set_details");
    expect(toolNames).toContain("search_vocabulary");
    expect(toolNames).toContain("get_vocabulary_details");
    expect(toolNames).toContain("find_duplicate_vocabularies");
    expect(toolNames).toContain("get_vocabularies_by_cefr");
    expect(toolNames).toContain("get_learning_progress");
    expect(toolNames).toContain("get_review_schedule");
    expect(toolNames).toContain("get_learning_history");
    expect(toolNames).toContain("get_frequently_incorrect_words");
    expect(toolNames).toContain("get_sets_learning_comparison");

    // Safe Writes
    expect(toolNames).toContain("create_vocab_set");
    expect(toolNames).toContain("rename_vocab_set");
    expect(toolNames).toContain("add_vocabulary");
    expect(toolNames).toContain("bulk_add_vocabulary");
    expect(toolNames).toContain("update_vocabulary");

    // Destructive Actions (Confirmation Required)
    expect(toolNames).toContain("delete_vocab_set");
    expect(toolNames).toContain("delete_vocabulary");
    expect(toolNames).toContain("reset_vocab_set_progress");
    expect(toolNames).toContain("delete_vocab_set_learning_history");
    expect(toolNames).toContain("reset_single_vocabulary_progress");
  });

  it("should have correct function calling structure", () => {
    for (const tool of AGENT_TOOLS) {
      expect(tool.type).toBe("function");
      const fnTool = tool as { function: { name: string; description?: string; parameters?: any } };
      expect(fnTool.function.name).toBeTruthy();
      expect(fnTool.function.description).toBeTruthy();
      expect(fnTool.function.parameters).toBeDefined();
    }
  });
});

describe("AgentExecutor Tool Execution", () => {
  const userId = "test-user-1";
  let executor: AgentExecutor;

  beforeEach(() => {
    vi.clearAllMocks();
    executor = new AgentExecutor(userId);
  });

  it("handles unsupported tool gracefully without crashing", async () => {
    const res = await executor.execute("non_existent_tool", {});
    expect(res.error).toContain("không được hỗ trợ");
  });

  it("requires confirmation when delete_vocab_set is called and does NOT delete immediately", async () => {
    const { VocabSetRepository } = await import("@/repositories/vocab-set.repository");
    const { createClient } = await import("@/lib/supabase/server");

    vi.mocked(VocabSetRepository.getVocabSetById).mockResolvedValueOnce({
      id: "set-123",
      user_id: userId,
      title: "IELTS Speaking",
      description: "Speaking vocab",
      color: "#ff0000",
      icon: "BookOpen",
      visibility: "private",
      source: "manual",
      slug: null,
      source_language: "en",
      target_language: "vi",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_studied_at: null,
      deleted_at: null,
    });

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              is: vi.fn().mockResolvedValue({ count: 15 }),
            }),
          }),
        }),
      }),
    };
    vi.mocked(createClient).mockResolvedValueOnce(mockSupabase as any);

    const result = await executor.execute("delete_vocab_set", { set_id: "set-123" });

    // Must yield pending confirmation
    expect(result.confirmation).toBeDefined();
    expect(result.confirmation?.action).toBe("delete_vocab_set");
    expect(result.confirmation?.targetId).toBe("set-123");
    expect(result.confirmation?.targetName).toBe("IELTS Speaking");
    expect(result.confirmation?.token).toBeTruthy();
    expect(result.confirmation?.status).toBe("pending");

    // Must NOT have called deleteVocabSetCascade yet!
    expect(VocabSetRepository.deleteVocabSetCascade).not.toHaveBeenCalled();
  });

  it("requires confirmation when reset_vocab_set_progress is called", async () => {
    const { VocabSetRepository } = await import("@/repositories/vocab-set.repository");
    const { createClient } = await import("@/lib/supabase/server");

    vi.mocked(VocabSetRepository.getVocabSetById).mockResolvedValueOnce({
      id: "set-456",
      user_id: userId,
      title: "TOEIC 900",
      description: null,
      color: null,
      icon: null,
      visibility: "private",
      source: null,
      slug: null,
      source_language: null,
      target_language: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_studied_at: null,
      deleted_at: null,
    });

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              is: vi.fn().mockResolvedValue({ count: 40 }),
            }),
          }),
        }),
      }),
    };
    vi.mocked(createClient).mockResolvedValueOnce(mockSupabase as any);

    const result = await executor.execute("reset_vocab_set_progress", { set_id: "set-456" });

    expect(result.confirmation).toBeDefined();
    expect(result.confirmation?.action).toBe("reset_vocab_set_progress");
    expect(result.confirmation?.targetName).toBe("TOEIC 900");
    expect(result.confirmation?.status).toBe("pending");
  });

  it("validates inputs when creating vocab set", async () => {
    const res = await executor.execute("create_vocab_set", { title: "" });
    expect(res.error).toContain("Tên bộ từ không được để trống");
  });

  it("validates inputs when adding vocabulary", async () => {
    const res = await executor.execute("add_vocabulary", { word: "", meaning: "" });
    expect(res.error).toContain("không được để trống");
  });
});
