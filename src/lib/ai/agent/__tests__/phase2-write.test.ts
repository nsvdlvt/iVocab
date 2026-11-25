// src/lib/ai/agent/__tests__/phase2-write.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AgentToolExecutor } from "../tools";
import {
  createPendingConfirmation,
  resetConsumedConfirmationsForTest,
  verifyConfirmationToken,
} from "../confirmation";
import { executeConfirmedAgentAction, cancelPendingAgentAction } from "../executor";
import { VocabSetRepository } from "@/repositories/vocab-set.repository";
import { VocabularyRepository } from "@/repositories/vocabulary.repository";

const existingSets = [
  {
    id: "vs_EXIST01",
    user_id: "user-1",
    title: "Environment",
    slug: null,
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

const existingWords = [
  {
    id: "word-existing-1",
    set_id: "vs_EXIST01",
    owner_id: "user-1",
    word: "sustainable",
    ipa: null,
    part_of_speech: "adjective",
    meaning: "bền vững",
    example: null,
    example_translation: null,
    synonyms: null,
    antonyms: null,
    note: null,
    image_url: null,
    audio_url: null,
    difficulty: "medium",
    source: "manual",
    created_at: "2026-11-01T00:00:00Z",
    updated_at: "2026-11-01T00:00:00Z",
    deleted_at: null,
    fts_vector: null,
    is_starred: false,
    vocab_sets: { id: "vs_EXIST01", title: "Environment", deleted_at: null },
    review: null,
  },
];

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const mockUpdateMaybeSingle = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockImplementation(async () => ({
    from: (table: string) => {
      const data =
        table === "vocab_sets"
          ? existingSets
          : table === "vocabularies"
          ? existingWords
          : [];
      const chain: Record<string, unknown> = {
        select: () => chain,
        eq: () => chain,
        is: () => chain,
        order: () => chain,
        range: () => Promise.resolve({ data, error: null }),
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: { id: "new-word-id" }, error: null }),
          }),
          then: (res: (v: unknown) => void) => res({ error: null }),
        }),
        update: () => ({
          eq: () => ({
            eq: () => ({
              is: () => ({
                select: () => ({
                  maybeSingle: mockUpdateMaybeSingle,
                }),
              }),
            }),
          }),
        }),
        maybeSingle: () => Promise.resolve({ data: data[0] ?? null, error: null }),
      };
      return chain;
    },
  })),
}));

vi.mock("@/repositories/vocab-set.repository", () => ({
  VocabSetRepository: {
    getVocabSetById: vi.fn(),
    createVocabSet: vi.fn(),
    updateVocabSet: vi.fn(),
    deleteVocabSetCascade: vi.fn(),
    permanentDeleteVocabSet: vi.fn(),
  },
}));

vi.mock("@/repositories/vocabulary.repository", () => ({
  VocabularyRepository: {
    getBySetId: vi.fn().mockResolvedValue([]),
    bulkInsert: vi.fn().mockResolvedValue(undefined),
    softDelete: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("Phase 2 – Controlled Write Operations & Confirmation Flow", () => {
  const executor = new AgentToolExecutor("user-1");

  beforeEach(() => {
    vi.clearAllMocks();
    resetConsumedConfirmationsForTest();
    mockUpdateMaybeSingle.mockResolvedValue({ data: { id: "word-existing-1", word: "sustainable", set_id: "vs_EXIST01" }, error: null });
  });

  it("prepares preview & confirmation for create_vocabulary_set without writing immediately", async () => {
    const res = await executor.execute("create_vocabulary_set", {
      title: "Weak Words",
      words: [
        { word: "mitigate", meaning: "giảm nhẹ" },
        { word: "MITIGATE", meaning: "duplicate in batch" },
      ],
    });

    expect(res.confirmations).toHaveLength(1);
    expect(res.confirmations?.[0].action).toBe("create_vocabulary_set");
    expect(res.confirmations?.[0].affectedCount).toBe(2); // 1 set + 1 deduped word
    expect(VocabSetRepository.createVocabSet).not.toHaveBeenCalled();
  });

  it("executes create_vocabulary_set after valid UI confirmation and rolls back on word insert failure", async () => {
    const prep = await executor.execute("create_vocabulary_set", {
      title: "Travel",
      words: [{ word: "itinerary", meaning: "lịch trình" }],
    });

    const conf = prep.confirmations![0];
    vi.mocked(VocabularyRepository.bulkInsert).mockRejectedValueOnce(new Error("Insert failed"));

    const failExec = await executeConfirmedAgentAction("user-1", {
      token: conf.token,
      action: conf.action,
      actionId: conf.actionId,
    });

    expect(failExec.success).toBe(false);
    expect(VocabSetRepository.permanentDeleteVocabSet).toHaveBeenCalledTimes(1);
  });

  it("prevents unintended duplicate words in create_vocabulary_word and bulk_create_vocabulary_words", async () => {
    const singleDup = await executor.execute("create_vocabulary_word", {
      set_title: "Environment",
      word: " Sustainable ",
      meaning: "bền vững",
    });

    expect(singleDup.confirmations).toBeUndefined();
    expect((singleDup.data as { duplicateDetected: boolean }).duplicateDetected).toBe(true);

    const bulkRes = await executor.execute("bulk_create_vocabulary_words", {
      set_title: "Environment",
      words: [
        { word: "sustainable", meaning: "duplicate" },
        { word: "biodiversity", meaning: "đa dạng sinh học" },
      ],
    });

    expect(bulkRes.confirmations).toHaveLength(1);
    expect(bulkRes.confirmations?.[0].affectedCount).toBe(1);
  });

  it("requires explicit confirmation for delete_vocabulary_set and rejects cross-user or replayed tokens", async () => {
    const prep = await executor.execute("delete_vocabulary_set", {
      set_title: "Environment",
    });

    expect(prep.confirmations).toHaveLength(1);
    const conf = prep.confirmations![0];
    expect(VocabSetRepository.deleteVocabSetCascade).not.toHaveBeenCalled();

    // Cross-user rejection
    const attackerAttempt = await executeConfirmedAgentAction("attacker-user", {
      token: conf.token,
      action: conf.action,
      actionId: conf.actionId,
    });
    expect(attackerAttempt.success).toBe(false);
    expect(attackerAttempt.statusCode).toBe(403);
    expect(VocabSetRepository.deleteVocabSetCascade).not.toHaveBeenCalled();

    // Legitimate execution
    vi.mocked(VocabSetRepository.getVocabSetById).mockResolvedValueOnce(existingSets[0]);
    const validExec = await executeConfirmedAgentAction("user-1", {
      token: conf.token,
      action: conf.action,
      actionId: conf.actionId,
    });
    expect(validExec.success).toBe(true);
    expect(VocabSetRepository.deleteVocabSetCascade).toHaveBeenCalledWith("vs_EXIST01", "user-1");

    // Replay rejection
    const replayAttempt = await executeConfirmedAgentAction("user-1", {
      token: conf.token,
      action: conf.action,
      actionId: conf.actionId,
    });
    expect(replayAttempt.success).toBe(false);
  });

  it("rejects expired confirmation tokens", () => {
    const oldConf = createPendingConfirmation({
      userId: "user-1",
      action: "delete_vocabulary_word",
      title: "Delete",
      description: "Delete word",
      targetName: "test",
      affectedCount: 1,
      affectedSummary: "1 word",
      consequences: [],
      params: { wordId: "w1" },
      nowMs: Date.now() - 20 * 60 * 1000,
    });

    const check = verifyConfirmationToken(
      oldConf.token,
      oldConf.action,
      oldConf.actionId,
      "user-1"
    );
    expect(check.valid).toBe(false);
    if (!check.valid) {
      expect(check.expired).toBe(true);
    }
  });

  it("handles bulk_update_vocabulary_words partial failures accurately and supports cancellation", async () => {
    const prep = await executor.execute("bulk_update_vocabulary_words", {
      items: [
        { word_id: "word-existing-1", meaning: "bền vững (updated)" },
        { word_id: "unauthorized-word", meaning: "hack" },
      ],
    });

    expect(prep.confirmations?.[0].affectedCount).toBe(1);
    const conf = prep.confirmations![0];

    // Cancel path keeps data untouched
    const cancelRes = await cancelPendingAgentAction("user-1", {
      token: conf.token,
      action: conf.action,
      actionId: conf.actionId,
    });
    expect(cancelRes.success).toBe(true);

    // Token cannot be reused after cancel
    const afterCancel = await executeConfirmedAgentAction("user-1", {
      token: conf.token,
      action: conf.action,
      actionId: conf.actionId,
    });
    expect(afterCancel.success).toBe(false);
  });
});
