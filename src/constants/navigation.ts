import { NavigationItem } from "@/types/navigation";
import { ROUTES } from "./routes";

export const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    title: "Trang chủ",
    href: ROUTES.HOME,
    iconName: "Home",
  },
  {
    title: "Bộ từ vựng",
    href: ROUTES.VOCABULARY,
    iconName: "BookOpen",
  },
  {
    title: "Ôn tập",
    href: ROUTES.REVIEW,
    iconName: "GraduationCap",
  },
  {
    title: "Quiz",
    href: ROUTES.QUIZ,
    iconName: "Gamepad2",
  },
  {
    title: "AI",
    href: ROUTES.AI,
    iconName: "Bot",
  },
  {
    title: "Thống kê",
    href: ROUTES.STATISTICS,
    iconName: "BarChart3",
  },
  {
    title: "Cài đặt",
    href: ROUTES.SETTINGS,
    iconName: "Settings",
  },
];
