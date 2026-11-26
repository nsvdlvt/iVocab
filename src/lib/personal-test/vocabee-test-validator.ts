import { VocabeeTestSchema, VocabeeTestSetSchema } from "./vocabee-test-schema";
import { extractClozeBlankIds } from "./vocabee-test-parser";
import type {
  VocabeeTest,
  VocabeeTestSet,
  ValidationErrorItem,
  ValidationResult,
  ExerciseType,
} from "@/types/vocabee-test";

export const EXPECTED_EXERCISE_ORDER: ExerciseType[] = [
  "matching",
  "sentence_completion",
  "synonyms_matching",
  "cloze_test",
];

const EXERCISE_NAMES: Record<ExerciseType, string> = {
  matching: "Matching (Nối từ)",
  sentence_completion: "Sentence Completion (Hoàn thành câu)",
  synonyms_matching: "Synonyms Matching (Nối từ đồng nghĩa)",
  cloze_test: "Cloze Test (Điền đoạn văn)",
};

export function normalizeTargetToken(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const IRREGULAR_FORMS_BY_BASE: Record<string, string[]> = {
  arise: ["arose", "arisen"],
  be: ["am", "is", "are", "was", "were", "been", "being"],
  bear: ["bore", "borne", "born"],
  become: ["became"],
  begin: ["began", "begun"],
  break: ["broke", "broken"],
  bring: ["brought"],
  build: ["built"],
  buy: ["bought"],
  catch: ["caught"],
  choose: ["chose", "chosen"],
  come: ["came"],
  cost: ["cost"],
  cut: ["cut"],
  deal: ["dealt"],
  do: ["did", "done", "does"],
  draw: ["drew", "drawn"],
  drive: ["drove", "driven"],
  eat: ["ate", "eaten"],
  fall: ["fell", "fallen"],
  feel: ["felt"],
  fight: ["fought"],
  find: ["found"],
  fly: ["flew", "flown"],
  forget: ["forgot", "forgotten"],
  forgive: ["forgave", "forgiven"],
  freeze: ["froze", "frozen"],
  get: ["got", "gotten"],
  give: ["gave", "given"],
  go: ["went", "gone", "goes"],
  grow: ["grew", "grown"],
  have: ["has", "had"],
  hear: ["heard"],
  hide: ["hid", "hidden"],
  hold: ["held"],
  keep: ["kept"],
  know: ["knew", "known"],
  lead: ["led"],
  leave: ["left"],
  lend: ["lent"],
  lose: ["lost"],
  make: ["made"],
  mean: ["meant"],
  meet: ["met"],
  pay: ["paid"],
  put: ["put"],
  read: ["read"],
  rise: ["rose", "risen"],
  run: ["ran"],
  say: ["said"],
  see: ["saw", "seen"],
  seek: ["sought"],
  sell: ["sold"],
  send: ["sent"],
  set: ["set"],
  shake: ["shook", "shaken"],
  show: ["showed", "shown"],
  shrink: ["shrank", "shrunk"],
  sing: ["sang", "sung"],
  sink: ["sank", "sunk"],
  sit: ["sat"],
  sleep: ["slept"],
  speak: ["spoke", "spoken"],
  spend: ["spent"],
  spread: ["spread"],
  stand: ["stood"],
  steal: ["stole", "stolen"],
  strike: ["struck", "stricken"],
  swear: ["swore", "sworn"],
  sweep: ["swept"],
  swim: ["swam", "swum"],
  take: ["took", "taken"],
  teach: ["taught"],
  tell: ["told"],
  think: ["thought"],
  throw: ["threw", "thrown"],
  understand: ["understood"],
  undergo: ["underwent", "undergone"],
  wake: ["woke", "woken"],
  wear: ["wore", "worn"],
  win: ["won"],
  withdraw: ["withdrew", "withdrawn"],
  write: ["wrote", "written"],
};

const DERIVATION_SUFFIXES = [
  "s",
  "es",
  "ed",
  "d",
  "ing",
  "er",
  "ers",
  "or",
  "ors",
  "est",
  "ly",
  "ity",
  "ties",
  "ness",
  "ment",
  "ments",
  "tion",
  "tions",
  "ation",
  "ations",
  "ition",
  "sion",
  "sions",
  "ance",
  "ence",
  "ant",
  "ent",
  "ive",
  "ively",
  "able",
  "ible",
  "al",
  "ally",
  "ful",
  "fully",
  "less",
  "ous",
  "ize",
  "izes",
  "ized",
  "izing",
  "ise",
  "ises",
  "ised",
  "ising",
  "en",
  "ens",
  "ened",
  "ening",
];

/**
 * Checks whether an answer form matches one of the allowed base words
 * (exact match, irregular verb inflection, or valid English morphological/derivational inflection).
 */
export function resolveAnswerToTargetWord(
  answer: string,
  targetWords: string[]
): string | null {
  const normAns = normalizeTargetToken(answer);
  if (!normAns) return null;

  // 1. Exact match first
  for (const target of targetWords) {
    if (normalizeTargetToken(target) === normAns) {
      return target;
    }
  }

  // 2. Irregular verb & inflection/derivation match
  for (const target of targetWords) {
    const base = normalizeTargetToken(target);
    if (!base) continue;

    if (base.includes(" ")) {
      const parts = base.split(" ");
      if (parts.length > 1) {
        const firstWordInflected = new RegExp(
          `^${escapeRegExp(parts[0])}(?:s|es|ed|d|ing)?\\s+${parts.slice(1).map(escapeRegExp).join("\\s+")}$`,
          "i"
        );
        if (firstWordInflected.test(normAns)) return target;
      }
      continue;
    }

    const candidates = new Set<string>([base]);
    for (const irr of IRREGULAR_FORMS_BY_BASE[base] ?? []) {
      candidates.add(irr);
    }

    for (const suffix of DERIVATION_SUFFIXES) {
      candidates.add(`${base}${suffix}`);
    }

    if (base.endsWith("e")) {
      const stem = base.slice(0, -1);
      for (const suffix of DERIVATION_SUFFIXES) {
        candidates.add(`${stem}${suffix}`);
      }
    }
    if (base.endsWith("ate") && base.length > 4) {
      const stem = base.slice(0, -3);
      for (const suffix of [
        "ation",
        "ations",
        "ion",
        "ions",
        "ative",
        "atively",
        "ator",
        "ators",
        "able",
        "ory",
      ]) {
        candidates.add(`${stem}${suffix}`);
      }
    }
    if (base.endsWith("yze") || base.endsWith("yse")) {
      const root = base.slice(0, -3);
      candidates.add(`${root}ysis`);
      candidates.add(`${root}ytic`);
      candidates.add(`${root}ytical`);
      candidates.add(`${root}ytically`);
    }
    if (base.endsWith("y") && base.length > 2) {
      const stem = base.slice(0, -1);
      for (const suffix of [
        "ies",
        "ied",
        "ier",
        "iest",
        "ily",
        "iness",
        "ication",
        "ications",
      ]) {
        candidates.add(`${stem}${suffix}`);
      }
    }
    if (base.endsWith("ic")) {
      candidates.add(`${base}ally`);
      candidates.add(`${base}al`);
    }
    if (base.length >= 3) {
      const lastChar = base[base.length - 1];
      if (!/[aeiouwxy]/.test(lastChar)) {
        candidates.add(`${base}${lastChar}ed`);
        candidates.add(`${base}${lastChar}ing`);
        candidates.add(`${base}${lastChar}er`);
        candidates.add(`${base}${lastChar}est`);
      }
    }

    if (candidates.has(normAns)) {
      return target;
    }
  }

  return null;
}

/**
 * Checks whether a matching definition leaks the target word or an obvious inflected form.
 */
export function definitionContainsTargetWord(definition: string, targetWord: string): boolean {
  const normDef = definition.toLowerCase();
  const base = normalizeTargetToken(targetWord);
  if (!base) return false;

  // Exact word/phrase boundary check
  const exactRegex = new RegExp(`\\b${escapeRegExp(base)}\\b`, "i");
  if (exactRegex.test(normDef)) return true;

  // Inflection leak check for single words
  if (!base.includes(" ") && base.length >= 4) {
    const stem = base.endsWith("e") || base.endsWith("y") ? base.slice(0, -1) : base;
    if (stem.length >= 4) {
      const inflectionRegex = new RegExp(
        `\\b${escapeRegExp(stem)}(?:s|es|ed|ing|er|est|ly|ies|ied)?\\b`,
        "i"
      );
      if (inflectionRegex.test(normDef)) return true;
    }
  }

  return false;
}

function validateClozeExerciseSemantics(
  exercisePath: string,
  passage: string,
  answers: Array<{ id: number; answer: string; explanation: string }>,
  wordBank: string[],
  errors: ValidationErrorItem[]
) {
  // Detect invalid placeholder patterns like ***(N)***, __(N)__, [N], or bare (N) used as a blank
  const passageWithoutValidBlanks = passage.replace(/___\(\d+\)___/g, "");
  const invalidPatternMatch = passageWithoutValidBlanks.match(
    /(?:\*{1,}\(\d+\)\*{1,}|_{1,2}\(\d+\)_{1,2}|_{4,}\(\d+\)_{1,}|_{1,}\(\d+\)_{4,})/
  );
  if (invalidPatternMatch) {
    errors.push({
      path: `${exercisePath} > passage`,
      message: "Phát hiện định dạng vị trí điền từ không hợp lệ.",
      expected: "___(1)___",
      found: invalidPatternMatch[0],
      suggestion: `Thay thế ký hiệu "${invalidPatternMatch[0]}" bằng định dạng chuẩn "___(N)___" (3 gạch dưới trước và sau).`,
    });
  }

  const blankIds = extractClozeBlankIds(passage);

  // Blanks count must match answers count
  if (blankIds.length !== answers.length) {
    errors.push({
      path: `${exercisePath} > passage & answers`,
      message: `Số lượng vị trí trống trong đoạn văn (${blankIds.length}) không khớp với số lượng đáp án (${answers.length}).`,
      expected: `${answers.length} vị trí trống`,
      found: `${blankIds.length} vị trí trống`,
      suggestion: `Đảm bảo số lượng placeholder ___(N)___ trong đoạn văn bằng đúng số phần tử trong answers.`,
    });
  }

  // Check duplicate answer IDs
  const seenAnswerIds = new Set<number>();
  for (const ans of answers) {
    if (seenAnswerIds.has(ans.id)) {
      errors.push({
        path: `${exercisePath} > answers`,
        message: `ID đáp án ${ans.id} bị trùng lặp trong Cloze Test.`,
        expected: "ID duy nhất",
        found: String(ans.id),
      });
    }
    seenAnswerIds.add(ans.id);
  }

  // Check duplicate blank IDs in passage
  const seenBlankIds = new Set<number>();
  for (const bId of blankIds) {
    if (seenBlankIds.has(bId)) {
      errors.push({
        path: `${exercisePath} > passage`,
        message: `Ô trống ___(${bId})___ bị lặp lại trong đoạn văn Cloze Test.`,
        expected: "Mỗi ô trống chỉ xuất hiện 1 lần",
        found: `___(${bId})___`,
      });
    }
    seenBlankIds.add(bId);
  }

  // Cloze answer IDs must match blank IDs sequence
  const answerIds = answers.map((a) => a.id);
  const sortedBlankIds = [...blankIds].sort((a, b) => a - b);
  const sortedAnswerIds = [...answerIds].sort((a, b) => a - b);

  for (let i = 0; i < sortedBlankIds.length; i++) {
    if (sortedBlankIds[i] !== sortedAnswerIds[i]) {
      errors.push({
        path: `${exercisePath} > answers`,
        message: `ID của đáp án (${sortedAnswerIds[i]}) không khớp với vị trí ô trống __(${sortedBlankIds[i]})__ trong đoạn văn.`,
        expected: `ID = ${sortedBlankIds[i]}`,
        found: `ID = ${sortedAnswerIds[i] ?? "thiếu"}`,
        suggestion: `Đặt ID của answer khớp chính xác với chỉ số ô trống ___(N)___ trong đoạn văn.`,
      });
      break;
    }
  }

  // Blank IDs must start at 1 and increase sequentially 1..N
  for (let i = 0; i < blankIds.length; i++) {
    if (blankIds[i] !== i + 1) {
      errors.push({
        path: `${exercisePath} > passage`,
        message: `Thứ tự ô trống trong đoạn văn phải bắt đầu từ 1 và tăng tuần tự (___(1)___, ___(2)___, ...).`,
        expected: `___(${i + 1})___`,
        found: `___(${blankIds[i]})___`,
      });
      break;
    }
  }

  for (const ans of answers) {
    if (!ans.answer || ans.answer.trim() === "") {
      errors.push({
        path: `${exercisePath} > Answer ID ${ans.id}`,
        message: "Đáp án không được để trống.",
        expected: "Từ đáp án hợp lệ",
        found: '""',
      });
    } else if (wordBank.length > 0 && !resolveAnswerToTargetWord(ans.answer, wordBank)) {
      errors.push({
        path: `${exercisePath} > Answer ID ${ans.id}`,
        message: `Đáp án "${ans.answer}" không có dạng gốc tương ứng trong word_bank.`,
        expected: `Một từ thuộc word_bank (${wordBank.join(", ")})`,
        found: ans.answer,
      });
    }

    if (!ans.explanation || ans.explanation.trim() === "") {
      errors.push({
        path: `${exercisePath} > Answer ID ${ans.id} > explanation`,
        message: "Thiếu giải thích (explanation) tiếng Việt.",
        expected: "Chuỗi giải thích",
        found: '""',
      });
    }
  }
}

/**
 * Validates a single generated VocabeeTestSet against strict schema + semantic + coverage rules.
 */
export function validateGeneratedSetSemantics(
  rawSet: unknown,
  expectedTargetWords: string[],
  setIndex = 0
): { valid: true; data: VocabeeTestSet } | { valid: false; errors: ValidationErrorItem[] } {
  const errors: ValidationErrorItem[] = [];
  const zodResult = VocabeeTestSetSchema.safeParse(rawSet);

  if (!zodResult.success) {
    for (const issue of zodResult.error.issues) {
      const pathString = issue.path.join(" > ") || `sets[${setIndex}]`;
      errors.push({
        path: pathString,
        message: issue.message,
        expected: "Hợp lệ theo schema vocabee-test-v1",
        found: issue.code,
      });
    }
    return { valid: false, errors };
  }

  const set = zodResult.data as VocabeeTestSet;
  const setPath = `Set ${setIndex + 1} (${set.label || set.id})`;
  const normalizedExpected = expectedTargetWords.map((w) => normalizeTargetToken(w));
  const expectedSet = new Set(normalizedExpected);

  // Verify set.words matches expectedTargetWords without fabricated or missing words
  const actualWordsNorm = new Set(set.words.map((w) => normalizeTargetToken(w)));
  for (const w of set.words) {
    if (!expectedSet.has(normalizeTargetToken(w))) {
      errors.push({
        path: `${setPath} > words`,
        message: `Từ "${w}" không nằm trong danh sách từ vựng được chọn cho Set này.`,
        expected: expectedTargetWords.join(", "),
        found: w,
      });
    }
  }
  for (const w of expectedTargetWords) {
    if (!actualWordsNorm.has(normalizeTargetToken(w))) {
      errors.push({
        path: `${setPath} > words`,
        message: `Thiếu từ vựng được chọn "${w}" trong trường words của Set.`,
        expected: w,
      });
    }
  }

  // Verify exercise order
  set.exercises.forEach((exercise, exerciseIndex) => {
    const expectedType = EXPECTED_EXERCISE_ORDER[exerciseIndex];
    if (exercise.type !== expectedType) {
      errors.push({
        path: `${setPath} > exercises[${exerciseIndex}]`,
        message: `Thứ tự bài tập phải là "${expectedType}", tìm thấy "${exercise.type}".`,
        expected: expectedType,
        found: exercise.type,
      });
    }
  });

  // Track exercise appearances per target word (normalized)
  const coverageMap = new Map<string, Set<ExerciseType>>();
  for (const w of expectedTargetWords) {
    coverageMap.set(normalizeTargetToken(w), new Set<ExerciseType>());
  }

  const markCovered = (targetWord: string, exType: ExerciseType) => {
    const key = normalizeTargetToken(targetWord);
    coverageMap.get(key)?.add(exType);
  };

  for (let exIdx = 0; exIdx < set.exercises.length; exIdx++) {
    const exercise = set.exercises[exIdx];
    const exPath = `${setPath} > ${EXERCISE_NAMES[exercise.type]}`;

    if (exercise.type === "matching") {
      const ids = new Set<number>();
      const seenWords = new Set<string>();
      exercise.items.forEach((item, idx) => {
        if (ids.has(item.id)) {
          errors.push({
            path: `${exPath} > items[${idx}]`,
            message: `ID ${item.id} bị trùng lặp trong Matching.`,
          });
        }
        if (item.id !== idx + 1) {
          errors.push({
            path: `${exPath} > items[${idx}]`,
            message: `ID trong Matching phải tăng tuần tự từ 1 (kỳ vọng ${idx + 1}, nhận được ${item.id}).`,
          });
        }
        ids.add(item.id);

        const matchedTarget = resolveAnswerToTargetWord(item.word, expectedTargetWords);
        if (!matchedTarget || normalizeTargetToken(item.word) !== normalizeTargetToken(matchedTarget)) {
          errors.push({
            path: `${exPath} > items[${idx}] > word`,
            message: `Từ "${item.word}" trong Matching không thuộc danh sách từ được chọn.`,
            expected: expectedTargetWords.join(", "),
            found: item.word,
          });
        } else {
          const norm = normalizeTargetToken(matchedTarget);
          if (seenWords.has(norm)) {
            errors.push({
              path: `${exPath} > items[${idx}] > word`,
              message: `Từ "${item.word}" xuất hiện nhiều lần trong bài tập Matching.`,
            });
          }
          seenWords.add(norm);
          markCovered(matchedTarget, "matching");
        }

        if (definitionContainsTargetWord(item.definition, item.word)) {
          errors.push({
            path: `${exPath} > items[${idx}] > definition`,
            message: `Định nghĩa của "${item.word}" không được chứa từ mục tiêu hoặc biến thể lộ đáp án.`,
            found: item.definition,
          });
        }
      });
    } else if (exercise.type === "sentence_completion") {
      const ids = new Set<number>();
      for (const wb of exercise.word_bank) {
        if (!expectedSet.has(normalizeTargetToken(wb))) {
          errors.push({
            path: `${exPath} > word_bank`,
            message: `Từ "${wb}" trong word_bank của Sentence Completion không thuộc từ vựng được chọn.`,
          });
        }
      }

      exercise.items.forEach((item, idx) => {
        if (ids.has(item.id)) {
          errors.push({
            path: `${exPath} > items[${idx}]`,
            message: `ID ${item.id} bị trùng lặp trong Sentence Completion.`,
          });
        }
        if (item.id !== idx + 1) {
          errors.push({
            path: `${exPath} > items[${idx}]`,
            message: `ID trong Sentence Completion phải tăng tuần tự từ 1.`,
          });
        }
        ids.add(item.id);

        const blankMatches = item.sentence.match(/___/g) || [];
        const anyLongBlanks = item.sentence.match(/_{3,}/g) || [];
        if (blankMatches.length !== 1 || anyLongBlanks.length !== 1) {
          errors.push({
            path: `${exPath} > items[${idx}] > sentence`,
            message: `Mỗi câu Sentence Completion phải có chính xác 1 chỗ trống "___".`,
            expected: 'Chính xác một "___"',
            found: item.sentence,
          });
        }

        const matchedTarget = resolveAnswerToTargetWord(item.answer, expectedTargetWords);
        if (!matchedTarget) {
          errors.push({
            path: `${exPath} > items[${idx}] > answer`,
            message: `Đáp án "${item.answer}" không khớp với bất kỳ từ mục tiêu nào được chọn.`,
          });
        } else {
          markCovered(matchedTarget, "sentence_completion");
          if (!resolveAnswerToTargetWord(item.answer, exercise.word_bank)) {
            errors.push({
              path: `${exPath} > items[${idx}] > answer`,
              message: `Đáp án "${item.answer}" không có dạng gốc trong word_bank.`,
            });
          }
        }
      });
    } else if (exercise.type === "synonyms_matching") {
      const ids = new Set<number>();
      const seenWords = new Set<string>();
      exercise.items.forEach((item, idx) => {
        if (ids.has(item.id)) {
          errors.push({
            path: `${exPath} > items[${idx}]`,
            message: `ID ${item.id} bị trùng lặp trong Synonyms Matching.`,
          });
        }
        if (item.id !== idx + 1) {
          errors.push({
            path: `${exPath} > items[${idx}]`,
            message: `ID trong Synonyms Matching phải tăng tuần tự từ 1.`,
          });
        }
        ids.add(item.id);

        const matchedTarget = resolveAnswerToTargetWord(item.word, expectedTargetWords);
        if (!matchedTarget || normalizeTargetToken(item.word) !== normalizeTargetToken(matchedTarget)) {
          errors.push({
            path: `${exPath} > items[${idx}] > word`,
            message: `Từ "${item.word}" trong Synonyms Matching không thuộc từ vựng được chọn.`,
          });
        } else {
          const norm = normalizeTargetToken(matchedTarget);
          if (seenWords.has(norm)) {
            errors.push({
              path: `${exPath} > items[${idx}] > word`,
              message: `Từ "${item.word}" bị lặp trong Synonyms Matching.`,
            });
          }
          seenWords.add(norm);
          markCovered(matchedTarget, "synonyms_matching");
        }

        for (const syn of item.synonyms) {
          if (normalizeTargetToken(syn) === normalizeTargetToken(item.word)) {
            errors.push({
              path: `${exPath} > items[${idx}] > synonyms`,
              message: `Từ đồng nghĩa "${syn}" không được trùng với chính từ gốc "${item.word}".`,
            });
          }
        }
      });
    } else if (exercise.type === "cloze_test") {
      for (const wb of exercise.word_bank) {
        if (!expectedSet.has(normalizeTargetToken(wb))) {
          errors.push({
            path: `${exPath} > word_bank`,
            message: `Từ "${wb}" trong word_bank của Cloze Test không thuộc từ vựng được chọn.`,
          });
        }
      }

      validateClozeExerciseSemantics(
        exPath,
        exercise.passage,
        exercise.answers,
        exercise.word_bank,
        errors
      );

      for (const ans of exercise.answers) {
        const matchedTarget = resolveAnswerToTargetWord(ans.answer, expectedTargetWords);
        if (!matchedTarget) {
          errors.push({
            path: `${exPath} > answers (id: ${ans.id})`,
            message: `Đáp án Cloze "${ans.answer}" không khớp với bất kỳ từ mục tiêu nào được chọn.`,
          });
        } else {
          markCovered(matchedTarget, "cloze_test");
        }
      }
    }
  }

  // Coverage check: every target word in set must appear in at least 2 of the 4 exercise types
  for (const w of expectedTargetWords) {
    const coveredTypes = coverageMap.get(normalizeTargetToken(w));
    const count = coveredTypes ? coveredTypes.size : 0;
    if (count < 2) {
      errors.push({
        path: `${setPath} > coverage (${w})`,
        message: `Từ "${w}" chỉ xuất hiện trong ${count}/4 dạng bài tập. Mỗi từ phải xuất hiện trong ít nhất 2 dạng bài tập khác nhau.`,
        expected: ">= 2 dạng bài tập",
        found: `${count} dạng (${coveredTypes ? Array.from(coveredTypes).join(", ") : "none"})`,
      });
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, data: set };
}

export function validateVocabeeTestJson(rawInput: unknown): ValidationResult {
  const errors: ValidationErrorItem[] = [];

  // Step 1: Zod Schema Validation
  const zodResult = VocabeeTestSchema.safeParse(rawInput);

  if (!zodResult.success) {
    for (const issue of zodResult.error.issues) {
      const pathString = issue.path.join(" > ") || "root";
      errors.push({
        path: pathString,
        message: issue.message,
        expected: "Hợp lệ theo schema vocabee-test-v1",
        found: issue.code,
        suggestion: `Kiểm tra lại định dạng hoặc giá trị của trường "${pathString}".`,
      });
    }
    return { valid: false, errors };
  }

  const data: VocabeeTest = zodResult.data as VocabeeTest;

  // Step 2: Semantic Validation

  // 2.1 Total sets count check
  if (data.total_sets !== data.sets.length) {
    errors.push({
      path: "total_sets",
      message: `Giá trị total_sets (${data.total_sets}) không khớp với số lượng Set thực tế (${data.sets.length}).`,
      expected: String(data.sets.length),
      found: String(data.total_sets),
      suggestion: `Cập nhật lại "total_sets": ${data.sets.length}`,
    });
  }

  // 2.2 Total words check (unique words across all sets)
  const allSetWords = data.sets.flatMap((s) => s.words.map((w) => w.trim().toLowerCase()));
  const uniqueWords = new Set(allSetWords);
  if (data.total_words !== uniqueWords.size) {
    errors.push({
      path: "total_words",
      message: `Giá trị total_words (${data.total_words}) không khớp với tổng số từ vựng duy nhất (${uniqueWords.size}).`,
      expected: String(uniqueWords.size),
      found: String(data.total_words),
      suggestion: `Cập nhật lại "total_words": ${uniqueWords.size}`,
    });
  }

  // 2.3 Set IDs uniqueness
  const setIds = new Set<string>();
  data.sets.forEach((set, index) => {
    if (setIds.has(set.id)) {
      errors.push({
        path: `sets[${index}] (${set.label}) > id`,
        message: `Set ID "${set.id}" bị trùng lặp. Mỗi Set phải có một ID duy nhất.`,
        expected: "ID duy nhất",
        found: set.id,
        suggestion: `Thay đổi ID của Set "${set.label}" thành một mã định danh duy nhất (ví dụ: "set_${index + 1}").`,
      });
    }
    setIds.add(set.id);
  });

  // 2.4 Deep Set & Exercise Inspections
  data.sets.forEach((set, setIndex) => {
    const setPath = `Set ${setIndex + 1} (${set.label || set.id})`;

    if (set.exercises.length !== 4) {
      errors.push({
        path: `${setPath} > exercises`,
        message: `Mỗi Set phải có đúng 4 bài tập. Hiện có: ${set.exercises.length}.`,
        expected: "4 bài tập",
        found: `${set.exercises.length} bài tập`,
        suggestion:
          "Đảm bảo mỗi Set có đủ 4 dạng: matching, sentence_completion, synonyms_matching, cloze_test.",
      });
      return;
    }

    set.exercises.forEach((exercise, exerciseIndex) => {
      const expectedType = EXPECTED_EXERCISE_ORDER[exerciseIndex];
      const actualType = exercise.type;
      const exercisePath = `${setPath} > Bài tập ${exerciseIndex + 1} (${EXERCISE_NAMES[actualType] || actualType})`;

      // Verify exercise order
      if (actualType !== expectedType) {
        errors.push({
          path: `${setPath} > exercises[${exerciseIndex}]`,
          message: `Thứ tự bài tập không đúng quy chuẩn. Vị trí này phải là "${expectedType}".`,
          expected: `"${expectedType}" (${EXERCISE_NAMES[expectedType]})`,
          found: `"${actualType}"`,
          suggestion: `Sắp xếp bài tập theo đúng thứ tự: 1. matching -> 2. sentence_completion -> 3. synonyms_matching -> 4. cloze_test.`,
        });
      }

      if (actualType === "matching") {
        const itemIds = new Set<number>();
        exercise.items.forEach((item, itemIndex) => {
          if (itemIds.has(item.id)) {
            errors.push({
              path: `${exercisePath} > Item ${itemIndex + 1} (id: ${item.id})`,
              message: `ID câu hỏi ${item.id} bị trùng lặp trong bài tập Matching.`,
              expected: "ID duy nhất",
              found: String(item.id),
              suggestion: "Đảm bảo mỗi item có một ID số nguyên duy nhất.",
            });
          }
          itemIds.add(item.id);

          if (!item.explanation || item.explanation.trim() === "") {
            errors.push({
              path: `${exercisePath} > Item ${item.id} (${item.word}) > explanation`,
              message: "Thiếu phần giải thích (explanation) tiếng Việt.",
              expected: "Chuỗi giải thích có nghĩa",
              found: '""',
              suggestion: "Thêm giải thích chi tiết cho từ vựng này.",
            });
          }
        });
      } else if (actualType === "sentence_completion") {
        const itemIds = new Set<number>();
        exercise.items.forEach((item, itemIndex) => {
          if (itemIds.has(item.id)) {
            errors.push({
              path: `${exercisePath} > Item ${itemIndex + 1} (id: ${item.id})`,
              message: `ID câu hỏi ${item.id} bị trùng lặp trong bài tập Sentence Completion.`,
              expected: "ID duy nhất",
              found: String(item.id),
              suggestion: "Đảm bảo mỗi item có một ID số nguyên duy nhất.",
            });
          }
          itemIds.add(item.id);

          const blankMatches = item.sentence.match(/_{3,}/g) || [];
          if (blankMatches.length === 0) {
            errors.push({
              path: `${exercisePath} > Item ${item.id} > sentence`,
              message: 'Câu hỏi thiếu vị trí trống "___". Mỗi câu phải có chính xác một vị trí "___".',
              expected: 'Có đúng một "___"',
              found: "Không tìm thấy placeholder",
              suggestion: `Thêm "___" vào vị trí cần điền trong câu: "${item.sentence}"`,
            });
          } else if (blankMatches.length > 1) {
            errors.push({
              path: `${exercisePath} > Item ${item.id} > sentence`,
              message: `Tìm thấy ${blankMatches.length} vị trí trống trong cùng một câu. Mỗi câu chỉ được có một "___".`,
              expected: 'Chính xác một "___"',
              found: `${blankMatches.length} vị trí trống`,
              suggestion: 'Giữ lại đúng 1 vị trí trống "___" cho câu hỏi này.',
            });
          }

          if (!item.answer || item.answer.trim() === "") {
            errors.push({
              path: `${exercisePath} > Item ${item.id} > answer`,
              message: "Đáp án không được để trống.",
              expected: "Từ đáp án hợp lệ",
              found: '""',
              suggestion: "Cung cấp đáp án chính xác từ word_bank.",
            });
          }

          if (!item.explanation || item.explanation.trim() === "") {
            errors.push({
              path: `${exercisePath} > Item ${item.id} > explanation`,
              message: "Thiếu giải thích (explanation) tiếng Việt.",
              expected: "Chuỗi giải thích",
              found: '""',
              suggestion: "Thêm giải thích lý do chọn đáp án này.",
            });
          }
        });
      } else if (actualType === "synonyms_matching") {
        const itemIds = new Set<number>();
        exercise.items.forEach((item, itemIndex) => {
          if (itemIds.has(item.id)) {
            errors.push({
              path: `${exercisePath} > Item ${itemIndex + 1} (id: ${item.id})`,
              message: `ID câu hỏi ${item.id} bị trùng lặp trong bài tập Synonyms Matching.`,
              expected: "ID duy nhất",
              found: String(item.id),
              suggestion: "Đảm bảo mỗi item có một ID số nguyên duy nhất.",
            });
          }
          itemIds.add(item.id);

          if (!item.synonyms || item.synonyms.length === 0) {
            errors.push({
              path: `${exercisePath} > Item ${item.id} (${item.word}) > synonyms`,
              message: "Danh sách từ đồng nghĩa không được để trống (tối thiểu 1, tối đa 2 từ).",
              expected: "1 đến 2 từ đồng nghĩa",
              found: "0 từ",
              suggestion: 'Thêm ít nhất 1 từ đồng nghĩa vào mảng synonyms (ví dụ: ["alleviate"]).',
            });
          }

          if (!item.explanation || item.explanation.trim() === "") {
            errors.push({
              path: `${exercisePath} > Item ${item.id} (${item.word}) > explanation`,
              message: "Thiếu giải thích (explanation) tiếng Việt.",
              expected: "Chuỗi giải thích",
              found: '""',
              suggestion: "Thêm giải thích sắc thái từ đồng nghĩa.",
            });
          }
        });
      } else if (actualType === "cloze_test") {
        validateClozeExerciseSemantics(
          exercisePath,
          exercise.passage,
          exercise.answers,
          exercise.word_bank,
          errors
        );
      }
    });
  });

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  let totalExercises = 0;
  let totalQuestions = 0;

  data.sets.forEach((set) => {
    totalExercises += set.exercises.length;
    set.exercises.forEach((ex) => {
      if (ex.type === "matching") {
        totalQuestions += ex.items.length;
      } else if (ex.type === "sentence_completion") {
        totalQuestions += ex.items.length;
      } else if (ex.type === "synonyms_matching") {
        totalQuestions += ex.items.length;
      } else if (ex.type === "cloze_test") {
        totalQuestions += ex.answers.length;
      }
    });
  });

  return {
    valid: true,
    data,
    summary: {
      title: data.title,
      totalWords: data.total_words,
      totalSets: data.total_sets,
      totalExercises,
      totalQuestions,
    },
  };
}
