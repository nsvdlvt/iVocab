import { SrsService, SrsLevel } from "@/lib/srs/srs-service";
import type { Database } from "@/types/database";

type VocabularyRow = Database["public"]["Tables"]["vocabularies"]["Row"];
type ReviewRow = Database["public"]["Tables"]["reviews"]["Row"];

export type VocabularyWithReview = VocabularyRow & {
  review?: ReviewRow | null;
};

export type MasteryStatusType =
  | "unlearned"
  | "learning"
  | "weak"
  | "due"
  | "reviewing"
  | "mastered";

export interface WordMasteryBadgeInfo {
  status: MasteryStatusType;
  label: string;
  level: SrsLevel;
  colorClass: string;
}

/**
 * Normalizes CEFR or text difficulty into a numeric rating (1-6).
 */
export function parseCefrRank(difficulty?: string | null): number {
  if (!difficulty) return 3;
  const lower = difficulty.trim().toLowerCase();

  if (lower.includes("a1") || lower === "beginner" || lower === "easy") return 1;
  if (lower.includes("a2") || lower === "elementary") return 2;
  if (lower.includes("b1") || lower === "intermediate" || lower === "medium") return 3;
  if (lower.includes("b2") || lower === "upper_intermediate") return 4;
  if (lower.includes("c1") || lower === "advanced" || lower === "hard") return 5;
  if (lower.includes("c2") || lower === "mastery") return 6;

  return 3;
}

/**
 * Gets clean UI badge information for a word's current SRS mastery.
 */
export function getWordMasteryInfo(
  word: Pick<VocabularyWithReview, "review">,
  now = new Date()
): WordMasteryBadgeInfo {
  const review = word.review;
  const level = SrsService.getLevelFromReview(review);
  const isDue = Boolean(
    review?.next_review &&
      SrsService.canReviewWord({ level, nextReviewAt: review.next_review, now })
  );

  if (level >= 5) {
    return {
      status: "mastered",
      label: "Thành thạo",
      level,
      colorClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    };
  }

  if (isDue) {
    return {
      status: "due",
      label: "Cần ôn tập",
      level,
      colorClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    };
  }

  if (level >= 2) {
    return {
      status: "reviewing",
      label: `Cấp độ ${level}`,
      level,
      colorClass: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
    };
  }

  if (level === 1) {
    return {
      status: "learning",
      label: "Đang học",
      level,
      colorClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    };
  }

  return {
    status: "unlearned",
    label: "Chưa học",
    level: 0,
    colorClass: "bg-muted text-muted-foreground border-border/60",
  };
}

/**
 * Calculates a deterministic priority score for studying a word.
 * Higher score = higher priority to study first.
 *
 * Primary criterion: User's mastery of the word.
 * Priority hierarchy:
 * 1. Unlearned/unpracticed words whose mastery is unknown (Base: 1000)
 * 2. Words with low mastery (Lv1) or recent wrong answers (Base: 850)
 * 3. Words due or overdue for review (Base: 700 + overdue days)
 * 4. Words in intermediate stages (Lv2-Lv4, not due yet) (Base: 400 - level*20)
 * 5. Consistently correct & mastered words (Lv5) (Base: 100)
 *
 * Secondary criterion: CEFR level (A1-C2) used only as a tie-breaker.
 */
export function calculateWordMasteryPriority(
  word: VocabularyWithReview,
  now = new Date()
): number {
  const review = word.review;
  const level = SrsService.getLevelFromReview(review);
  const hasHistory = Boolean(
    review?.last_review || (review?.repetitions && review.repetitions > 0)
  );

  let baseScore = 0;

  // 1. Unlearned / unpracticed words
  if (!hasHistory || level === 0) {
    baseScore = 1000;
  }
  // 2. Low mastery words (Lv1)
  else if (level === 1) {
    baseScore = 850;
    if (review?.last_grade === "wrong" || review?.last_grade === "hard") {
      baseScore += 50;
    }
  }
  // 3. Due or overdue for review
  else if (review?.next_review) {
    const nextReviewTime = new Date(review.next_review).getTime();
    const isDue = SrsService.canReviewWord({
      level,
      nextReviewAt: review.next_review,
      now,
    });

    if (isDue) {
      const diffMs = now.getTime() - nextReviewTime;
      const daysOverdue = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      baseScore = 700 + Math.min(100, daysOverdue * 10);
    } else if (level < 5) {
      // 4. In progress but not due yet (lv2, lv3, lv4)
      baseScore = 400 - level * 20;
    } else {
      // 5. Mastered (lv5)
      baseScore = 100;
    }
  } else if (level >= 5) {
    // 5. Mastered (lv5)
    baseScore = 100;
  } else {
    // Other in-progress without next_review
    baseScore = 400 - level * 20;
  }

  // Secondary tie-breaker: CEFR difficulty ramp (1 to 6)
  // Foundational CEFR (A1=1, A2=2, etc.) gives a tiny sub-point boost (0.01 to 0.06)
  // so within the SAME mastery tier, foundational words rank slightly first,
  // while never overriding any mastery difference.
  const cefrRank = parseCefrRank(word.difficulty);
  const cefrTieBreaker = (7 - cefrRank) * 0.1; // A1 gets +0.6, B1 gets +0.4, C2 gets +0.1

  return baseScore + cefrTieBreaker;
}

/**
 * Sorts vocabulary items by mastery priority (highest priority first).
 * The sort is 100% deterministic and stable.
 */
export function prioritizeWordsForLearning<T extends VocabularyWithReview>(
  words: T[],
  now = new Date()
): T[] {
  return [...words].sort((a, b) => {
    const scoreA = calculateWordMasteryPriority(a, now);
    const scoreB = calculateWordMasteryPriority(b, now);

    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }

    // Stable tie-breakers: created_at, then ID
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    if (dateA !== dateB) {
      return dateA - dateB;
    }

    return a.id.localeCompare(b.id);
  });
}

/**
 * Gets the stable default 10 preselected word IDs based primarily on mastery priority.
 * If fewer than 10 words exist, selects all of them.
 */
export function getDefaultSelectedWordIds(
  words: VocabularyWithReview[],
  count = 10,
  now = new Date()
): string[] {
  if (words.length <= count) {
    return words.map((w) => w.id);
  }

  const prioritized = prioritizeWordsForLearning(words, now);
  return prioritized.slice(0, count).map((w) => w.id);
}
