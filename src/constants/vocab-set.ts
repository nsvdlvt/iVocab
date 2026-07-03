import * as Icons from "lucide-react";

export const COLOR_OPTIONS = [
  { name: "Màu xanh dương", value: "blue", bg: "bg-blue-500", text: "text-blue-500", border: "border-blue-500/20", lightBg: "bg-blue-500/5 dark:bg-blue-500/10" },
  { name: "Màu xanh lá", value: "emerald", bg: "bg-emerald-500", text: "text-emerald-500", border: "border-emerald-500/20", lightBg: "bg-emerald-500/5 dark:bg-emerald-500/10" },
  { name: "Màu tím Indigo", value: "indigo", bg: "bg-indigo-500", text: "text-indigo-500", border: "border-indigo-500/20", lightBg: "bg-indigo-500/5 dark:bg-indigo-500/10" },
  { name: "Màu tím Violet", value: "violet", bg: "bg-violet-500", text: "text-violet-500", border: "border-violet-500/20", lightBg: "bg-violet-500/5 dark:bg-violet-500/10" },
  { name: "Màu vàng hổ phách", value: "amber", bg: "bg-amber-500", text: "text-amber-500", border: "border-amber-500/20", lightBg: "bg-amber-500/5 dark:bg-amber-500/10" },
  { name: "Màu đỏ hồng", value: "rose", bg: "bg-rose-500", text: "text-rose-500", border: "border-rose-500/20", lightBg: "bg-rose-500/5 dark:bg-rose-500/10" },
  { name: "Màu cam", value: "orange", bg: "bg-orange-500", text: "text-orange-500", border: "border-orange-500/20", lightBg: "bg-orange-500/5 dark:bg-orange-500/10" },
  { name: "Màu xanh ngọc", value: "teal", bg: "bg-teal-500", text: "text-teal-500", border: "border-teal-500/20", lightBg: "bg-teal-500/5 dark:bg-teal-500/10" },
];

export const ICON_OPTIONS = [
  { name: "Sách học", value: "BookOpen" },
  { name: "Mũ cử nhân", value: "GraduationCap" },
  { name: "Đại dương/Toàn cầu", value: "Globe" },
  { name: "Ngọn lửa học thuật", value: "Flame" },
  { name: "Trí tuệ nhân tạo", value: "Brain" },
  { name: "Thư viện học tập", value: "Library" },
  { name: "Huy chương vàng", value: "Award" },
  { name: "Ngôi sao may mắn", value: "Star" },
  { name: "Yêu thích đặc biệt", value: "Heart" },
  { name: "La bàn định hướng", value: "Compass" },
  { name: "Kính hiển vi/Tìm tòi", value: "Search" },
  { name: "Lập trình/Công nghệ", value: "Code" },
];

export function getMetadataOptions(colorValue: string, iconValue: string) {
  const colorOpt = COLOR_OPTIONS.find(c => c.value === colorValue) || COLOR_OPTIONS[0];
  const iconOpt = ICON_OPTIONS.find(i => i.value === iconValue) || ICON_OPTIONS[0];
  const LucideIcon = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconOpt.value] || Icons.BookOpen;

  return {
    color: colorOpt,
    icon: iconOpt,
    LucideIcon
  };
}

export function getRandomVocabularySetColor() {
  const index = Math.floor(Math.random() * COLOR_OPTIONS.length);
  return COLOR_OPTIONS[index].value;
}

