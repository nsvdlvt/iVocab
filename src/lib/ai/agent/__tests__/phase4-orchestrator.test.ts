// src/lib/ai/agent/__tests__/phase4-orchestrator.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { runAgentConversation, shouldAttachAgentTools } from "../orchestrator";
import {
  getCloudflareClient,
  resetCloudflareClient,
} from "@/lib/ai/cloudflare/provider";
import { POST as confirmPost } from "@/app/api/ai/chat/confirm/route";
import type { ChatCompletion } from "openai/resources/chat/completions";

const mockAuthUser = vi.fn();

const mockSets = [
  {
    id: "vs_1",
    user_id: "user-orch",
    title: "General",
    description: null,
    source_language: "en",
    target_language: "vi",
    color: "blue",
    icon: "BookOpen",
    visibility: "private",
    source: "manual",
    created_at: "2026-11-01T00:00:00Z",
    updated_at: "2026-11-01T00:00:00Z",
    last_studied_at: null,
    deleted_at: null,
  },
];

const mockWords = [
  {
    id: "w-1",
    set_id: "vs_1",
    owner_id: "user-orch",
    word: "ubiquitous",
    ipa: "/juːˈbɪk.wɪ.təs/",
    part_of_speech: "adjective",
    meaning: "có mặt khắp nơi",
    example: "Smartphones are ubiquitous today.",
    example_translation: null,
    synonyms: ["omnipresent"],
    antonyms: [],
    note: null,
    image_url: null,
    audio_url: null,
    difficulty: "hard",
    source: "manual",
    created_at: "2026-11-01T00:00:00Z",
    updated_at: "2026-11-01T00:00:00Z",
    deleted_at: null,
    fts_vector: null,
    is_starred: false,
    vocab_sets: { id: "vs_1", title: "General", deleted_at: null },
    review: {
      id: "r1",
      user_id: "user-orch",
      vocabulary_id: "w-1",
      status: "lv1",
      next_review: null,
      last_review: null,
      last_grade: "again",
      ease_factor: 2.1,
      interval: 1,
      repetitions: 1,
      created_at: "2026-11-01T00:00:00Z",
      updated_at: "2026-11-01T00:00:00Z",
    },
  },
  {
    id: "w-2",
    set_id: "vs_1",
    owner_id: "user-orch",
    word: "ephemeral",
    ipa: "/ɪˈfem.ər.əl/",
    part_of_speech: "adjective",
    meaning: "ngắn ngủi",
    example: "Fame can be ephemeral.",
    example_translation: null,
    synonyms: ["transient"],
    antonyms: [],
    note: null,
    image_url: null,
    audio_url: null,
    difficulty: "hard",
    source: "manual",
    created_at: "2026-11-01T00:00:00Z",
    updated_at: "2026-11-01T00:00:00Z",
    deleted_at: null,
    fts_vector: null,
    is_starred: false,
    vocab_sets: { id: "vs_1", title: "General", deleted_at: null },
    review: null,
  },
];

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockImplementation(async () => ({
    auth: {
      getUser: mockAuthUser,
    },
    from: (table: string) => {
      const data =
        table === "vocab_sets" ? mockSets : table === "vocabularies" ? mockWords : [];
      const chain: Record<string, unknown> = {
        select: () => chain,
        eq: () => chain,
        is: () => chain,
        gte: () => chain,
        order: () => chain,
        limit: () => Promise.resolve({ data, error: null }),
        range: () => Promise.resolve({ data, error: null }),
        insert: () => ({ then: (r: (v: unknown) => void) => r({ error: null }) }),
        then: (r: (v: unknown) => void) => r({ data, error: null }),
      };
      return chain;
    },
  })),
}));

describe("Phase 4 – Multi-Step Orchestration & Security Controls", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.CLOUDFLARE_API_TOKEN = "cfut_test_orch_12345";
    process.env.CLOUDFLARE_ACCOUNT_ID = "acc-orch-12345";
    process.env.CLOUDFLARE_CHAT_MODEL = "@cf/google/gemma-4-26b-a4b-it";
    process.env.CLOUDFLARE_FALLBACK_MODEL = "@cf/openai/gpt-oss-20b";
  });

  afterEach(() => {
    resetCloudflareClient(null);
    process.env = originalEnv;
  });

  it("orchestrates multi-step read -> prepare write -> generate exercise -> summary", async () => {
    const client = getCloudflareClient();
    resetCloudflareClient(client);

    const createSpy = vi
      .spyOn(client.chat.completions, "create")
      // Round 1: read weak words
      .mockResolvedValueOnce({
        id: "r1",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: null,
              tool_calls: [
                {
                  id: "tc_1",
                  type: "function",
                  function: { name: "get_words_needing_attention", arguments: '{"limit":20}' },
                },
              ],
            },
            finish_reason: "tool_calls",
          },
        ],
      } as unknown as ChatCompletion)
      // Round 2: prepare new set + generate quiz
      .mockResolvedValueOnce({
        id: "r2",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: null,
              tool_calls: [
                {
                  id: "tc_2",
                  type: "function",
                  function: {
                    name: "create_vocabulary_set",
                    arguments: JSON.stringify({
                      title: "Weak Words",
                      words: [{ word: "ubiquitous", meaning: "có mặt khắp nơi" }],
                    }),
                  },
                },
                {
                  id: "tc_3",
                  type: "function",
                  function: {
                    name: "generate_practice_exercise",
                    arguments: JSON.stringify({ focus: "weak", count: 2 }),
                  },
                },
              ],
            },
            finish_reason: "tool_calls",
          },
        ],
      } as unknown as ChatCompletion)
      // Round 3: final summary
      .mockResolvedValueOnce({
        id: "r3",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content:
                "Tôi đã tìm thấy các từ bạn hay sai, chuẩn bị bản xem trước tạo bộ từ 'Weak Words' để bạn xác nhận, và tạo sẵn bài luyện tập bên dưới.",
            },
            finish_reason: "stop",
          },
        ],
      } as unknown as ChatCompletion);

    const result = await runAgentConversation("user-orch", [
      {
        role: "user",
        content: "Tìm các từ hay sai, tạo bộ từ Weak Words và tạo bài luyện tập.",
      },
    ]);

    expect(result.success).toBe(true);
    expect(result.confirmations).toHaveLength(1);
    expect(result.confirmations[0].action).toBe("create_vocabulary_set");
    expect(result.cards.some((c) => c.kind === "practice_quiz")).toBe(true);
    expect(createSpy).toHaveBeenCalledTimes(3);
  });

  it("deduplicates identical read-only tool calls within the same turn", async () => {
    const client = getCloudflareClient();
    resetCloudflareClient(client);

    vi.spyOn(client.chat.completions, "create")
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
                  id: "c1",
                  type: "function",
                  function: { name: "count_vocabulary_sets", arguments: "{}" },
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
                  id: "c2",
                  type: "function",
                  function: { name: "count_vocabulary_sets", arguments: "{}" },
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
            message: { role: "assistant", content: "Bạn có 1 bộ từ vựng." },
            finish_reason: "stop",
          },
        ],
      } as unknown as ChatCompletion);

    const res = await runAgentConversation("user-orch", [
      { role: "user", content: "Tôi có bao nhiêu bộ từ?" },
    ]);

    expect(res.success).toBe(true);
    expect(res.toolEvents).toHaveLength(1);
  });

  it("reports clear error if configured models do not support tool calling", async () => {
    const client = getCloudflareClient();
    resetCloudflareClient(client);

    vi.spyOn(client.chat.completions, "create").mockRejectedValue(
      new Error("Model does not support tool calling")
    );

    const res = await runAgentConversation("user-orch", [
      { role: "user", content: "Tôi có bao nhiêu từ?" },
    ]);

    expect(res.success).toBe(false);
    expect(res.error).toContain("tool calling");
  });

  it("rejects unauthenticated requests to /api/ai/chat/confirm with 401", async () => {
    mockAuthUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    const req = new Request("http://localhost:3000/api/ai/chat/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: "fake-token-123456",
        actionId: "act_1234",
        action: "delete_vocabulary_set",
        decision: "confirm",
      }),
    });

    const res = await confirmPost(req);
    expect(res.status).toBe(401);
  });

  it("skips tool schemas on general chat fast-path and attaches tools on DB/action queries", () => {
    expect(shouldAttachAgentTools([{ role: "user", content: "Chào bạn" }])).toBe(false);
    expect(
      shouldAttachAgentTools([{ role: "user", content: "What does mitigate mean?" }])
    ).toBe(false);
    expect(
      shouldAttachAgentTools([
        { role: "user", content: "Explain the difference between mitigate and alleviate." },
      ])
    ).toBe(false);
    expect(
      shouldAttachAgentTools([{ role: "user", content: "Tôi có bao nhiêu bộ từ?" }])
    ).toBe(true);
    expect(
      shouldAttachAgentTools([{ role: "user", content: "How many words do I have?" }])
    ).toBe(true);
    expect(
      shouldAttachAgentTools([{ role: "user", content: "Delete IELTS Advanced" }])
    ).toBe(true);
  });

  it("streams real-time text deltas and streamed tool_calls chunks cleanly", async () => {
    const client = getCloudflareClient();
    resetCloudflareClient(client);

    async function* toolStream() {
      yield {
        choices: [
          {
            delta: {
              tool_calls: [
                {
                  index: 0,
                  id: "call_stream_1",
                  type: "function",
                  function: { name: "count_vocabulary_", arguments: "{" },
                },
              ],
            },
          },
        ],
      };
      yield {
        choices: [
          {
            delta: {
              tool_calls: [
                {
                  index: 0,
                  function: { name: "sets", arguments: "}" },
                },
              ],
            },
          },
        ],
      };
    }

    async function* textStream() {
      yield { choices: [{ delta: { content: "Bạn có " } }] };
      yield { choices: [{ delta: { content: "1 bộ từ." } }] };
    }

    vi.spyOn(client.chat.completions, "create")
      .mockResolvedValueOnce(toolStream() as unknown as ChatCompletion)
      .mockResolvedValueOnce(textStream() as unknown as ChatCompletion);

    const deltas: string[] = [];
    const res = await runAgentConversation(
      "user-orch",
      [{ role: "user", content: "Tôi có bao nhiêu bộ từ?" }],
      { onTextDelta: (d) => deltas.push(d) }
    );

    expect(res.success).toBe(true);
    expect(res.reply).toBe("Bạn có 1 bộ từ.");
    expect(deltas).toEqual(["Bạn có ", "1 bộ từ."]);
  });
});
