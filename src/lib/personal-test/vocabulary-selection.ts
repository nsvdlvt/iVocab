export interface SelectableVocabSet {
  id: string;
  title: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  visibility: string | null;
  source: string | null;
  created_at: string;
  updated_at: string;
  last_studied_at: string | null;
  wordCount: number;
  levelDistribution: Record<string, number>;
}

export interface SelectableVocabularyWord {
  id: string;
  set_id: string;
  set_title: string;
  set_color: string | null;
  word: string;
  ipa: string | null;
  part_of_speech: string | null;
  meaning: string;
  example: string | null;
  example_translation: string | null;
  synonyms: string[] | null;
  note: string | null;
  difficulty: string | null;
  created_at: string;
  is_starred: boolean | null;
  srsLevel?: number;
}

export interface DeduplicatedTargetWord {
  normalizedWord: string;
  word: string;
  meaning: string;
  alternativeMeanings: string[];
  ipa: string | null;
  partOfSpeech: string | null;
  example: string | null;
  exampleTranslation: string | null;
  synonyms: string[];
  note: string | null;
  difficulty: string | null;
  sourceVocabularyIds: string[];
  sourceSetIds: string[];
  sourceSetTitles: string[];
}

export const MIN_WORDS_FOR_PERSONAL_TEST = 2;
export const MAX_WORDS_FOR_PERSONAL_TEST = 45;

export function normalizeWordKey(word: string): string {
  return word.trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * Formats stored DB difficulty/CEFR into a clean display label without fabricating missing CEFR.
 */
export function formatDifficultyLabel(difficulty: string | null | undefined): string | null {
  if (!difficulty) return null;
  const trimmed = difficulty.trim();
  if (!trimmed) return null;
  const upper = trimmed.toUpperCase();
  if (/^(A1|A2|B1|B2|C1|C2)$/.test(upper)) {
    return upper;
  }
  const lower = trimmed.toLowerCase();
  if (lower === "easy") return "Dễ";
  if (lower === "medium") return "Trung bình";
  if (lower === "hard") return "Khó";
  return trimmed;
}

/**
 * Deduplicates selected vocabulary records:
 * 1. Removes duplicate record IDs.
 * 2. Merges records with identical normalized English target words while preserving all
 *    source vocabulary record IDs and source set memberships internally.
 */
export function deduplicateSelectedVocabulary(
  records: SelectableVocabularyWord[]
): DeduplicatedTargetWord[] {
  const seenRecordIds = new Set<string>();
  const byNormalizedWord = new Map<string, DeduplicatedTargetWord>();

  for (const record of records) {
    if (!record.id || seenRecordIds.has(record.id)) continue;
    seenRecordIds.add(record.id);

    const cleanWord = record.word.trim().replace(/\s+/g, " ");
    const norm = normalizeWordKey(cleanWord);
    if (!norm) continue;

    const existing = byNormalizedWord.get(norm);
    const cleanMeaning = record.meaning.trim();
    const recordSynonyms = (record.synonyms ?? [])
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && normalizeWordKey(s) !== norm);

    if (!existing) {
      byNormalizedWord.set(norm, {
        normalizedWord: norm,
        word: cleanWord,
        meaning: cleanMeaning,
        alternativeMeanings: [],
        ipa: record.ipa?.trim() || null,
        partOfSpeech: record.part_of_speech?.trim() || null,
        example: record.example?.trim() || null,
        exampleTranslation: record.example_translation?.trim() || null,
        synonyms: Array.from(new Set(recordSynonyms)),
        note: record.note?.trim() || null,
        difficulty: record.difficulty?.trim() || null,
        sourceVocabularyIds: [record.id],
        sourceSetIds: [record.set_id],
        sourceSetTitles: [record.set_title],
      });
    } else {
      existing.sourceVocabularyIds.push(record.id);
      if (!existing.sourceSetIds.includes(record.set_id)) {
        existing.sourceSetIds.push(record.set_id);
      }
      if (!existing.sourceSetTitles.includes(record.set_title)) {
        existing.sourceSetTitles.push(record.set_title);
      }
      if (
        cleanMeaning &&
        cleanMeaning.toLowerCase() !== existing.meaning.toLowerCase() &&
        !existing.alternativeMeanings.some(
          (m) => m.toLowerCase() === cleanMeaning.toLowerCase()
        )
      ) {
        existing.alternativeMeanings.push(cleanMeaning);
      }
      if (!existing.ipa && record.ipa?.trim()) existing.ipa = record.ipa.trim();
      if (!existing.partOfSpeech && record.part_of_speech?.trim()) {
        existing.partOfSpeech = record.part_of_speech.trim();
      }
      if (!existing.example && record.example?.trim()) {
        existing.example = record.example.trim();
        existing.exampleTranslation = record.example_translation?.trim() || null;
      }
      if (!existing.note && record.note?.trim()) existing.note = record.note.trim();
      if (!existing.difficulty && record.difficulty?.trim()) {
        existing.difficulty = record.difficulty.trim();
      }
      for (const syn of recordSynonyms) {
        if (!existing.synonyms.some((s) => s.toLowerCase() === syn.toLowerCase())) {
          existing.synonyms.push(syn);
        }
      }
    }
  }

  return Array.from(byNormalizedWord.values());
}

/**
 * Distributes deduplicated target words into internal test Sets following Vocabee specification:
 * - 1-15 words: 1 Set
 * - 16-30 words: 2 Sets (balanced)
 * - 31+ words: ceil(N / 15) Sets (~12-15 words each, balanced)
 * Distributes round-robin after grouping by part-of-speech & set so similar words are spread across sets.
 */
export function distributeWordsIntoSets(
  words: DeduplicatedTargetWord[]
): DeduplicatedTargetWord[][] {
  const n = words.length;
  if (n === 0) return [];
  if (n <= 15) return [words];

  const numSets = n <= 30 ? 2 : Math.ceil(n / 15);
  const buckets: DeduplicatedTargetWord[][] = Array.from({ length: numSets }, () => []);

  // Sort by part of speech then word so round-robin spreads same-POS / alphabetically close words
  const ordered = [...words].sort((a, b) => {
    const posCmp = (a.partOfSpeech ?? "").localeCompare(b.partOfSpeech ?? "");
    if (posCmp !== 0) return posCmp;
    return a.normalizedWord.localeCompare(b.normalizedWord);
  });

  ordered.forEach((word, idx) => {
    buckets[idx % numSets].push(word);
  });

  return buckets;
}

/**
 * Computes planned set sizes for UI summary preview without altering words.
 */
export function getPlannedSetSizes(uniqueWordCount: number): number[] {
  if (uniqueWordCount <= 0) return [];
  if (uniqueWordCount <= 15) return [uniqueWordCount];
  const numSets = uniqueWordCount <= 30 ? 2 : Math.ceil(uniqueWordCount / 15);
  const base = Math.floor(uniqueWordCount / numSets);
  const rem = uniqueWordCount % numSets;
  return Array.from({ length: numSets }, (_, i) => (i < rem ? base + 1 : base));
}

export function suggestTestTitle(
  sets: Array<{ id: string; title: string }>,
  uniqueWordCount: number
): string {
  if (sets.length === 0) {
    return `Kiểm tra từ vựng (${uniqueWordCount} từ)`;
  }
  if (sets.length === 1) {
    return `Kiểm tra: ${sets[0].title} (${uniqueWordCount} từ)`;
  }
  if (sets.length === 2) {
    return `Kiểm tra: ${sets[0].title} & ${sets[1].title} (${uniqueWordCount} từ)`;
  }
  return `Kiểm tra tổng hợp ${sets.length} bộ từ (${uniqueWordCount} từ)`;
}

function getDifficultySortRank(difficulty: string | null | undefined): number {
  if (!difficulty) return 3;
  const lower = difficulty.trim().toLowerCase();
  if (lower.includes("a1") || lower === "easy" || lower === "beginner") return 1;
  if (lower.includes("a2") || lower === "elementary") return 2;
  if (lower.includes("b1") || lower === "medium" || lower === "intermediate") return 3;
  if (lower.includes("b2") || lower === "upper_intermediate") return 4;
  if (lower.includes("c1") || lower === "hard" || lower === "advanced") return 5;
  if (lower.includes("c2") || lower === "mastery") return 6;
  return 3;
}

/**
 * Selects up to `maxUniqueWords` unique target words from `candidates` on top of
 * `currentlySelected`, strictly prioritizing lowest SRS level (`srsLevel` ascending: Lv0 -> Lv5).
 */
export function selectPriorityWordIdsToCap(
  candidates: SelectableVocabularyWord[],
  currentlySelected: SelectableVocabularyWord[],
  maxUniqueWords = MAX_WORDS_FOR_PERSONAL_TEST
): {
  idsToAdd: string[];
  totalEligibleUnique: number;
  wasCapped: boolean;
} {
  const selectedIds = new Set(currentlySelected.map((w) => w.id));
  const selectedNormalized = new Set(
    currentlySelected.map((w) => normalizeWordKey(w.word)).filter(Boolean)
  );

  const remainingSlots = Math.max(0, maxUniqueWords - selectedNormalized.size);

  // Sort all unselected candidates by lowest SRS level first, then lower difficulty, then newest
  const sortedCandidates = [...candidates]
    .filter((w) => !selectedIds.has(w.id))
    .sort((a, b) => {
      const lvlA = a.srsLevel ?? 0;
      const lvlB = b.srsLevel ?? 0;
      if (lvlA !== lvlB) return lvlA - lvlB;

      const diffA = getDifficultySortRank(a.difficulty);
      const diffB = getDifficultySortRank(b.difficulty);
      if (diffA !== diffB) return diffA - diffB;

      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  // Deduplicate eligible unique normalized words not yet in selection
  const eligibleUnique: SelectableVocabularyWord[] = [];
  const seenCandidateNormalized = new Set<string>();

  for (const cand of sortedCandidates) {
    const norm = normalizeWordKey(cand.word);
    if (!norm) continue;
    if (selectedNormalized.has(norm) || seenCandidateNormalized.has(norm)) continue;
    seenCandidateNormalized.add(norm);
    eligibleUnique.push(cand);
  }

  const picked = eligibleUnique.slice(0, remainingSlots);
  return {
    idsToAdd: picked.map((w) => w.id),
    totalEligibleUnique: eligibleUnique.length,
    wasCapped: eligibleUnique.length > remainingSlots,
  };
}
