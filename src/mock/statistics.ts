export interface DailyLearningTime {
  day: string;
  minutes: number;
}

export interface VocabularyDistribution {
  category: string;
  count: number;
  color: string;
}

export const mockDailyLearningTime: DailyLearningTime[] = [
  { day: "Thứ 2", minutes: 15 },
  { day: "Thứ 3", minutes: 25 },
  { day: "Thứ 4", minutes: 30 },
  { day: "Thứ 5", minutes: 20 },
  { day: "Thứ 6", minutes: 40 },
  { day: "Thứ 7", minutes: 15 },
  { day: "Chủ Nhật", minutes: 35 },
];

export const mockVocabularyDistribution: VocabularyDistribution[] = [
  { category: "Từ mới", count: 120, color: "bg-blue-500" },
  { category: "Đang học", count: 85, color: "bg-purple-500" },
  { category: "Đã thuộc", count: 185, color: "bg-emerald-500" },
];

export const mockLearningStats = {
  totalWordsLearned: 185,
  totalWordsReviewing: 85,
  totalStudyMinutes: 450,
  averageQuizScore: 88,
  streakDays: 12,
  weeklyProgressPercent: 68,
};
