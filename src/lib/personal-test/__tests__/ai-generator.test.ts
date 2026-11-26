import { describe, it, expect } from "vitest";
import {
  generatePersonalTestWithAI,
  normalizeClozePassagePlaceholders,
  type AiTextCompleter,
} from "../ai-generator";
import { validateVocabeeTestJson } from "../vocabee-test-validator";
import { AIValidationError } from "@/lib/ai/errors";
import type { DeduplicatedTargetWord } from "../vocabulary-selection";

function makeTargets(words: string[]): DeduplicatedTargetWord[] {
  return words.map((w, idx) => ({
    normalizedWord: w.toLowerCase(),
    word: w,
    meaning: `nghĩa của ${w}`,
    alternativeMeanings: [],
    ipa: null,
    partOfSpeech: "verb",
    example: null,
    exampleTranslation: null,
    synonyms: [],
    note: null,
    difficulty: "medium",
    sourceVocabularyIds: [`v-${idx + 1}`],
    sourceSetIds: ["set-1"],
    sourceSetTitles: ["Academic"],
  }));
}

function buildValidSetJson(setNumber: number, words: string[]) {
  return {
    id: `set-${setNumber}`,
    label: `Academic Set ${setNumber}`,
    words,
    exercises: [
      {
        type: "matching",
        items: words.map((w, idx) => ({
          id: idx + 1,
          word: w,
          definition: `To perform action number ${idx + 1} in an academic context`,
          explanation: `Giải thích chi tiết cho từ "${w}".`,
        })),
      },
      {
        type: "sentence_completion",
        word_bank: words,
        items: words.map((w, idx) => ({
          id: idx + 1,
          sentence: `Researchers plan to ___ the issue during phase ${idx + 1}.`,
          answer: w,
          explanation: `Chọn "${w}" vì phù hợp ngữ cảnh câu ${idx + 1}.`,
        })),
      },
      {
        type: "synonyms_matching",
        items: words.map((w, idx) => ({
          id: idx + 1,
          word: w,
          synonyms: [`synonymA${idx + 1}`, `synonymB${idx + 1}`],
          explanation: `Từ đồng nghĩa diễn tả sắc thái tương tự của "${w}".`,
        })),
      },
      {
        type: "cloze_test",
        word_bank: words,
        passage: words
          .map(
            (_w, idx) =>
              `In stage ${idx + 1}, teams must ___(${idx + 1})___ the plan carefully.`
          )
          .join(" "),
        answers: words.map((w, idx) => ({
          id: idx + 1,
          answer: w,
          explanation: `Vị trí (${idx + 1}) cần "${w}" để hoàn chỉnh nghĩa đoạn văn.`,
        })),
      },
    ],
  };
}

describe("Personal Test: AI Generation, Cloze Normalization & Repair Pipeline", () => {
  it("normalizes common LLM cloze placeholder variants into ___(N)___", () => {
    expect(
      normalizeClozePassagePlaceholders(
        "Teams aim to (1) risks and (2) safety.",
        [1, 2]
      )
    ).toBe("Teams aim to ___(1)___ risks and ___(2)___ safety.");

    expect(
      normalizeClozePassagePlaceholders(
        "Teams aim to ___ (1) ___ risks and ___2___ safety.",
        [1, 2]
      )
    ).toBe("Teams aim to ___(1)___ risks and ___(2)___ safety.");

    expect(
      normalizeClozePassagePlaceholders(
        "Teams aim to [1] risks and **(2)** safety.",
        [1, 2]
      )
    ).toBe("Teams aim to ___(1)___ risks and ___(2)___ safety.");

    expect(
      normalizeClozePassagePlaceholders(
        "Teams aim to ______ risks and ___ safety.",
        [1, 2]
      )
    ).toBe("Teams aim to ___(1)___ risks and ___(2)___ safety.");
  });

  it("generates a valid single-set test via parallel Part A + Part B calls and strips extra keys", async () => {
    const targets = makeTargets(["mitigate", "bolster", "scrutinize"]);
    const fullSet = buildValidSetJson(1, ["mitigate", "bolster", "scrutinize"]);

    const completer: AiTextCompleter = async (prompt) => {
      if (prompt.includes("Part A")) {
        return JSON.stringify({
          label: fullSet.label,
          matching: fullSet.exercises[0],
          synonyms_matching: fullSet.exercises[2],
          description: "Unsupported key that should be stripped",
        });
      }
      return JSON.stringify({
        sentence_completion: fullSet.exercises[1],
        cloze_test: fullSet.exercises[3],
      });
    };

    const test = await generatePersonalTestWithAI({
      title: "Academic Practice",
      targetWords: targets,
      completer,
    });

    expect(test.schema).toBe("vocabee-test-v1");
    expect(test.title).toBe("Academic Practice");
    expect(test.total_words).toBe(3);
    expect(test.total_sets).toBe(1);
    expect(test.sets[0].exercises.map((e) => e.type)).toEqual([
      "matching",
      "sentence_completion",
      "synonyms_matching",
      "cloze_test",
    ]);
    expect(validateVocabeeTestJson(test).valid).toBe(true);
  });

  it("distributes 18 words into 2 sets and generates each set cleanly", async () => {
    const words = Array.from({ length: 18 }, (_, i) => `term${i + 1}`);
    const targets = makeTargets(words);

    const completer: AiTextCompleter = async (prompt) => {
      const wordsInPrompt = words.filter((w) => prompt.includes(`"${w}"`));
      const setObj = buildValidSetJson(1, wordsInPrompt);
      if (prompt.includes("Part A")) {
        return JSON.stringify({
          label: "Set",
          matching: setObj.exercises[0],
          synonyms_matching: setObj.exercises[2],
        });
      }
      return JSON.stringify({
        sentence_completion: setObj.exercises[1],
        cloze_test: setObj.exercises[3],
      });
    };

    const test = await generatePersonalTestWithAI({
      title: "18 Word Test",
      targetWords: targets,
      completer,
    });

    expect(test.total_words).toBe(18);
    expect(test.total_sets).toBe(2);
    expect(test.sets[0].words).toHaveLength(9);
    expect(test.sets[1].words).toHaveLength(9);
    expect(validateVocabeeTestJson(test).valid).toBe(true);
  });

  it("triggers targeted repair on only the failing part when definition leaks target word or cloze blanks mismatch", async () => {
    const targets = makeTargets(["mitigate", "bolster"]);
    let partACalls = 0;
    let partBCalls = 0;

    const valid = buildValidSetJson(1, ["mitigate", "bolster"]);

    const completer: AiTextCompleter = async (prompt) => {
      if (prompt.includes("Part A")) {
        partACalls += 1;
        if (partACalls === 1) {
          const brokenMatching = JSON.parse(JSON.stringify(valid.exercises[0]));
          brokenMatching.items[0].definition = "To mitigate something bad";
          return JSON.stringify({
            label: "Academic",
            matching: brokenMatching,
            synonyms_matching: valid.exercises[2],
          });
        }
        expect(prompt).toContain("VALIDATION ERRORS TO FIX");
        return JSON.stringify({
          label: "Academic",
          matching: valid.exercises[0],
          synonyms_matching: valid.exercises[2],
        });
      }

      partBCalls += 1;
      if (partBCalls === 1) {
        const brokenCloze = JSON.parse(JSON.stringify(valid.exercises[3]));
        brokenCloze.passage = "Teams will ___(1)___ the damage today.";
        return JSON.stringify({
          sentence_completion: valid.exercises[1],
          cloze_test: brokenCloze,
        });
      }
      expect(prompt).toContain("VALIDATION ERRORS TO FIX");
      return JSON.stringify({
        sentence_completion: valid.exercises[1],
        cloze_test: valid.exercises[3],
      });
    };

    const test = await generatePersonalTestWithAI({
      title: "Repaired Test",
      targetWords: targets,
      completer,
    });

    expect(partACalls).toBe(2);
    expect(partBCalls).toBe(2);
    expect(validateVocabeeTestJson(test).valid).toBe(true);
  });

  it("rejects fabricated target vocabulary even after retries", async () => {
    const targets = makeTargets(["mitigate", "bolster"]);
    const valid = buildValidSetJson(1, ["mitigate", "bolster"]);
    const fabricatedSentence = JSON.parse(JSON.stringify(valid.exercises[1]));
    fabricatedSentence.items[0].answer = "inventedword";

    const completer: AiTextCompleter = async (prompt) => {
      if (prompt.includes("Part A")) {
        return JSON.stringify({
          label: "Academic",
          matching: valid.exercises[0],
          synonyms_matching: valid.exercises[2],
        });
      }
      return JSON.stringify({
        sentence_completion: fabricatedSentence,
        cloze_test: valid.exercises[3],
      });
    };

    await expect(
      generatePersonalTestWithAI({
        title: "Invalid Test",
        targetWords: targets,
        completer,
      })
    ).rejects.toBeInstanceOf(AIValidationError);
  });

  it("rejects unsupported fields in strict VocabeeTestSchema validation", () => {
    const valid = buildValidSetJson(1, ["mitigate", "bolster"]);
    const raw = {
      schema: "vocabee-test-v1",
      title: "Strict Check",
      total_words: 2,
      total_sets: 1,
      sets: [
        {
          ...valid,
          exercises: [
            {
              type: "matching",
              items: [
                {
                  id: 1,
                  word: "mitigate",
                  definition: "To make less severe",
                  explanation: "Giảm nhẹ",
                  hint: "Unsupported field",
                },
              ],
            },
            ...valid.exercises.slice(1),
          ],
        },
      ],
    };

    const res = validateVocabeeTestJson(raw);
    expect(res.valid).toBe(false);
  });
});
