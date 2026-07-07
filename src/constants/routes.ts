export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  VOCABULARY: "/vocabulary",
  VOCABULARY_DETAIL: (setId: string) => `/vocabulary/${setId}`,
  SHARE_VOCABULARY_DETAIL: (setId: string) => `/share/${setId}`,
  REVIEW: "/review",
  QUIZ: "/quiz",
  AI: "/ai",
  STATISTICS: "/statistics",
  SETTINGS: "/settings",
} as const;

export type AppRoutes =
  typeof ROUTES[keyof Omit<typeof ROUTES, "VOCABULARY_DETAIL" | "SHARE_VOCABULARY_DETAIL">] | string;
