// src/lib/ai/openrouter/__tests__/gemma4-agent.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { runAgentConversation } from "@/lib/ai/agent/orchestrator";
import { AGENT_TOOLS } from "@/lib/ai/agent/tools";
import { AgentExecutor } from "@/lib/ai/agent/executor";
import { generateConfirmationToken, verifyConfirmationToken } from "@/lib/ai/agent/confirmation";
import {
  getOpenRouterChatModel,
  getOpenRouterVocabModel,
  getOpenRouterFallbackModel,
  getOpenRouterModelsForFeature,
  DEFAULT_OPENROUTER_CHAT_MODEL,
  DEFAULT_OPENROUTER_FALLBACK_MODEL,
} from "@/lib/ai/openrouter/config";
import type { ChatCompletion } from "openai/resources/chat/completions";
import type { createClient } from "@/lib/supabase/server";
import type { AgentToolEvent } from "@/lib/ai/agent/types";

type MockServerClient = Awaited<ReturnType<typeof createClient>>;

// Mock Supabase server client & repositories
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/repositories/vocab-set.repository", () => ({
  VocabSetRepository: {
    getVocabSets: vi.fn().mockResolvedValue({ data: [] }),
    getVocabSetById: vi.fn(),
    createVocabSet: vi.fn(),
    updateVocabSet: vi.fn(),
    deleteVocabSetCascade: vi.fn(),
  },
}));

vi.mock("@/repositories/vocabulary.repository", () => ({
  VocabularyRepository: {
    bulkInsert: vi.fn(),
    softDelete: vi.fn(),
    getByWord: vi.fn(),
    getBySetId: vi.fn(),
  },
}));

vi.mock("@/lib/statistics/vocabulary-stats.service", () => ({
  VocabularyStatsService: {
    getUserVocabularyStats: vi.fn().mockResolvedValue({
      totalWords: 50,
      newWords: 15,
      learningWords: 20,
      learnedWords: 5,
      masteredWords: 10,
      dueToday: 8,
      overdue: 3,
    }),
  },
}));

vi.mock("@/lib/statistics/vocab-set-summary.service", () => ({
  VocabSetSummaryService: {
    getUserVocabSetSummaries: vi.fn().mockResolvedValue({}),
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

describe("Vocabee Gemma 4 26B A4B & Agent Integration Tests", () => {
  const userId = "user-test-uuid-456";

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENROUTER_API_KEY = "sk-or-v1-mock-test-key";
    process.env.OPENROUTER_CHAT_MODEL = DEFAULT_OPENROUTER_CHAT_MODEL;
    process.env.OPENROUTER_VOCAB_MODEL = DEFAULT_OPENROUTER_CHAT_MODEL;
    process.env.OPENROUTER_FALLBACK_MODEL = DEFAULT_OPENROUTER_FALLBACK_MODEL;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // 1. Model Configuration & Defaults
  describe("Model Configuration", () => {
    it("uses google/gemma-4-26b-a4b-it:free as primary chat model", () => {
      expect(getOpenRouterChatModel()).toBe("google/gemma-4-26b-a4b-it:free");
    });

    it("uses google/gemma-4-26b-a4b-it:free as primary vocab model", () => {
      expect(getOpenRouterVocabModel()).toBe("google/gemma-4-26b-a4b-it:free");
    });

    it("uses nvidia/nemotron-3.5-lightning:free as fallback model", () => {
      expect(getOpenRouterFallbackModel()).toBe("nvidia/nemotron-3.5-lightning:free");
    });

    it("orders models [Gemma 4 primary, Nemotron fallback] for features", () => {
      const models = getOpenRouterModelsForFeature("chat");
      expect(models[0]).toBe("google/gemma-4-26b-a4b-it:free");
      expect(models[1]).toBe("nvidia/nemotron-3.5-lightning:free");
    });
  });

  // 2. Chat & Streaming
  describe("Chatbot & Streaming", () => {
    it("handles standard chat turn and returns natural Vietnamese response", async () => {
      const { openai } = await import("@/lib/openai");

      vi.mocked(openai.chat.completions.create).mockResolvedValueOnce({
        id: "chat-1",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: "Xin chào bạn! Tôi là Vocabee AI Assistant, tôi có thể giúp gì cho bạn hôm nay?",
            },
            finish_reason: "stop",
          },
        ],
      } as unknown as ChatCompletion);

      const res = await runAgentConversation(userId, [{ role: "user", content: "Chào bạn" }]);

      expect(res.success).toBe(true);
      expect(res.reply).toContain("Vocabee AI Assistant");
      expect(res.model).toBe("google/gemma-4-26b-a4b-it:free");
    });

    it("streams text tokens progressively via onTextDelta callback", async () => {
      const { openai } = await import("@/lib/openai");

      vi.mocked(openai.chat.completions.create).mockResolvedValueOnce({
        id: "chat-stream-1",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: "Từ vựng của bạn đang tiến bộ rất tốt!",
            },
            finish_reason: "stop",
          },
        ],
      } as unknown as ChatCompletion);

      const deltas: string[] = [];
      const res = await runAgentConversation(
        userId,
        [{ role: "user", content: "Tiến độ của tôi thế nào?" }],
        {
          onTextDelta: (delta) => deltas.push(delta),
        }
      );

      expect(res.success).toBe(true);
      expect(deltas.length).toBeGreaterThan(1);
      expect(deltas.join("")).toBe("Từ vựng của bạn đang tiến bộ rất tốt!");
    });
  });

  // 3. Multi-Step Tool Calling & Execution
  describe("Multi-Step Tool Calling", () => {
    it("executes single tool get_learning_progress and feeds data back for synthesis", async () => {
      const { openai } = await import("@/lib/openai");
      const { createClient } = await import("@/lib/supabase/server");

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              is: vi.fn().mockResolvedValue({
                data: [{ difficulty: "B2", is_starred: true }],
                count: 1,
              }),
              maybeSingle: vi.fn().mockResolvedValue({
                data: { streak: 5, longest_streak: 10, daily_goal: 20, level: "Intermediate" },
              }),
              gte: vi.fn().mockResolvedValue({
                data: [{ studied_words: 5, reviews_completed: 3, study_seconds: 120 }],
              }),
            }),
          }),
        }),
      };
      vi.mocked(createClient).mockResolvedValue(mockSupabase as unknown as MockServerClient);

      // Turn 1: model calls get_learning_progress
      // Turn 2: model synthesizes final answer
      vi.mocked(openai.chat.completions.create)
        .mockResolvedValueOnce({
          id: "call-step-1",
          choices: [
            {
              index: 0,
              message: {
                role: "assistant",
                content: null,
                tool_calls: [
                  {
                    id: "call_progress_1",
                    type: "function",
                    function: {
                      name: "get_learning_progress",
                      arguments: "{}",
                    },
                  },
                ],
              },
              finish_reason: "tool_calls",
            },
          ],
        } as unknown as ChatCompletion)
        .mockResolvedValueOnce({
          id: "call-step-2",
          choices: [
            {
              index: 0,
              message: {
                role: "assistant",
                content: "Bạn có 15 từ chưa học và 8 từ cần ôn tập hôm nay.",
              },
              finish_reason: "stop",
            },
          ],
        } as unknown as ChatCompletion);

      const toolEvents: AgentToolEvent[] = [];
      const res = await runAgentConversation(
        userId,
        [{ role: "user", content: "Tôi có bao nhiêu từ chưa học?" }],
        {
          onToolEvent: (e) => toolEvents.push(e),
        }
      );

      expect(res.success).toBe(true);
      expect(res.reply).toContain("15 từ chưa học");
      expect(toolEvents.some((e) => e.toolName === "get_learning_progress")).toBe(true);
    });

    it("supports multiple tool calls in a single turn", async () => {
      const { openai } = await import("@/lib/openai");
      const { createClient } = await import("@/lib/supabase/server");

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              is: vi.fn().mockResolvedValue({ data: [] }),
              maybeSingle: vi.fn().mockResolvedValue({
                data: { streak: 5, longest_streak: 10, daily_goal: 20, level: "Intermediate" },
              }),
              gte: vi.fn().mockResolvedValue({
                data: [{ studied_words: 5, reviews_completed: 3, study_seconds: 120 }],
              }),
            }),
          }),
        }),
      };
      vi.mocked(createClient).mockResolvedValue(mockSupabase as unknown as MockServerClient);

      // Model makes 2 tool calls in the same turn
      vi.mocked(openai.chat.completions.create)
        .mockResolvedValueOnce({
          id: "call-multi-tools",
          choices: [
            {
              index: 0,
              message: {
                role: "assistant",
                content: null,
                tool_calls: [
                  {
                    id: "call_a",
                    type: "function",
                    function: {
                      name: "get_learning_progress",
                      arguments: "{}",
                    },
                  },
                  {
                    id: "call_b",
                    type: "function",
                    function: {
                      name: "list_vocab_sets",
                      arguments: '{"search": "IELTS"}',
                    },
                  },
                ],
              },
              finish_reason: "tool_calls",
            },
          ],
        } as unknown as ChatCompletion)
        .mockResolvedValueOnce({
          id: "call-synth",
          choices: [
            {
              index: 0,
              message: {
                role: "assistant",
                content: "Đã tổng hợp tiến độ và bộ từ IELTS của bạn.",
              },
              finish_reason: "stop",
            },
          ],
        } as unknown as ChatCompletion);

      const res = await runAgentConversation(userId, [
        { role: "user", content: "Kiểm tra tiến độ và danh sách bộ từ IELTS" },
      ]);

      expect(res.success).toBe(true);
      expect(res.reply).toContain("Đã tổng hợp tiến độ");
      expect(res.toolEvents?.some((e) => e.toolName === "get_learning_progress")).toBe(true);
      expect(res.toolEvents?.some((e) => e.toolName === "list_vocab_sets")).toBe(true);
    });

    it("prevents infinite tool loops and duplicate tool calls", async () => {
      const { openai } = await import("@/lib/openai");
      const { createClient } = await import("@/lib/supabase/server");

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              is: vi.fn().mockReturnValue({
                or: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({ data: [] }),
                }),
              }),
            }),
          }),
        }),
      };
      vi.mocked(createClient).mockResolvedValue(mockSupabase as unknown as MockServerClient);

      // Model calls the exact same tool twice with same args
      vi.mocked(openai.chat.completions.create)
        .mockResolvedValueOnce({
          id: "dup-1",
          choices: [
            {
              index: 0,
              message: {
                role: "assistant",
                content: null,
                tool_calls: [
                  {
                    id: "call_1",
                    type: "function",
                    function: {
                      name: "get_vocabulary_overview",
                      arguments: "{}",
                    },
                  },
                ],
              },
              finish_reason: "tool_calls",
            },
          ],
        } as unknown as ChatCompletion)
        .mockResolvedValueOnce({
          id: "dup-2",
          choices: [
            {
              index: 0,
              message: {
                role: "assistant",
                content: null,
                tool_calls: [
                  {
                    id: "call_2",
                    type: "function",
                    function: {
                      name: "get_vocabulary_overview",
                      arguments: "{}",
                    },
                  },
                ],
              },
              finish_reason: "tool_calls",
            },
          ],
        } as unknown as ChatCompletion)
        .mockResolvedValueOnce({
          id: "dup-3",
          choices: [
            {
              index: 0,
              message: {
                role: "assistant",
                content: "Đã tổng quan xong từ vựng.",
              },
              finish_reason: "stop",
            },
          ],
        } as unknown as ChatCompletion);

      const res = await runAgentConversation(userId, [
        { role: "user", content: "Xem tổng quan từ vựng" },
      ]);

      expect(res.success).toBe(true);
      expect(res.toolEvents?.length).toBeLessThanOrEqual(2);
    });
  });

  // 4. Security & Destructive Confirmation
  describe("Security & Confirmation", () => {
    it("generates cryptographic confirmation token for delete_vocab_set and does NOT delete immediately", async () => {
      const executor = new AgentExecutor(userId);
      const { VocabSetRepository } = await import("@/repositories/vocab-set.repository");
      const { createClient } = await import("@/lib/supabase/server");

      vi.mocked(VocabSetRepository.getVocabSetById).mockResolvedValueOnce({
        id: "set-del-1",
        user_id: userId,
        title: "Bộ từ cần xóa",
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
                is: vi.fn().mockResolvedValue({ count: 5 }),
              }),
            }),
          }),
        }),
      };
      vi.mocked(createClient).mockResolvedValueOnce(mockSupabase as unknown as MockServerClient);

      const execRes = await executor.execute("delete_vocab_set", { set_id: "set-del-1" });

      expect(execRes.confirmation).toBeDefined();
      expect(execRes.confirmation?.action).toBe("delete_vocab_set");
      expect(execRes.confirmation?.targetId).toBe("set-del-1");
      expect(execRes.confirmation?.token).toBeTruthy();
      expect(VocabSetRepository.deleteVocabSetCascade).not.toHaveBeenCalled();
    });

    it("prevents cross-account token verification", () => {
      const token = generateConfirmationToken("delete_vocab_set", "set-123", userId);
      const verify = verifyConfirmationToken(token, "delete_vocab_set", "set-123", "attacker-uuid");
      expect(verify.valid).toBe(false);
      expect(verify.reason).toContain("không thuộc về tài khoản");
    });
  });

  // 5. Vocabulary & Grammar Explanation Tools
  describe("Vocabulary & Grammar Assistant Tool", () => {
    it("has lookup_dictionary_word defined in AGENT_TOOLS", () => {
      const toolNames = AGENT_TOOLS.map((t) => (t as { function: { name: string } }).function.name);
      expect(toolNames).toContain("lookup_dictionary_word");
    });

    it("looks up dictionary entry and returns IPA and definitions", async () => {
      const executor = new AgentExecutor(userId);
      const result = await executor.execute("lookup_dictionary_word", { word: "diligent" });

      expect(result.data).toBeDefined();
      expect(result.summary).toContain("diligent");
    });
  });
});
