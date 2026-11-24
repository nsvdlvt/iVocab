export type ExerciseType =
  | "matching"
  | "sentence_completion"
  | "synonyms_matching"
  | "cloze_test";

export interface MatchingItem {
  id: number;
  word: string;
  definition: string;
  explanation: string;
}

export interface MatchingExercise {
  type: "matching";
  items: MatchingItem[];
}

export interface SentenceCompletionItem {
  id: number;
  sentence: string;
  answer: string;
  explanation: string;
}

export interface SentenceCompletionExercise {
  type: "sentence_completion";
  word_bank: string[];
  items: SentenceCompletionItem[];
}

export interface SynonymsMatchingItem {
  id: number;
  word: string;
  synonyms: string[]; // 1 to 2 items
  explanation: string;
}

export interface SynonymsMatchingExercise {
  type: "synonyms_matching";
  items: SynonymsMatchingItem[];
}

export interface ClozeTestAnswer {
  id: number;
  answer: string;
  explanation: string;
}

export interface ClozeTestExercise {
  type: "cloze_test";
  word_bank: string[];
  passage: string;
  answers: ClozeTestAnswer[];
}

export type VocabeeExercise =
  | MatchingExercise
  | SentenceCompletionExercise
  | SynonymsMatchingExercise
  | ClozeTestExercise;

export interface VocabeeTestSet {
  id: string;
  label: string;
  words: string[];
  exercises: VocabeeExercise[];
}

export interface VocabeeTest {
  schema: "vocabee-test-v1";
  title: string;
  total_words: number;
  total_sets: number;
  sets: VocabeeTestSet[];
}

export interface ValidationErrorItem {
  path: string;
  message: string;
  expected?: string;
  found?: string;
  suggestion?: string;
}

export interface ValidationSuccessResult {
  valid: true;
  data: VocabeeTest;
  summary: {
    title: string;
    totalWords: number;
    totalSets: number;
    totalExercises: number;
    totalQuestions: number;
  };
}

export interface ValidationFailureResult {
  valid: false;
  errors: ValidationErrorItem[];
}

export type ValidationResult = ValidationSuccessResult | ValidationFailureResult;

// Test Attempt & Grading Types
export type TestMode = "practice" | "test";
export type AttemptStatus = "in_progress" | "completed" | "abandoned";

export interface GradedQuestionResult {
  questionKey: string;
  setIndex: number;
  setLabel: string;
  exerciseType: ExerciseType;
  itemId: number;
  prompt: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string;
}

export interface SetPerformanceSummary {
  setIndex: number;
  setLabel: string;
  totalQuestions: number;
  correctQuestions: number;
  score: number;
}

export interface ExercisePerformanceSummary {
  exerciseType: ExerciseType;
  exerciseLabel: string;
  totalQuestions: number;
  correctQuestions: number;
  score: number;
}

export interface OverallGradingResult {
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  score: number; // 0 - 100
  accuracyPercentage: number;
  setSummaries: SetPerformanceSummary[];
  exerciseSummaries: ExercisePerformanceSummary[];
  questionResults: GradedQuestionResult[];
}

export interface PersonalTestRecord {
  id: string;
  user_id: string;
  title: string;
  schema_version: string;
  content: VocabeeTest;
  total_words: number;
  total_sets: number;
  created_at: string;
  updated_at: string;
  // Computed / joined stats
  attempts_count?: number;
  best_score?: number | null;
  last_practiced_at?: string | null;
  has_active_attempt?: boolean;
  active_attempt_id?: string | null;
}

export interface PersonalTestAttemptRecord {
  id: string;
  test_id: string;
  user_id: string;
  status: AttemptStatus;
  mode: TestMode;
  answers: Record<string, string>;
  score: number;
  total_questions: number;
  correct_answers: number;
  current_set_index: number;
  current_exercise_index: number;
  started_at: string;
  completed_at: string | null;
}
