import { UserProfile, UserActivity } from "@/types/user";

export const mockUserProfile: UserProfile = {
  name: "Nguyễn Văn Minh",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
  email: "minh.nguyen@example.com",
  level: "Intermediate (B1)",
  streak: 12,
  joinedDate: "01/01/2026",
  dailyGoal: 20,
};

export const mockUserActivities: UserActivity[] = [
  {
    id: "act-1",
    activityType: "learn",
    description: "Đã học 15 từ mới trong bộ 'IELTS Essential'",
    timestamp: "10 phút trước",
  },
  {
    id: "act-2",
    activityType: "quiz",
    description: "Hoàn thành bài kiểm tra 'TOEIC Vocabulary' với số điểm 90%",
    timestamp: "2 giờ trước",
  },
  {
    id: "act-3",
    activityType: "review",
    description: "Ôn tập 20 từ vựng cũ thông qua Flashcard",
    timestamp: "Hôm qua",
  },
  {
    id: "act-4",
    activityType: "ai",
    description: "Hỏi AI giải thích cách phân biệt 'Affect' và 'Effect'",
    timestamp: "3 ngày trước",
  },
];
