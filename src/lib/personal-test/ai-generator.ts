import { executeChatCompletionWithFallback } from "@/lib/ai/cloudflare";
import { AIResponseError, AIValidationError } from "@/lib/ai/errors";
import type {
  ClozeTestExercise,
  MatchingExercise,
  SentenceCompletionExercise,
  SynonymsMatchingExercise,
  VocabeeTest,
  VocabeeTestSet,
  ValidationErrorItem,
} from "@/types/vocabee-test";
import {
  type DeduplicatedTargetWord,
  distributeWordsIntoSets,
} from "./vocabulary-selection";
import {
  definitionContainsTargetWord,
  normalizeTargetToken,
  resolveAnswerToTargetWord,
  validateGeneratedSetSemantics,
  validateVocabeeTestJson,
} from "./vocabee-test-validator";
import { extractClozeBlankIds } from "./vocabee-test-parser";
import {
  ClozeTestExerciseSchema,
  MatchingExerciseSchema,
  SentenceCompletionExerciseSchema,
  SynonymsMatchingExerciseSchema,
} from "./vocabee-test-schema";

export type AiTextCompleter = (
  prompt: string,
  signal?: AbortSignal
) => Promise<string>;

const defaultAiCompleter: AiTextCompleter = async (prompt, signal) => {
  const result = await executeChatCompletionWithFallback({
    messages: [
      {
        role: "system",
        content:
          "You are Vocabee's academic English test generator. Always output strictly valid raw JSON with zero markdown formatting, zero code fences, and zero extra commentary.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    feature: "quiz",
    temperature: 0.2,
    maxTokens: 2800,
    signal,
  });

  const text = result.completion.choices?.[0]?.message?.content ?? "";
  if (!text.trim()) {
    throw new AIResponseError("AI không trả về nội dung.");
  }
  return text;
};

/**
 * Extracts a single JSON object from raw model output without unwrapping object fields into arrays.
 */
export function extractJsonObjectFromText(rawText: string): unknown {
  let cleaned = rawText.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  cleaned = cleaned.replace(/```(?:json)?\s*([\s\S]*?)\s*```/gi, "$1").trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {}
    }
    throw new AIResponseError("Phản hồi từ AI không đúng định dạng JSON hợp lệ.");
  }
}

/**
 * Normalizes common LLM cloze placeholder variants into the mandatory `___(N)___` syntax
 * when they unambiguously correspond to the generated answer IDs.
 */
export function normalizeClozePassagePlaceholders(
  passage: string,
  answerIds: number[]
): string {
  if (!passage) return "";
  const answerSet = new Set(answerIds);
  let normalized = passage.trim();

  // 1. Spaced or mismatched underscores around (N): `_ (1) _`, `___ (1) ___`, `__(1)__` -> `___(1)___`
  normalized = normalized.replace(/_{1,}\s*\(\s*(\d+)\s*\)\s*_{1,}/g, "___($1)___");

  // 2. Underscores on only one side: `(1) ___` or `___ (1)` -> `___(1)___`
  normalized = normalized.replace(/(?<!_)\(\s*(\d+)\s*\)\s*_{2,}/g, "___($1)___");
  normalized = normalized.replace(/_{2,}\s*\(\s*(\d+)\s*\)(?!_)/g, "___($1)___");

  // 3. Underscores around bare digit: `___1___`, `__1__` -> `___(1)___`
  normalized = normalized.replace(/(?<!\()_{2,}(\d+)_{2,}(?!\))/g, "___($1)___");

  // 4. Asterisks around (N): `**(1)**`, `***(1)***` -> `___(1)___`
  normalized = normalized.replace(/\*{1,}\s*\(\s*(\d+)\s*\)\s*\*{1,}/g, "___($1)___");

  // 5. Bracketed placeholders `[1]` or `[(1)]` matching known answer IDs -> `___(1)___`
  if (answerSet.size > 0) {
    normalized = normalized.replace(/\[\s*\(?(\d+)\)?\s*\]/g, (full, numStr) => {
      const id = Number(numStr);
      return answerSet.has(id) ? `___(${id})___` : full;
    });
  }

  // 6. Fallback when zero `___(N)___` placeholders were found
  if (extractClozeBlankIds(normalized).length === 0 && answerSet.size > 0) {
    // 6a. Bare `(1)`, `(2)` placeholders matching answer IDs
    const bareMatches = Array.from(normalized.matchAll(/\((\d+)\)/g))
      .map((m) => Number(m[1]))
      .filter((id) => answerSet.has(id));
    if (bareMatches.length > 0) {
      normalized = normalized.replace(/\((\d+)\)/g, (full, numStr) => {
        const id = Number(numStr);
        return answerSet.has(id) ? `___(${id})___` : full;
      });
    }
  }

  if (extractClozeBlankIds(normalized).length === 0 && answerIds.length > 0) {
    // 6b. Sequential plain `___` / `______` blanks matching exact answer count
    const plainBlanks = normalized.match(/_{3,}/g) || [];
    if (plainBlanks.length === answerIds.length) {
      let idx = 0;
      const sortedIds = [...answerIds].sort((a, b) => a - b);
      normalized = normalized.replace(/_{3,}/g, () => {
        const id = sortedIds[idx++] ?? idx;
        return `___(${id})___`;
      });
    }
  }

  return normalized;
}

function buildVocabularyContextLines(words: DeduplicatedTargetWord[]): string {
  return words
    .map((w, idx) => {
      const parts: string[] = [
        `${idx + 1}. word: "${w.word}"`,
        `meaning: "${w.meaning}"`,
      ];
      if (w.alternativeMeanings.length > 0) {
        parts.push(
          `other_meanings: [${w.alternativeMeanings.map((m) => `"${m}"`).join(", ")}]`
        );
      }
      if (w.ipa) parts.push(`ipa: "${w.ipa}"`);
      if (w.partOfSpeech) parts.push(`pos: "${w.partOfSpeech}"`);
      if (w.example) parts.push(`example: "${w.example}"`);
      if (w.synonyms.length > 0) {
        parts.push(
          `stored_synonyms: [${w.synonyms.map((s) => `"${s}"`).join(", ")}]`
        );
      }
      if (w.note) parts.push(`note: "${w.note}"`);
      return parts.join(" | ");
    })
    .join("\n");
}

interface ExerciseWordPlan {
  matchingWords: DeduplicatedTargetWord[];
  sentenceWords: DeduplicatedTargetWord[];
  synonymsPool: DeduplicatedTargetWord[];
  clozeWords: DeduplicatedTargetWord[];
}

function planExerciseWordAssignments(words: DeduplicatedTargetWord[]): ExerciseWordPlan {
  const n = words.length;
  if (n <= 12) {
    return {
      matchingWords: words,
      sentenceWords: words,
      synonymsPool: words,
      clozeWords: words.slice(0, Math.min(10, n)),
    };
  }

  // For 13-15 words: matching takes 0..11 (12 words), sentence takes n-12..n-1 (12 words),
  // cloze prioritizes words appearing in only 1 of matching/sentence (0..2 and 12..n-1) + extras up to 10.
  const matchingWords = words.slice(0, 12);
  const sentenceWords = words.slice(n - 12);
  const singleCoverage = [
    ...words.slice(0, n - 12),
    ...words.slice(12),
  ];
  const rest = words.slice(n - 12, 12);
  const clozeWords = [...singleCoverage, ...rest].slice(0, 10);

  return {
    matchingWords,
    sentenceWords,
    synonymsPool: words,
    clozeWords,
  };
}

function buildPartAPrompt(
  setIndex: number,
  totalSets: number,
  allSetWords: DeduplicatedTargetWord[],
  plan: ExerciseWordPlan
): string {
  const matchingList = JSON.stringify(plan.matchingWords.map((w) => w.word));
  const synonymsMax = Math.min(12, allSetWords.length);

  return `Generate Part A (Matching + Synonyms Matching) for Set ${setIndex + 1} of ${totalSets} in strict JSON format.

TARGET VOCABULARY:
${buildVocabularyContextLines(allSetWords)}

RETURN ONLY THIS RAW JSON OBJECT (no markdown fences, no commentary):
{
  "label": "Short descriptive English topic label",
  "matching": {
    "type": "matching",
    "items": [
      { "id": 1, "word": "...", "definition": "Concise unambiguous English definition", "explanation": "Giải thích ngắn gọn (1 câu) bằng tiếng Việt" }
    ]
  },
  "synonyms_matching": {
    "type": "synonyms_matching",
    "items": [
      { "id": 1, "word": "...", "synonyms": ["syn1", "syn2"], "explanation": "Giải thích sắc thái ngắn gọn (1 câu) bằng tiếng Việt" }
    ]
  }
}

RULES:
- "matching.items": Create EXACTLY 1 item for EACH word in ${matchingList} (${plan.matchingWords.length} items, sequential id 1..${plan.matchingWords.length}).
- In "matching", "definition" MUST be concise English and MUST NOT contain the target word or its obvious root/inflection.
- "synonyms_matching.items": Pick up to ${synonymsMax} words from the list above that have accurate English synonyms (at least 1 item; exclude words lacking natural synonyms). Each item has 1 or 2 accurate English synonyms (never equal to the word itself).
- ALL "explanation" fields MUST be concise Vietnamese (1 sentence).
- Do NOT invent any word outside the provided list. Do NOT include any extra keys.`;
}

function buildPartBPrompt(
  setIndex: number,
  totalSets: number,
  allSetWords: DeduplicatedTargetWord[],
  plan: ExerciseWordPlan
): string {
  const sentenceList = JSON.stringify(plan.sentenceWords.map((w) => w.word));
  const clozeList = JSON.stringify(plan.clozeWords.map((w) => w.word));
  const clozeCount = plan.clozeWords.length;
  const passageLength = clozeCount >= 6 ? "100-170 words" : "60-110 words";

  return `Generate Part B (Sentence Completion + Cloze Test) for Set ${setIndex + 1} of ${totalSets} in strict JSON format.

TARGET VOCABULARY:
${buildVocabularyContextLines(allSetWords)}

RETURN ONLY THIS RAW JSON OBJECT (no markdown fences, no commentary):
{
  "sentence_completion": {
    "type": "sentence_completion",
    "word_bank": ${sentenceList},
    "items": [
      { "id": 1, "sentence": "Context-rich English sentence with exactly one ___ blank.", "answer": "target word", "explanation": "Giải thích ngắn gọn (1 câu) bằng tiếng Việt" }
    ]
  },
  "cloze_test": {
    "type": "cloze_test",
    "word_bank": ${clozeList},
    "passage": "Cohesive English passage containing ___(1)___ and ___(2)___ up to ___(${clozeCount})___.",
    "answers": [
      { "id": 1, "answer": "target word", "explanation": "Giải thích ngữ cảnh ngắn gọn (1 câu) bằng tiếng Việt" }
    ]
  }
}

RULES:
- "sentence_completion.items": Create EXACTLY ${plan.sentenceWords.length} items (sequential id 1..${plan.sentenceWords.length}), testing EVERY word in ${sentenceList}. Each sentence MUST contain EXACTLY ONE "___" (three underscores).
- GRAMMATICAL TRANSFORMATION (IMPORTANT): Do NOT make every item a simple base-form copy. Design a natural mix of contexts: some requiring grammatical transformation (verb tense/conjugation like -ed/-ing/-s, past participle, plural noun, or valid adjective/adverb/noun form derived from the target word) and others naturally using the base form. ALWAYS keep "word_bank" in base form, and put the exact grammatically required form in "answer".
- "cloze_test": Write ONE cohesive English passage (${passageLength}) using ALL ${clozeCount} words from ${clozeList}, also naturally mixing base forms and grammatically inflected/transformed forms where grammar requires it (while keeping "word_bank" in base form).
- MANDATORY CLOZE PLACEHOLDER SYNTAX: Use EXACTLY ___(1)___, ___(2)___, ..., ___(${clozeCount})___ (three underscores on BOTH sides of "(N)"). NEVER write (1) without underscores, and ensure each numbered blank appears EXACTLY ONCE (total ${clozeCount} blanks, matching ${clozeCount} answers).
- "cloze_test.answers" MUST have ${clozeCount} entries with sequential id 1..${clozeCount} matching the ${clozeCount} blanks in "passage".
- ALL "explanation" fields MUST be concise Vietnamese (1-2 sentences) explaining BOTH the word's meaning AND why the chosen grammatical form is required (never contradict the sentence grammar).
- Do NOT invent any target word outside the list above. Do NOT include any extra keys.`;
}

function normalizeMatchingExercise(
  raw: unknown,
  targetList: string[]
): MatchingExercise | null {
  if (!raw || typeof raw !== "object") return null;
  const ex = raw as Record<string, unknown>;
  if (!Array.isArray(ex.items)) return null;

  const items = ex.items
    .filter((it): it is Record<string, unknown> => Boolean(it && typeof it === "object"))
    .map((it, idx) => {
      const rawWord = typeof it.word === "string" ? it.word.trim() : "";
      const canonical = resolveAnswerToTargetWord(rawWord, targetList) ?? rawWord;
      return {
        id: idx + 1,
        word: canonical,
        definition: typeof it.definition === "string" ? it.definition.trim() : "",
        explanation: typeof it.explanation === "string" ? it.explanation.trim() : "",
      };
    })
    .filter((it) => it.word.length > 0);

  return { type: "matching", items };
}

function normalizeSynonymsExercise(
  raw: unknown,
  targetList: string[]
): SynonymsMatchingExercise | null {
  if (!raw || typeof raw !== "object") return null;
  const ex = raw as Record<string, unknown>;
  if (!Array.isArray(ex.items)) return null;

  const items = ex.items
    .filter((it): it is Record<string, unknown> => Boolean(it && typeof it === "object"))
    .map((it, idx) => {
      const rawWord = typeof it.word === "string" ? it.word.trim() : "";
      const canonical = resolveAnswerToTargetWord(rawWord, targetList) ?? rawWord;
      const syns = Array.isArray(it.synonyms)
        ? it.synonyms
            .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
            .map((s) => s.trim())
            .filter((s) => normalizeTargetToken(s) !== normalizeTargetToken(canonical))
            .slice(0, 2)
        : [];
      return {
        id: idx + 1,
        word: canonical,
        synonyms: syns,
        explanation: typeof it.explanation === "string" ? it.explanation.trim() : "",
      };
    })
    .filter((it) => it.word.length > 0 && it.synonyms.length > 0);

  return { type: "synonyms_matching", items };
}

function normalizeSentenceExercise(
  raw: unknown,
  targetList: string[]
): SentenceCompletionExercise | null {
  if (!raw || typeof raw !== "object") return null;
  const ex = raw as Record<string, unknown>;
  if (!Array.isArray(ex.items)) return null;

  const items = ex.items
    .filter((it): it is Record<string, unknown> => Boolean(it && typeof it === "object"))
    .map((it, idx) => {
      const rawSentence = typeof it.sentence === "string" ? it.sentence.trim() : "";
      const normalizedSentence = rawSentence.replace(/_{3,}/g, "___");
      const rawAns = typeof it.answer === "string" ? it.answer.trim() : "";
      return {
        id: idx + 1,
        sentence: normalizedSentence,
        answer: rawAns,
        explanation: typeof it.explanation === "string" ? it.explanation.trim() : "",
      };
    });

  const rawWordBank = Array.isArray(ex.word_bank)
    ? ex.word_bank.filter((w): w is string => typeof w === "string" && w.trim().length > 0)
    : [];
  const bankSet = new Set<string>();
  for (const w of rawWordBank) {
    const canonical = resolveAnswerToTargetWord(w, targetList);
    if (canonical) bankSet.add(canonical);
  }
  for (const it of items) {
    const canonical = resolveAnswerToTargetWord(it.answer, targetList);
    if (canonical) bankSet.add(canonical);
  }

  return {
    type: "sentence_completion",
    word_bank: Array.from(bankSet),
    items,
  };
}

function normalizeClozeExercise(
  raw: unknown,
  targetList: string[]
): ClozeTestExercise | null {
  if (!raw || typeof raw !== "object") return null;
  const ex = raw as Record<string, unknown>;

  const answers = Array.isArray(ex.answers)
    ? ex.answers
        .filter((a): a is Record<string, unknown> => Boolean(a && typeof a === "object"))
        .map((a, idx) => ({
          id: typeof a.id === "number" && Number.isInteger(a.id) ? a.id : idx + 1,
          answer: typeof a.answer === "string" ? a.answer.trim() : "",
          explanation: typeof a.explanation === "string" ? a.explanation.trim() : "",
        }))
    : [];

  const rawPassage = typeof ex.passage === "string" ? ex.passage : "";
  const passage = normalizeClozePassagePlaceholders(
    rawPassage,
    answers.map((a) => a.id)
  );

  const rawWordBank = Array.isArray(ex.word_bank)
    ? ex.word_bank.filter((w): w is string => typeof w === "string" && w.trim().length > 0)
    : [];
  const bankSet = new Set<string>();
  for (const w of rawWordBank) {
    const canonical = resolveAnswerToTargetWord(w, targetList);
    if (canonical) bankSet.add(canonical);
  }
  for (const a of answers) {
    const canonical = resolveAnswerToTargetWord(a.answer, targetList);
    if (canonical) bankSet.add(canonical);
  }

  return {
    type: "cloze_test",
    word_bank: Array.from(bankSet),
    passage,
    answers,
  };
}

function extractPartACandidate(raw: unknown): {
  label: string;
  matching: unknown;
  synonyms_matching: unknown;
} {
  if (!raw || typeof raw !== "object") {
    return { label: "Vocabulary Practice", matching: null, synonyms_matching: null };
  }
  let obj = raw as Record<string, unknown>;
  if (Array.isArray(obj.sets) && obj.sets[0] && typeof obj.sets[0] === "object") {
    obj = obj.sets[0] as Record<string, unknown>;
  }
  const label =
    typeof obj.label === "string" && obj.label.trim().length > 0
      ? obj.label.trim()
      : "Vocabulary Practice";

  let matching = obj.matching;
  let synonyms = obj.synonyms_matching;
  if (Array.isArray(obj.exercises)) {
    for (const ex of obj.exercises) {
      if (ex && typeof ex === "object") {
        const rec = ex as Record<string, unknown>;
        if (rec.type === "matching" && !matching) matching = rec;
        if (rec.type === "synonyms_matching" && !synonyms) synonyms = rec;
      }
    }
  }
  return { label, matching, synonyms_matching: synonyms };
}

function extractPartBCandidate(raw: unknown): {
  sentence_completion: unknown;
  cloze_test: unknown;
} {
  if (!raw || typeof raw !== "object") {
    return { sentence_completion: null, cloze_test: null };
  }
  let obj = raw as Record<string, unknown>;
  if (Array.isArray(obj.sets) && obj.sets[0] && typeof obj.sets[0] === "object") {
    obj = obj.sets[0] as Record<string, unknown>;
  }
  let sentence = obj.sentence_completion;
  let cloze = obj.cloze_test;
  if (Array.isArray(obj.exercises)) {
    for (const ex of obj.exercises) {
      if (ex && typeof ex === "object") {
        const rec = ex as Record<string, unknown>;
        if (rec.type === "sentence_completion" && !sentence) sentence = rec;
        if (rec.type === "cloze_test" && !cloze) cloze = rec;
      }
    }
  }
  return { sentence_completion: sentence, cloze_test: cloze };
}

function validatePartA(
  matching: MatchingExercise | null,
  synonyms: SynonymsMatchingExercise | null,
  expectedTargetWords: string[],
  requiredMatchingWords: string[]
): ValidationErrorItem[] {
  const errors: ValidationErrorItem[] = [];

  const mSchema = MatchingExerciseSchema.safeParse(matching);
  if (!mSchema.success) {
    errors.push({
      path: "matching",
      message: mSchema.error.issues[0]?.message || "Bài tập Matching không hợp lệ.",
    });
  } else {
    const seen = new Set<string>();
    mSchema.data.items.forEach((item, idx) => {
      const target = resolveAnswerToTargetWord(item.word, expectedTargetWords);
      if (!target || normalizeTargetToken(item.word) !== normalizeTargetToken(target)) {
        errors.push({
          path: `matching.items[${idx}].word`,
          message: `Từ "${item.word}" không thuộc danh sách từ được chọn.`,
        });
      } else {
        seen.add(normalizeTargetToken(target));
      }
      if (definitionContainsTargetWord(item.definition, item.word)) {
        errors.push({
          path: `matching.items[${idx}].definition`,
          message: `Định nghĩa của "${item.word}" không được chứa từ mục tiêu hoặc biến thể của nó.`,
        });
      }
    });
    for (const reqWord of requiredMatchingWords) {
      if (!seen.has(normalizeTargetToken(reqWord))) {
        errors.push({
          path: "matching.items",
          message: `Thiếu từ "${reqWord}" trong bài tập Matching.`,
        });
      }
    }
  }

  const sSchema = SynonymsMatchingExerciseSchema.safeParse(synonyms);
  if (!sSchema.success) {
    errors.push({
      path: "synonyms_matching",
      message: sSchema.error.issues[0]?.message || "Bài tập Synonyms Matching không hợp lệ.",
    });
  } else {
    sSchema.data.items.forEach((item, idx) => {
      const target = resolveAnswerToTargetWord(item.word, expectedTargetWords);
      if (!target || normalizeTargetToken(item.word) !== normalizeTargetToken(target)) {
        errors.push({
          path: `synonyms_matching.items[${idx}].word`,
          message: `Từ "${item.word}" không thuộc danh sách từ được chọn.`,
        });
      }
    });
  }

  return errors;
}

function validatePartB(
  sentence: SentenceCompletionExercise | null,
  cloze: ClozeTestExercise | null,
  expectedTargetWords: string[],
  requiredSentenceWords: string[]
): ValidationErrorItem[] {
  const errors: ValidationErrorItem[] = [];

  const scSchema = SentenceCompletionExerciseSchema.safeParse(sentence);
  if (!scSchema.success) {
    errors.push({
      path: "sentence_completion",
      message: scSchema.error.issues[0]?.message || "Bài tập Sentence Completion không hợp lệ.",
    });
  } else {
    const covered = new Set<string>();
    scSchema.data.items.forEach((item, idx) => {
      const blanks = item.sentence.match(/___/g) || [];
      const anyLong = item.sentence.match(/_{3,}/g) || [];
      if (blanks.length !== 1 || anyLong.length !== 1) {
        errors.push({
          path: `sentence_completion.items[${idx}].sentence`,
          message: `Câu ${idx + 1} phải có chính xác 1 chỗ trống "___".`,
        });
      }
      const target = resolveAnswerToTargetWord(item.answer, expectedTargetWords);
      if (!target) {
        errors.push({
          path: `sentence_completion.items[${idx}].answer`,
          message: `Đáp án "${item.answer}" không khớp với bất kỳ từ nào được chọn.`,
        });
      } else {
        covered.add(normalizeTargetToken(target));
        if (!resolveAnswerToTargetWord(item.answer, scSchema.data.word_bank)) {
          errors.push({
            path: `sentence_completion.items[${idx}].answer`,
            message: `Đáp án "${item.answer}" thiếu dạng gốc trong word_bank.`,
          });
        }
      }
    });
    for (const reqWord of requiredSentenceWords) {
      if (!covered.has(normalizeTargetToken(reqWord))) {
        errors.push({
          path: "sentence_completion.items",
          message: `Thiếu câu hỏi cho từ "${reqWord}" trong Sentence Completion.`,
        });
      }
    }
  }

  const czSchema = ClozeTestExerciseSchema.safeParse(cloze);
  if (!czSchema.success) {
    errors.push({
      path: "cloze_test",
      message: czSchema.error.issues[0]?.message || "Bài tập Cloze Test không hợp lệ.",
    });
  } else {
    const blankIds = extractClozeBlankIds(czSchema.data.passage);
    if (blankIds.length !== czSchema.data.answers.length) {
      errors.push({
        path: "cloze_test.passage",
        message: `Số lượng ô trống ___(N)___ (${blankIds.length}) không khớp số đáp án (${czSchema.data.answers.length}). Hãy dùng đúng cú pháp ___(1)___, ___(2)___...`,
      });
    } else {
      for (let i = 0; i < blankIds.length; i++) {
        if (blankIds[i] !== i + 1) {
          errors.push({
            path: "cloze_test.passage",
            message: `Ô trống phải đánh số tuần tự bắt đầu từ ___(1)___ (tìm thấy ___(${blankIds[i]})___ ở vị trí ${i + 1}).`,
          });
          break;
        }
      }
    }

    const ansIds = [...czSchema.data.answers.map((a) => a.id)].sort((a, b) => a - b);
    const sortedBlanks = [...blankIds].sort((a, b) => a - b);
    if (ansIds.length === sortedBlanks.length) {
      for (let i = 0; i < ansIds.length; i++) {
        if (ansIds[i] !== sortedBlanks[i]) {
          errors.push({
            path: "cloze_test.answers",
            message: `ID đáp án (${ansIds[i]}) không khớp ID ô trống (${sortedBlanks[i]}).`,
          });
          break;
        }
      }
    }

    for (const ans of czSchema.data.answers) {
      const target = resolveAnswerToTargetWord(ans.answer, expectedTargetWords);
      if (!target) {
        errors.push({
          path: `cloze_test.answers[${ans.id}]`,
          message: `Đáp án Cloze "${ans.answer}" không thuộc từ vựng được chọn.`,
        });
      } else if (!resolveAnswerToTargetWord(ans.answer, czSchema.data.word_bank)) {
        errors.push({
          path: `cloze_test.answers[${ans.id}]`,
          message: `Đáp án Cloze "${ans.answer}" thiếu dạng gốc trong word_bank.`,
        });
      }
    }
  }

  return errors;
}

function buildTargetedRepairPrompt(
  partName: "Part A" | "Part B",
  allowedWords: string[],
  brokenCandidate: unknown,
  errors: ValidationErrorItem[]
): string {
  const errText = errors
    .slice(0, 10)
    .map((e, i) => `${i + 1}. [${e.path}] ${e.message}`)
    .join("\n");

  return `Repair this ${partName} JSON object so ALL validation errors are fixed. Return ONLY raw JSON (no markdown fences).

ALLOWED TARGET WORDS (ONLY THESE): ${JSON.stringify(allowedWords)}

VALIDATION ERRORS TO FIX:
${errText}

CRITICAL RULES:
- For Cloze Test: every blank in "passage" MUST use exact syntax ___(1)___, ___(2)___, ... starting at 1, sequential, matching answers[].id and answers.length.
- For Sentence Completion: every sentence MUST have exactly one "___".
- For Matching: definitions MUST be English and MUST NOT contain the target word or its stem.
- All explanations MUST be concise Vietnamese. No unsupported keys.

PREVIOUS JSON:
${JSON.stringify(brokenCandidate)}`;
}

async function generatePartAWithRepair(
  setIndex: number,
  totalSets: number,
  allSetWords: DeduplicatedTargetWord[],
  plan: ExerciseWordPlan,
  completer: AiTextCompleter,
  signal?: AbortSignal
): Promise<{
  label: string;
  matching: MatchingExercise;
  synonyms_matching: SynonymsMatchingExercise;
}> {
  const targetList = allSetWords.map((w) => w.word);
  const requiredMatching = plan.matchingWords.map((w) => w.word);
  let prompt = buildPartAPrompt(setIndex, totalSets, allSetWords, plan);
  let lastErrors: ValidationErrorItem[] = [];

  for (let attempt = 1; attempt <= 3; attempt++) {
    const raw = await completer(prompt, signal);
    const parsed = extractJsonObjectFromText(raw);
    const extracted = extractPartACandidate(parsed);
    const matching = normalizeMatchingExercise(extracted.matching, targetList);
    const synonyms = normalizeSynonymsExercise(extracted.synonyms_matching, targetList);
    const errors = validatePartA(matching, synonyms, targetList, requiredMatching);

    if (errors.length === 0 && matching && synonyms) {
      return { label: extracted.label, matching, synonyms_matching: synonyms };
    }
    lastErrors = errors;
    if (attempt < 3) {
      prompt = buildTargetedRepairPrompt(
        "Part A",
        targetList,
        { label: extracted.label, matching, synonyms_matching: synonyms },
        errors
      );
    }
  }

  throw new AIValidationError(
    `AI không thể tạo phần Matching/Synonyms hợp lệ cho Set ${setIndex + 1}: ${lastErrors
      .slice(0, 2)
      .map((e) => e.message)
      .join("; ")}`
  );
}

async function generatePartBWithRepair(
  setIndex: number,
  totalSets: number,
  allSetWords: DeduplicatedTargetWord[],
  plan: ExerciseWordPlan,
  completer: AiTextCompleter,
  signal?: AbortSignal
): Promise<{
  sentence_completion: SentenceCompletionExercise;
  cloze_test: ClozeTestExercise;
}> {
  const targetList = allSetWords.map((w) => w.word);
  const requiredSentence = plan.sentenceWords.map((w) => w.word);
  let prompt = buildPartBPrompt(setIndex, totalSets, allSetWords, plan);
  let lastErrors: ValidationErrorItem[] = [];

  for (let attempt = 1; attempt <= 3; attempt++) {
    const raw = await completer(prompt, signal);
    const parsed = extractJsonObjectFromText(raw);
    const extracted = extractPartBCandidate(parsed);
    const sentence = normalizeSentenceExercise(extracted.sentence_completion, targetList);
    const cloze = normalizeClozeExercise(extracted.cloze_test, targetList);
    const errors = validatePartB(sentence, cloze, targetList, requiredSentence);

    if (errors.length === 0 && sentence && cloze) {
      return { sentence_completion: sentence, cloze_test: cloze };
    }
    lastErrors = errors;
    if (attempt < 3) {
      prompt = buildTargetedRepairPrompt(
        "Part B",
        targetList,
        { sentence_completion: sentence, cloze_test: cloze },
        errors
      );
    }
  }

  throw new AIValidationError(
    `AI không thể tạo phần Sentence Completion/Cloze Test hợp lệ cho Set ${setIndex + 1}: ${lastErrors
      .slice(0, 2)
      .map((e) => e.message)
      .join("; ")}`
  );
}

/**
 * Deterministically normalizes a single complete Set JSON object (kept exported for tests & callers).
 */
export function normalizeSetCandidate(
  rawCandidate: unknown,
  setIndex: number,
  targetWords: DeduplicatedTargetWord[]
): unknown {
  if (!rawCandidate || typeof rawCandidate !== "object") return rawCandidate;

  let candidateObj = rawCandidate as Record<string, unknown>;
  if (
    Array.isArray(candidateObj.sets) &&
    candidateObj.sets.length > 0 &&
    typeof candidateObj.sets[0] === "object"
  ) {
    candidateObj = candidateObj.sets[0] as Record<string, unknown>;
  }

  const targetList = targetWords.map((w) => w.word);
  const rawExercises = Array.isArray(candidateObj.exercises)
    ? candidateObj.exercises
    : [];

  const cleanExercises = rawExercises.map((rawEx) => {
    if (!rawEx || typeof rawEx !== "object") return rawEx;
    const ex = rawEx as Record<string, unknown>;
    if (ex.type === "matching") return normalizeMatchingExercise(ex, targetList) ?? rawEx;
    if (ex.type === "sentence_completion") return normalizeSentenceExercise(ex, targetList) ?? rawEx;
    if (ex.type === "synonyms_matching") return normalizeSynonymsExercise(ex, targetList) ?? rawEx;
    if (ex.type === "cloze_test") return normalizeClozeExercise(ex, targetList) ?? rawEx;
    return rawEx;
  });

  const label =
    typeof candidateObj.label === "string" && candidateObj.label.trim().length > 0
      ? candidateObj.label.trim()
      : `Set ${setIndex + 1}`;

  return {
    id: `set-${setIndex + 1}`,
    label,
    words: targetList,
    exercises: cleanExercises,
  };
}

async function generateAndValidateSingleSet(
  setIndex: number,
  totalSets: number,
  words: DeduplicatedTargetWord[],
  completer: AiTextCompleter,
  signal?: AbortSignal
): Promise<VocabeeTestSet> {
  const targetWordStrings = words.map((w) => w.word);
  const plan = planExerciseWordAssignments(words);

  const [partA, partB] = await Promise.all([
    generatePartAWithRepair(setIndex, totalSets, words, plan, completer, signal),
    generatePartBWithRepair(setIndex, totalSets, words, plan, completer, signal),
  ]);

  const assembledSet: VocabeeTestSet = {
    id: `set-${setIndex + 1}`,
    label: partA.label,
    words: targetWordStrings,
    exercises: [
      partA.matching,
      partB.sentence_completion,
      partA.synonyms_matching,
      partB.cloze_test,
    ],
  };

  const finalCheck = validateGeneratedSetSemantics(
    assembledSet,
    targetWordStrings,
    setIndex
  );

  if (!finalCheck.valid) {
    const summaryMsg = finalCheck.errors
      .slice(0, 3)
      .map((e) => e.message)
      .join("; ");
    throw new AIValidationError(
      `AI không thể tạo bộ bài tập hợp lệ cho Set ${setIndex + 1} sau nhiều lần kiểm tra: ${summaryMsg}`
    );
  }

  return finalCheck.data;
}

export interface GeneratePersonalTestOptions {
  title: string;
  targetWords: DeduplicatedTargetWord[];
  signal?: AbortSignal;
  completer?: AiTextCompleter;
}

/**
 * Generates a complete, strictly validated `vocabee-test-v1` test from deduplicated user-selected words.
 */
export async function generatePersonalTestWithAI(
  options: GeneratePersonalTestOptions
): Promise<VocabeeTest> {
  const { title, targetWords, signal, completer = defaultAiCompleter } = options;

  if (targetWords.length < 2) {
    throw new AIValidationError(
      "Cần ít nhất 2 từ vựng duy nhất để tạo bài kiểm tra đầy đủ 4 dạng bài tập."
    );
  }

  const wordBuckets = distributeWordsIntoSets(targetWords);
  const totalSets = wordBuckets.length;

  const generatedSets: VocabeeTestSet[] = [];
  for (let i = 0; i < totalSets; i++) {
    const generatedSet = await generateAndValidateSingleSet(
      i,
      totalSets,
      wordBuckets[i],
      completer,
      signal
    );
    generatedSets.push(generatedSet);
  }

  const assembledTest: VocabeeTest = {
    schema: "vocabee-test-v1",
    title: title.trim(),
    total_words: targetWords.length,
    total_sets: generatedSets.length,
    sets: generatedSets,
  };

  const finalValidation = validateVocabeeTestJson(assembledTest);
  if (!finalValidation.valid) {
    const msg = finalValidation.errors.map((e) => e.message).join("; ");
    throw new AIValidationError(
      `Bài kiểm tra tạo ra không đạt kiểm duyệt cuối cùng: ${msg}`
    );
  }

  return finalValidation.data;
}
