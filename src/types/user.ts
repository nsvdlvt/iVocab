export interface UserProfile {
  name: string;
  avatar: string;
  email: string;
  level: string;
  streak: number;
  joinedDate: string;
  dailyGoal: number; // number of words to learn per day
}

export interface UserActivity {
  id: string;
  activityType: "learn" | "review" | "quiz" | "ai";
  description: string;
  timestamp: string;
  detailUrl?: string;
}
