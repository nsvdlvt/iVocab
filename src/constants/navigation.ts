import { NavigationItem } from "@/types/navigation";
import { ROUTES } from "./routes";

export const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    title: "Trang chủ",
    href: ROUTES.DASHBOARD,
    iconName: "Home",
  },
  {
    title: "Bộ từ vựng",
    href: ROUTES.VOCABULARY,
    iconName: "Folder",
  },
  {
    title: "Kho từ vựng",
    href: ROUTES.VOCABULARY_MANAGEMENT,
    iconName: "BookA",
  },
  {
    title: "Ôn tập SRS",
    href: ROUTES.REVIEW,
    iconName: "GraduationCap",
  },
  {
    title: "Đọc hiểu song ngữ",
    href: ROUTES.READING,
    iconName: "BookOpen",
  },
];

export const SECONDARY_NAVIGATION_ITEMS: NavigationItem[] = [
  {
    title: "Trắc nghiệm nhanh",
    href: ROUTES.QUIZ,
    iconName: "Gamepad2",
  },
  {
    title: "Trợ lý AI",
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
