export const ROUTES = {
  LANDING: "/",
  HOME: "/dashboard",
  DASHBOARD: "/dashboard",
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  VERIFY_OTP: "/verify-otp",
  VOCABULARY: "/vocabulary",
  VOCABULARY_MANAGEMENT: "/vocabulary-management",
  VOCABULARY_DETAIL: (setId: string) => `/vocabulary/${setId}`,
  SHARE_VOCABULARY_DETAIL: (setId: string) => `/share/${setId}`,
  REVIEW: "/review",
  QUIZ: "/quiz",
  AI_QUIZ: (setId: string, basePath = "/vocabulary") => `${basePath}/${setId}/ai-quiz`,
  SPEAKING: (setId: string, basePath = "/vocabulary") => `${basePath}/${setId}/speaking`,
  AI: "/ai",
  STATISTICS: "/statistics",
  READING: "/reading",
  SETTINGS: "/settings",
  NOTIFICATIONS: "/notifications",
} as const;

export type AppRoutes =
  typeof ROUTES[keyof Omit<typeof ROUTES, "VOCABULARY_DETAIL" | "SHARE_VOCABULARY_DETAIL">] | string;
