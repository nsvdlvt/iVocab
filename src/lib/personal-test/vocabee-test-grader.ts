import {
  VocabeeTest,
  OverallGradingResult,
  GradedQuestionResult,
  SetPerformanceSummary,
  ExercisePerformanceSummary,
  ExerciseType,
} from "@/types/vocabee-test";

/**
 * Normalizes user answer and correct answer for safe and fair comparison.
 * - Trims whitespace
 * - Collapses consecutive spaces
 * - Lowercases
 * - Strips trivial punctuation like trailing periods
 */
export function normalizeAnswer(val: unknown): string {
  if (typeof val !== "string") {
    if (val === null || val === undefined) return "";
    return String(val).trim().toLowerCase();
  }
  return val
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[.,;!?]+$/, "");
}

/**
 * Creates a unique question key for an exercise item to index answers deterministically.
 */
export function getQuestionKey(
  setIndex: number,
  exerciseIndex: number,
  exerciseType: ExerciseType,
  itemId: number
): string {
  return `s${setIndex}_e${exerciseIndex}_${exerciseType}_${itemId}`;
}

/**
 * Evaluates a single question answer against the authoritative test content.
 */
export function checkSingleAnswer(
  exerciseType: ExerciseType,
  userAnswer: string | undefined,
  correctAnswer: string | string[]
): boolean {
  if (!userAnswer) return false;
  const normUser = normalizeAnswer(userAnswer);

  if (Array.isArray(correctAnswer)) {
    // If correct answer is a list of synonyms (e.g. ["alleviate", "lessen"])
    // Match either the joined format "alleviate, lessen" or any of the exact matches
    const joined = normalizeAnswer(correctAnswer.join(", "));
    if (normUser === joined) return true;
    const sortedJoined = normalizeAnswer([...correctAnswer].sort().join(", "));
    const sortedUser = normUser.split(",").map((s) => s.trim()).sort().join(", ");
    if (sortedUser === sortedJoined) return true;
    return correctAnswer.some((ans) => normalizeAnswer(ans) === normUser);
  }

  if (typeof correctAnswer === "string" && /\s[\/|]\s/.test(correctAnswer)) {
    const acceptedVariants = correctAnswer
      .split(/\s[\/|]\s/)
      .map((v) => normalizeAnswer(v))
      .filter(Boolean);
    if (acceptedVariants.length > 0) {
      return acceptedVariants.includes(normUser);
    }
  }

  return normUser === normalizeAnswer(correctAnswer);
}

/**
 * Grades the entire test attempt on the server side using the authoritative test content.
 * Guarantees that score, accuracy, and explanations are derived strictly from verified content.
 */
export function gradeVocabeeTest(
  testContent: VocabeeTest,
  userAnswers: Record<string, string>
): OverallGradingResult {
  const questionResults: GradedQuestionResult[] = [];
  const setSummariesMap = new Map<number, { setLabel: string; total: number; correct: number }>();
  const exerciseSummariesMap = new Map<ExerciseType, { total: number; correct: number }>();

  // Initialize exercise maps
  const exerciseTypes: ExerciseType[] = [
    "matching",
    "sentence_completion",
    "synonyms_matching",
    "cloze_test",
  ];
  exerciseTypes.forEach((t) => {
    exerciseSummariesMap.set(t, { total: 0, correct: 0 });
  });

  testContent.sets.forEach((set, setIndex) => {
    if (!setSummariesMap.has(setIndex)) {
      setSummariesMap.set(setIndex, {
        setLabel: set.label || `Set ${setIndex + 1}`,
        total: 0,
        correct: 0,
      });
    }
    const setStat = setSummariesMap.get(setIndex)!;

    set.exercises.forEach((exercise, exerciseIndex) => {
      const exStat = exerciseSummariesMap.get(exercise.type)!;

      if (exercise.type === "matching") {
        exercise.items.forEach((item) => {
          const key = getQuestionKey(setIndex, exerciseIndex, "matching", item.id);
          const userAns = userAnswers[key] || "";
          const isCorrect = checkSingleAnswer("matching", userAns, item.definition);

          setStat.total += 1;
          exStat.total += 1;
          if (isCorrect) {
            setStat.correct += 1;
            exStat.correct += 1;
          }

          questionResults.push({
            questionKey: key,
            setIndex,
            setLabel: set.label,
            exerciseType: "matching",
            itemId: item.id,
            prompt: `Từ: "${item.word}"`,
            userAnswer: userAns,
            correctAnswer: item.definition,
            isCorrect,
            explanation: item.explanation,
          });
        });
      } else if (exercise.type === "sentence_completion") {
        exercise.items.forEach((item) => {
          const key = getQuestionKey(setIndex, exerciseIndex, "sentence_completion", item.id);
          const userAns = userAnswers[key] || "";
          const isCorrect = checkSingleAnswer("sentence_completion", userAns, item.answer);

          setStat.total += 1;
          exStat.total += 1;
          if (isCorrect) {
            setStat.correct += 1;
            exStat.correct += 1;
          }

          questionResults.push({
            questionKey: key,
            setIndex,
            setLabel: set.label,
            exerciseType: "sentence_completion",
            itemId: item.id,
            prompt: item.sentence,
            userAnswer: userAns,
            correctAnswer: item.answer,
            isCorrect,
            explanation: item.explanation,
          });
        });
      } else if (exercise.type === "synonyms_matching") {
        exercise.items.forEach((item) => {
          const key = getQuestionKey(setIndex, exerciseIndex, "synonyms_matching", item.id);
          const userAns = userAnswers[key] || "";
          const isCorrect = checkSingleAnswer("synonyms_matching", userAns, item.synonyms);

          setStat.total += 1;
          exStat.total += 1;
          if (isCorrect) {
            setStat.correct += 1;
            exStat.correct += 1;
          }

          questionResults.push({
            questionKey: key,
            setIndex,
            setLabel: set.label,
            exerciseType: "synonyms_matching",
            itemId: item.id,
            prompt: `Từ đồng nghĩa của "${item.word}"`,
            userAnswer: userAns,
            correctAnswer: item.synonyms.join(", "),
            isCorrect,
            explanation: item.explanation,
          });
        });
      } else if (exercise.type === "cloze_test") {
        exercise.answers.forEach((ans) => {
          const key = getQuestionKey(setIndex, exerciseIndex, "cloze_test", ans.id);
          const userAns = userAnswers[key] || "";
          const isCorrect = checkSingleAnswer("cloze_test", userAns, ans.answer);

          setStat.total += 1;
          exStat.total += 1;
          if (isCorrect) {
            setStat.correct += 1;
            exStat.correct += 1;
          }

          questionResults.push({
            questionKey: key,
            setIndex,
            setLabel: set.label,
            exerciseType: "cloze_test",
            itemId: ans.id,
            prompt: `Ô trống __(${ans.id})__ trong đoạn văn`,
            userAnswer: userAns,
            correctAnswer: ans.answer,
            isCorrect,
            explanation: ans.explanation,
          });
        });
      }
    });
  });

  const totalQuestions = questionResults.length;
  const correctAnswers = questionResults.filter((q) => q.isCorrect).length;
  const incorrectAnswers = totalQuestions - correctAnswers;
  const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 1000) / 10 : 0;
  const accuracyPercentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

  const setSummaries: SetPerformanceSummary[] = Array.from(setSummariesMap.entries()).map(
    ([sIdx, val]) => ({
      setIndex: sIdx,
      setLabel: val.setLabel,
      totalQuestions: val.total,
      correctQuestions: val.correct,
      score: val.total > 0 ? Math.round((val.correct / val.total) * 1000) / 10 : 0,
    })
  );

  const EXERCISE_DISPLAY_NAMES: Record<ExerciseType, string> = {
    matching: "Matching (Nối từ)",
    sentence_completion: "Sentence Completion (Hoàn thành câu)",
    synonyms_matching: "Synonyms Matching (Nối từ đồng nghĩa)",
    cloze_test: "Cloze Test (Điền đoạn văn)",
  };

  const exerciseSummaries: ExercisePerformanceSummary[] = exerciseTypes.map((type) => {
    const val = exerciseSummariesMap.get(type)!;
    return {
      exerciseType: type,
      exerciseLabel: EXERCISE_DISPLAY_NAMES[type],
      totalQuestions: val.total,
      correctQuestions: val.correct,
      score: val.total > 0 ? Math.round((val.correct / val.total) * 1000) / 10 : 0,
    };
  });

  return {
    totalQuestions,
    correctAnswers,
    incorrectAnswers,
    score,
    accuracyPercentage,
    setSummaries,
    exerciseSummaries,
    questionResults,
  };
}
