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
    title: "Từ vựng",
    href: ROUTES.VOCABULARY_MANAGEMENT,
    iconName: "BookA",
  },
  {
    title: "Ôn tập",
    href: ROUTES.REVIEW,
    iconName: "GraduationCap",
  },
];
