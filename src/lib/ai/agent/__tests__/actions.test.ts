// src/lib/ai/agent/__tests__/actions.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { executeConfirmedAction } from "../executor";
import { VocabSetRepository } from "@/repositories/vocab-set.repository";
import { VocabularyRepository } from "@/repositories/vocabulary.repository";
import { createClient } from "@/lib/supabase/server";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/repositories/vocab-set.repository", () => ({
  VocabSetRepository: {
    getVocabSetById: vi.fn(),
    deleteVocabSetCascade: vi.fn(),
  },
}));

vi.mock("@/repositories/vocabulary.repository", () => ({
  VocabularyRepository: {
    softDelete: vi.fn(),
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("executeConfirmedAction & Security Verification", () => {
  const userId = "current-authorized-user";
  const targetSetId = "vocab-set-101";
  const targetVocabId = "vocab-item-202";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("executes confirmed delete_vocab_set when user is owner", async () => {
    vi.mocked(VocabSetRepository.getVocabSetById).mockResolvedValueOnce({
      id: targetSetId,
      user_id: userId,
      title: "Target Set",
    } as any);

    const res = await executeConfirmedAction(userId, "delete_vocab_set", targetSetId);

    expect(res.success).toBe(true);
    expect(res.message).toContain("Đã xóa thành công bộ từ 'Target Set'");
    expect(VocabSetRepository.deleteVocabSetCascade).toHaveBeenCalledWith(targetSetId, userId);
  });

  it("rejects delete_vocab_set if user does NOT own the set (ownership check)", async () => {
    // Returns null because user is not the owner or set not found
    vi.mocked(VocabSetRepository.getVocabSetById).mockResolvedValueOnce(null);

    await expect(
      executeConfirmedAction(userId, "delete_vocab_set", targetSetId)
    ).rejects.toThrow("Bộ từ không tồn tại hoặc bạn không có quyền xóa.");

    expect(VocabSetRepository.deleteVocabSetCascade).not.toHaveBeenCalled();
  });

  it("executes confirmed delete_vocabulary when user is owner", async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              is: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValueOnce({
                  data: { id: targetVocabId, word: "ephemeral", set_id: targetSetId },
                }),
              }),
            }),
          }),
        }),
      }),
    };
    vi.mocked(createClient).mockResolvedValueOnce(mockSupabase as any);

    const res = await executeConfirmedAction(userId, "delete_vocabulary", targetVocabId);

    expect(res.success).toBe(true);
    expect(res.message).toContain("Đã xóa thành công từ 'ephemeral'");
    expect(VocabularyRepository.softDelete).toHaveBeenCalledWith(targetVocabId, userId);
  });

  it("rejects delete_vocabulary if vocabulary does not belong to user", async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              is: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValueOnce({ data: null }),
              }),
            }),
          }),
        }),
      }),
    };
    vi.mocked(createClient).mockResolvedValueOnce(mockSupabase as any);

    await expect(
      executeConfirmedAction(userId, "delete_vocabulary", targetVocabId)
    ).rejects.toThrow("Từ vựng không tồn tại hoặc bạn không có quyền xóa.");

    expect(VocabularyRepository.softDelete).not.toHaveBeenCalled();
  });

  it("executes confirmed reset_vocab_set_progress without deleting vocabularies", async () => {
    vi.mocked(VocabSetRepository.getVocabSetById).mockResolvedValueOnce({
      id: targetSetId,
      user_id: userId,
      title: "Business English",
    } as any);

    const mockDelete = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        in: vi.fn().mockResolvedValue({ error: null }),
      }),
    });

    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === "vocabularies") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  is: vi.fn().mockResolvedValueOnce({
                    data: [{ id: "v1" }, { id: "v2" }, { id: "v3" }],
                  }),
                }),
              }),
            }),
          };
        }
        if (table === "reviews") {
          return {
            delete: mockDelete,
          };
        }
        return {};
      }),
    };
    vi.mocked(createClient).mockResolvedValueOnce(mockSupabase as any);

    const res = await executeConfirmedAction(userId, "reset_vocab_set_progress", targetSetId);

    expect(res.success).toBe(true);
    expect(res.message).toContain("Đã reset toàn bộ tiến trình học tập của 3 từ");
    // Verify that vocabularies are NOT deleted!
    expect(VocabularyRepository.softDelete).not.toHaveBeenCalled();
    expect(VocabSetRepository.deleteVocabSetCascade).not.toHaveBeenCalled();
  });
});
