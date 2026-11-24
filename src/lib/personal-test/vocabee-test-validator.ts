import { z } from "zod";
import { VocabeeTestSchema } from "./vocabee-test-schema";
import { extractClozeBlankIds } from "./vocabee-test-parser";
import type {
  VocabeeTest,
  ValidationErrorItem,
  ValidationResult,
  ExerciseType,
} from "@/types/vocabee-test";

const EXPECTED_EXERCISE_ORDER: ExerciseType[] = [
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

    // Check exercise count & order
    if (set.exercises.length !== 4) {
      errors.push({
        path: `${setPath} > exercises`,
        message: `Mỗi Set phải có đúng 4 bài tập. Hiện có: ${set.exercises.length}.`,
        expected: "4 bài tập",
        found: `${set.exercises.length} bài tập`,
        suggestion: "Đảm bảo mỗi Set có đủ 4 dạng: matching, sentence_completion, synonyms_matching, cloze_test.",
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

      // Check item IDs uniqueness & content integrity
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

          // Must have exactly one blank '___'
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
        // Detect invalid placeholder patterns like ***(N)***, __(N)__
        // Strip valid placeholders first to avoid partial matching on ___
        const passageWithoutValidBlanks = exercise.passage.replace(/___\(\d+\)___/g, "");
        const invalidPatternMatch = passageWithoutValidBlanks.match(/(?:\*{1,}\(\d+\)\*{1,}|_{1,2}\(\d+\)_{1,2})/);
        if (invalidPatternMatch) {
          errors.push({
            path: `${exercisePath} > passage`,
            message: "Phát hiện định dạng vị trí điền từ không hợp lệ.",
            expected: "___(1)___",
            found: invalidPatternMatch[0],
            suggestion: `Thay thế ký hiệu "${invalidPatternMatch[0]}" bằng định dạng chuẩn "___(N)___" (3 gạch dưới trước và sau).`,
          });
        }

        const blankIds = extractClozeBlankIds(exercise.passage);

        // Blanks count must match answers count
        if (blankIds.length !== exercise.answers.length) {
          errors.push({
            path: `${exercisePath} > passage & answers`,
            message: `Số lượng vị trí trống trong đoạn văn (${blankIds.length}) không khớp với số lượng đáp án (${exercise.answers.length}).`,
            expected: `${exercise.answers.length} vị trí trống`,
            found: `${blankIds.length} vị trí trống`,
            suggestion: `Đảm bảo số lượng placeholder ___(N)___ trong đoạn văn bằng đúng số phần tử trong answers.`,
          });
        }

        // Cloze answer IDs must match blank IDs sequence
        const answerIds = exercise.answers.map((a) => a.id);
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

        exercise.answers.forEach((ans) => {
          if (!ans.answer || ans.answer.trim() === "") {
            errors.push({
              path: `${exercisePath} > Answer ID ${ans.id}`,
              message: "Đáp án không được để trống.",
              expected: "Từ đáp án hợp lệ",
              found: '""',
              suggestion: "Điền từ đáp án chính xác.",
            });
          }
          if (!ans.explanation || ans.explanation.trim() === "") {
            errors.push({
              path: `${exercisePath} > Answer ID ${ans.id} > explanation`,
              message: "Thiếu giải thích (explanation) tiếng Việt.",
              expected: "Chuỗi giải thích",
              found: '""',
              suggestion: "Thêm giải thích cho câu hỏi cloze test này.",
            });
          }
        });
      }
    });
  });

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // Calculate question count
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
