import { ReviewGrade } from "./review-types";

export interface ReviewHistory {
  id: string;
  vocabularyId: string;
  ownerId: string;
  reviewedAt: Date;
  grade: ReviewGrade;
  intervalBefore: number;
  intervalAfter: number;
  easeBefore: number;
  easeAfter: number;
  createdAt: Date;
}

export function buildHistoryRecord(params: {
  vocabularyId: string;
  ownerId: string;
  grade: ReviewGrade;
  intervalBefore: number;
  intervalAfter: number;
  easeBefore: number;
  easeAfter: number;
  now: Date;
}): ReviewHistory {
  const {
    vocabularyId,
    ownerId,
    grade,
    intervalBefore,
    intervalAfter,
    easeBefore,
    easeAfter,
    now,
  } = params;

  return {
    id: `hist-${Math.random().toString(36).substr(2, 9)}-${now.getTime()}`,
    vocabularyId,
    ownerId,
    reviewedAt: now,
    grade,
    intervalBefore,
    intervalAfter,
    easeBefore,
    easeAfter,
    createdAt: now,
  };
}
