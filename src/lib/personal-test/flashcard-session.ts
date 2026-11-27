import type { Database } from "@/types/database";
import {
  type FlashcardAssessmentStatus,
  type PersonalTestFlashcardItem,
  type PersonalTestLearnWordPromotion,
  type PersonalTestStage,
  type VocabeeTest,
} from "@/types/vocabee-test";
import {
  type DeduplicatedTargetWord,
  type SelectableVocabularyWord,
  deduplicateSelectedVocabulary,
  normalizeWordKey,
} from "./vocabulary-selection";

export type FlashcardDeckFilter = "all" | "not_remembered";

export interface PerSetFlashcardState {
  index: number;
  flipped: boolean;
  filter: FlashcardDeckFilter;
  completed: boolean;
  showCompletion: boolean;
  shuffledIds: string[] | null;
}

export interface PersistedPersonalTestSessionState {
  stage: PersonalTestStage;
  flashcardBySet: Record<number, PerSetFlashcardState>;
  assessments: Record<string, FlashcardAssessmentStatus>;
  reviewedIds: string[];
  checkedMap: Record<string, boolean>;
  learnCompletedBySet?: Record<number, boolean>;
  learnResultsBySet?: Record<number, PersonalTestLearnWordPromotion[]>;
}

type VocabularyRow = Database["public"]["Tables"]["vocabularies"]["Row"];

/**
 * Converts a Set's flashcard records into temporary VocabularyRow items
 * suitable for LearnViewer (/learn mode).
 */
export function buildTemporaryLearnWordsForSet(
  cards: PersonalTestFlashcardItem[]
): VocabularyRow[] {
  const nowIso = new Date().toISOString();
  return cards.map((card) => ({
    id: card.id,
    set_id: "personal-test-temp",
    owner_id: "",
    word: card.word,
    ipa: card.ipa,
    part_of_speech: card.partOfSpeech,
    meaning: card.meaning || card.word,
    example: card.example,
    example_translation: card.exampleTranslation,
    synonyms: card.synonyms.length > 0 ? card.synonyms : null,
    antonyms: null,
    note: null,
    image_url: null,
    audio_url: card.audioUrl ?? null,
    difficulty: null,
    source: "personal-test",
    created_at: nowIso,
    updated_at: nowIso,
    deleted_at: null,
    fts_vector: null,
    is_starred: false,
  }));
}

/**
 * Determines whether a given Set is unlocked in the sequential Set -> Learn flow.
 * Set 0 is always unlocked; Set i > 0 requires prior sets' Learn stages completed
 * (or existing saved answers for backward compatibility with older attempts).
 */
export function canUnlockPersonalTestSet(
  setIndex: number,
  learnCompletedBySet: Record<number, boolean>,
  answers: Record<string, string>
): boolean {
  if (setIndex <= 0) return true;
  const prefix = `s${setIndex}_`;
  const hasExistingAnswers = Object.entries(answers).some(
    ([key, val]) => key.startsWith(prefix) && Boolean(val?.trim())
  );
  if (hasExistingAnswers) return true;

  for (let i = 0; i < setIndex; i += 1) {
    if (!learnCompletedBySet[i]) {
      return false;
    }
  }
  return true;
}

/**
 * Returns true only after every Set in the Personal Test has completed its Learn stage.
 */
export function areAllSetsLearnCompleted(
  totalSets: number,
  learnCompletedBySet: Record<number, boolean>,
  hasWordsInSet?: (setIndex: number) => boolean
): boolean {
  if (totalSets <= 0) return false;
  for (let i = 0; i < totalSets; i += 1) {
    const hasWords = hasWordsInSet ? hasWordsInSet(i) : true;
    if (hasWords && !learnCompletedBySet[i]) {
      return false;
    }
  }
  return true;
}

export function createDefaultPerSetFlashcardState(): PerSetFlashcardState {
  return {
    index: 0,
    flipped: false,
    filter: "all",
    completed: false,
    showCompletion: false,
    shuffledIds: null,
  };
}

/**
 * Returns the ordered, deduplicated flashcards belonging to a single test Set (<=15 words).
 */
export function getFlashcardsForSet(
  allFlashcards: PersonalTestFlashcardItem[],
  setWords: string[]
): PersonalTestFlashcardItem[] {
  const byNorm = new Map<string, PersonalTestFlashcardItem>();
  for (const card of allFlashcards) {
    const norm = normalizeWordKey(card.word);
    if (norm && !byNorm.has(norm)) {
      byNorm.set(norm, card);
    }
  }

  const result: PersonalTestFlashcardItem[] = [];
  const seen = new Set<string>();
  for (const rawWord of setWords) {
    const norm = normalizeWordKey(rawWord);
    if (!norm || seen.has(norm)) continue;
    seen.add(norm);
    const match = byNorm.get(norm);
    if (match) {
      result.push(match);
    }
  }

  return result;
}

/**
 * Converts deduplicated selected vocabulary records into Flashcard items
 * without inventing or fabricating any missing DB fields.
 */
export function buildFlashcardsFromDeduplicatedWords(
  words: DeduplicatedTargetWord[]
): PersonalTestFlashcardItem[] {
  return words.map((item) => ({
    id: item.sourceVocabularyIds[0] || `word-${item.normalizedWord}`,
    sourceVocabularyIds: [...item.sourceVocabularyIds],
    word: item.word,
    ipa: item.ipa,
    partOfSpeech: item.partOfSpeech,
    meaning:
      item.alternativeMeanings.length > 0
        ? [item.meaning, ...item.alternativeMeanings].join("; ")
        : item.meaning,
    example: item.example,
    exampleTranslation: item.exampleTranslation,
    synonyms: [...item.synonyms],
    audioUrl: null,
  }));
}

/**
 * Builds deduplicated Flashcard items directly from raw DB vocabulary records,
 * preserving record IDs and matching audio URLs if available.
 */
export function buildFlashcardsFromRecords(
  records: Array<SelectableVocabularyWord & { audio_url?: string | null }>
): PersonalTestFlashcardItem[] {
  const audioByNorm = new Map<string, string>();
  for (const rec of records) {
    if (rec.audio_url) {
      const norm = normalizeWordKey(rec.word);
      if (norm && !audioByNorm.has(norm)) {
        audioByNorm.set(norm, rec.audio_url);
      }
    }
  }

  const deduplicated = deduplicateSelectedVocabulary(records);
  return buildFlashcardsFromDeduplicatedWords(deduplicated).map((card) => ({
    ...card,
    audioUrl: audioByNorm.get(normalizeWordKey(card.word)) ?? null,
  }));
}

/**
 * Orders and resolves flashcard items for an existing Personal Test using real DB records,
 * keeping exactly one flashcard per unique target word in the test without inventing missing info.
 */
export function resolveFlashcardsForTestContent(
  testContent: VocabeeTest,
  dbRecords: Array<SelectableVocabularyWord & { audio_url?: string | null }>,
  preferredVocabularyIds?: string[]
): PersonalTestFlashcardItem[] {
  const orderedTargetWords: string[] = [];
  const seenTargets = new Set<string>();

  for (const set of testContent.sets) {
    for (const word of set.words) {
      const norm = normalizeWordKey(word);
      if (!norm || seenTargets.has(norm)) continue;
      seenTargets.add(norm);
      orderedTargetWords.push(word.trim());
    }
  }

  // Prioritize preferredVocabularyIds (exact records selected when creating the test)
  const preferredOrder = new Map<string, number>();
  (preferredVocabularyIds ?? []).forEach((id, idx) => {
    preferredOrder.set(id, idx);
  });

  const sortedRecords = [...dbRecords].sort((a, b) => {
    const prefA = preferredOrder.get(a.id);
    const prefB = preferredOrder.get(b.id);
    if (prefA !== undefined && prefB !== undefined) return prefA - prefB;
    if (prefA !== undefined) return -1;
    if (prefB !== undefined) return 1;
    return 0;
  });

  const matchingRecordsByNorm = new Map<
    string,
    Array<SelectableVocabularyWord & { audio_url?: string | null }>
  >();

  for (const record of sortedRecords) {
    const norm = normalizeWordKey(record.word);
    if (!norm || !seenTargets.has(norm)) continue;
    const list = matchingRecordsByNorm.get(norm) ?? [];
    list.push(record);
    matchingRecordsByNorm.set(norm, list);
  }

  const fallbackMeaningByNorm = new Map<string, string>();
  for (const set of testContent.sets) {
    const matchingEx = set.exercises.find((ex) => ex.type === "matching");
    if (matchingEx && matchingEx.type === "matching") {
      for (const item of matchingEx.items) {
        const norm = normalizeWordKey(item.word);
        if (norm && !fallbackMeaningByNorm.has(norm)) {
          fallbackMeaningByNorm.set(norm, item.definition);
        }
      }
    }
  }

  const flashcards: PersonalTestFlashcardItem[] = [];

  for (const word of orderedTargetWords) {
    const norm = normalizeWordKey(word);
    const matches = matchingRecordsByNorm.get(norm) ?? [];

    if (matches.length > 0) {
      // If preferred IDs were provided, only use records matching preferred IDs when present
      const preferredMatches =
        preferredVocabularyIds && preferredVocabularyIds.length > 0
          ? matches.filter((m) => preferredOrder.has(m.id))
          : [];
      const chosen = preferredMatches.length > 0 ? preferredMatches : [matches[0]];
      const built = buildFlashcardsFromRecords(chosen);
      if (built[0]) {
        flashcards.push(built[0]);
        continue;
      }
    }

    // Fallback when original vocabulary row was later deleted: do not invent IPA/POS/examples/synonyms
    flashcards.push({
      id: `test-word-${norm}`,
      sourceVocabularyIds: [],
      word,
      ipa: null,
      partOfSpeech: null,
      meaning: fallbackMeaningByNorm.get(norm) || "",
      example: null,
      exampleTranslation: null,
      synonyms: [],
      audioUrl: null,
    });
  }

  return flashcards;
}

export function getFlashcardAssessmentSummary(
  cards: PersonalTestFlashcardItem[],
  assessments: Record<string, FlashcardAssessmentStatus>,
  reviewedIds: Set<string>
) {
  let rememberedCount = 0;
  let notRememberedCount = 0;
  let unassessedCount = 0;

  for (const card of cards) {
    const status = assessments[card.id];
    if (status === "remembered") {
      rememberedCount += 1;
    } else if (status === "not_remembered") {
      notRememberedCount += 1;
    } else {
      unassessedCount += 1;
    }
  }

  const reviewedCount = cards.filter(
    (card) => reviewedIds.has(card.id) || Boolean(assessments[card.id])
  ).length;

  return {
    totalCount: cards.length,
    reviewedCount,
    rememberedCount,
    notRememberedCount,
    unassessedCount,
  };
}

export function isExerciseFullyAnswered(
  testContent: VocabeeTest,
  setIndex: number,
  exerciseIndex: number,
  answers: Record<string, string>
): boolean {
  const set = testContent.sets[setIndex];
  const exercise = set?.exercises[exerciseIndex];
  if (!exercise) return false;

  if (exercise.type === "cloze_test") {
    return (
      exercise.answers.length > 0 &&
      exercise.answers.every((ans) => {
        const key = `s${setIndex}_e${exerciseIndex}_cloze_test_${ans.id}`;
        return Boolean(answers[key]?.trim());
      })
    );
  }

  return (
    exercise.items.length > 0 &&
    exercise.items.every((item) => {
      const key = `s${setIndex}_e${exerciseIndex}_${exercise.type}_${item.id}`;
      return Boolean(answers[key]?.trim());
    })
  );
}

export function getPersonalTestSessionStorageKey(testId: string, attemptId: string): string {
  return `vocabee_pt_session_${testId}_${attemptId}`;
}

export function getPersonalTestFlashcardsStorageKey(testId: string): string {
  return `vocabee_pt_flashcards_${testId}`;
}
