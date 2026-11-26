import { describe, it, expect } from "vitest";
import {
  deduplicateSelectedVocabulary,
  distributeWordsIntoSets,
  formatDifficultyLabel,
  getPlannedSetSizes,
  selectPriorityWordIdsToCap,
  suggestTestTitle,
  type SelectableVocabularyWord,
} from "../vocabulary-selection";

function makeWord(
  id: string,
  word: string,
  setId = "set-a",
  setTitle = "Set A",
  overrides: Partial<SelectableVocabularyWord> = {}
): SelectableVocabularyWord {
  return {
    id,
    set_id: setId,
    set_title: setTitle,
    set_color: "#f59e0b",
    word,
    ipa: null,
    part_of_speech: "verb",
    meaning: `meaning of ${word}`,
    example: null,
    example_translation: null,
    synonyms: null,
    note: null,
    difficulty: "medium",
    created_at: "2026-01-01T00:00:00.000Z",
    is_starred: false,
    ...overrides,
  };
}

describe("Personal Test: Vocabulary Selection & Set Distribution", () => {
  it("deduplicates identical record IDs and identical target words across sets while preserving source memberships", () => {
    const records: SelectableVocabularyWord[] = [
      makeWord("rec-1", "Mitigate", "set-1", "Environment", {
        meaning: "giảm nhẹ",
        synonyms: ["alleviate"],
      }),
      makeWord("rec-1", "Mitigate", "set-1", "Environment"),
      makeWord("rec-2", "  mitigate ", "set-2", "Academic", {
        meaning: "làm dịu bớt",
        ipa: "/ˈmɪt.ɪ.ɡeɪt/",
        synonyms: ["lessen", "mitigate"],
      }),
      makeWord("rec-3", "bolster", "set-2", "Academic", {
        meaning: "củng cố",
      }),
    ];

    const result = deduplicateSelectedVocabulary(records);
    expect(result).toHaveLength(2);

    const mitigate = result[0];
    expect(mitigate.normalizedWord).toBe("mitigate");
    expect(mitigate.sourceVocabularyIds).toEqual(["rec-1", "rec-2"]);
    expect(mitigate.sourceSetIds).toEqual(["set-1", "set-2"]);
    expect(mitigate.sourceSetTitles).toEqual(["Environment", "Academic"]);
    expect(mitigate.alternativeMeanings).toEqual(["làm dịu bớt"]);
    expect(mitigate.ipa).toBe("/ˈmɪt.ɪ.ɡeɪt/");
    // Self-synonym filtered out; valid synonyms merged
    expect(mitigate.synonyms).toEqual(["alleviate", "lessen"]);
  });

  it("distributes 1-15 words into 1 set, 16-30 into 2 balanced sets, and 31+ into balanced ~12-15 word sets", () => {
    const makeBatch = (count: number) =>
      deduplicateSelectedVocabulary(
        Array.from({ length: count }, (_, idx) =>
          makeWord(`id-${idx}`, `word${idx + 1}`, "s1", "Set 1", {
            part_of_speech: idx % 2 === 0 ? "verb" : "noun",
          })
        )
      );

    expect(distributeWordsIntoSets(makeBatch(2)).map((b) => b.length)).toEqual([2]);
    expect(distributeWordsIntoSets(makeBatch(15)).map((b) => b.length)).toEqual([15]);
    expect(distributeWordsIntoSets(makeBatch(16)).map((b) => b.length)).toEqual([8, 8]);
    expect(distributeWordsIntoSets(makeBatch(25)).map((b) => b.length)).toEqual([13, 12]);
    expect(distributeWordsIntoSets(makeBatch(30)).map((b) => b.length)).toEqual([15, 15]);
    expect(distributeWordsIntoSets(makeBatch(38)).map((b) => b.length)).toEqual([13, 13, 12]);
    expect(distributeWordsIntoSets(makeBatch(45)).map((b) => b.length)).toEqual([15, 15, 15]);
  });

  it("computes planned set sizes matching distribution rules", () => {
    expect(getPlannedSetSizes(10)).toEqual([10]);
    expect(getPlannedSetSizes(18)).toEqual([9, 9]);
    expect(getPlannedSetSizes(36)).toEqual([12, 12, 12]);
  });

  it("suggests descriptive titles and formats stored difficulty labels without fabricating CEFR", () => {
    expect(suggestTestTitle([{ id: "1", title: "IELTS Core" }], 12)).toBe(
      "Kiểm tra: IELTS Core (12 từ)"
    );
    expect(
      suggestTestTitle(
        [
          { id: "1", title: "IELTS" },
          { id: "2", title: "Business" },
        ],
        20
      )
    ).toBe("Kiểm tra: IELTS & Business (20 từ)");
    expect(
      suggestTestTitle(
        [
          { id: "1", title: "A" },
          { id: "2", title: "B" },
          { id: "3", title: "C" },
        ],
        30
      )
    ).toBe("Kiểm tra tổng hợp 3 bộ từ (30 từ)");

    expect(formatDifficultyLabel("B2")).toBe("B2");
    expect(formatDifficultyLabel("easy")).toBe("Dễ");
    expect(formatDifficultyLabel("medium")).toBe("Trung bình");
    expect(formatDifficultyLabel("hard")).toBe("Khó");
    expect(formatDifficultyLabel(null)).toBeNull();
  });

  it("caps bulk selection at 45 unique words and prioritizes lowest SRS levels first", () => {
    const existing = [
      makeWord("existing-1", "alreadyPicked", "s1", "Set 1", { srsLevel: 3 }),
    ];

    const candidates: SelectableVocabularyWord[] = [
      ...Array.from({ length: 20 }, (_, i) =>
        makeWord(`lv5-${i}`, `mastered${i}`, "s1", "Set 1", { srsLevel: 5 })
      ),
      ...Array.from({ length: 25 }, (_, i) =>
        makeWord(`lv0-${i}`, `unlearned${i}`, "s1", "Set 1", { srsLevel: 0 })
      ),
      ...Array.from({ length: 25 }, (_, i) =>
        makeWord(`lv1-${i}`, `learning${i}`, "s1", "Set 1", { srsLevel: 1 })
      ),
      // Duplicate of already-selected word should be skipped
      makeWord("dup-existing", "alreadypicked", "s2", "Set 2", { srsLevel: 0 }),
    ];

    const { idsToAdd, totalEligibleUnique, wasCapped } = selectPriorityWordIdsToCap(
      candidates,
      existing,
      45
    );

    expect(wasCapped).toBe(true);
    expect(totalEligibleUnique).toBe(70);
    // 45 - 1 existing = 44 slots remaining
    expect(idsToAdd).toHaveLength(44);
    expect(idsToAdd.includes("dup-existing")).toBe(false);
    // All 25 Lv0 words must be included, plus 19 Lv1 words, and 0 Lv5 words
    const pickedLv0 = idsToAdd.filter((id) => id.startsWith("lv0-"));
    const pickedLv1 = idsToAdd.filter((id) => id.startsWith("lv1-"));
    const pickedLv5 = idsToAdd.filter((id) => id.startsWith("lv5-"));
    expect(pickedLv0).toHaveLength(25);
    expect(pickedLv1).toHaveLength(19);
    expect(pickedLv5).toHaveLength(0);
  });
});
