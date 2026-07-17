import { BookOpen, Brain, Clock3, Gauge, Languages, LayoutGrid, Mic, Sparkles, Target } from "lucide-react";
import { FlashcardRow } from "@/components/features/flashcard/flashcard-utils";
import { UpcomingReviewSummary } from "@/repositories/review.repository";
import { DailyActivity, DailyProgress } from "@/repositories/statistics.repository";

export const landingDemoFlashcard = {
  id: "demo-peculiar",
  owner_id: "demo",
  set_id: "demo-set",
  word: "peculiar",
  meaning: "kỳ lạ",
  ipa: "/pɪˈkjuːliə(r)/",
  part_of_speech: "adjective",
  example: "That’s a peculiar idea.",
  example_translation: "Đó là một ý tưởng kỳ lạ.",
  synonyms: ["odd", "strange"],
  antonyms: ["common"],
  note: "Dùng cho những điều khác thường hoặc mang nét riêng.",
  source: "landing-demo",
  difficulty: 3,
  created_at: null,
  updated_at: null,
  deleted_at: null,
  visibility: "private",
  description: null,
  title: null,
  icon: null,
  color: null,
  language: null,
  last_studied_at: null,
  starred_at: null,
  status: null,
  example_audio_url: null,
  word_audio_url: null,
  example_image_url: null,
  tags: null,
  created_by: null,
  updated_by: null,
  import_batch_id: null,
  translation_source: null,
  search_vector: null,
  archived_at: null,
  order_index: null,
  type: null,
  level: null,
  review: null,
  context: null,
  pronunciation: null,
  synonyms_text: null,
  antonyms_text: null,
  extra: null,
} as unknown as FlashcardRow;

export const landingDemoForecast: UpcomingReviewSummary = {
  total: 128,
  averagePerDay: 18,
  busiestDay: { date: "2026-07-18", count: 31, label: "Saturday", isToday: false, isTomorrow: false },
  days: [
    { date: "2026-07-16", count: 22, label: "Hôm nay", isToday: true, isTomorrow: false },
    { date: "2026-07-17", count: 18, label: "Ngày mai", isToday: false, isTomorrow: true },
    { date: "2026-07-18", count: 31, label: "Saturday", isToday: false, isTomorrow: false },
    { date: "2026-07-19", count: 14, label: "Sunday", isToday: false, isTomorrow: false },
    { date: "2026-07-20", count: 17, label: "Monday", isToday: false, isTomorrow: false },
    { date: "2026-07-21", count: 11, label: "Tuesday", isToday: false, isTomorrow: false },
    { date: "2026-07-22", count: 15, label: "Wednesday", isToday: false, isTomorrow: false },
  ],
};

export const landingDemoProgress: DailyProgress = {
  studiedWords: 18,
  reviewedWords: 12,
  goal: 30,
  progressPercent: 100,
};

export const landingDemoWeekly: DailyActivity[] = [
  { date: "2026-07-10", studiedWords: 8, reviewedWords: 3, studySeconds: 1200, progress: 36, completed: false },
  { date: "2026-07-11", studiedWords: 12, reviewedWords: 6, studySeconds: 1500, progress: 60, completed: false },
  { date: "2026-07-12", studiedWords: 9, reviewedWords: 4, studySeconds: 900, progress: 43, completed: false },
  { date: "2026-07-13", studiedWords: 16, reviewedWords: 8, studySeconds: 1900, progress: 80, completed: true },
  { date: "2026-07-14", studiedWords: 14, reviewedWords: 9, studySeconds: 1700, progress: 77, completed: true },
  { date: "2026-07-15", studiedWords: 10, reviewedWords: 5, studySeconds: 1300, progress: 50, completed: false },
  { date: "2026-07-16", studiedWords: 18, reviewedWords: 12, studySeconds: 2100, progress: 100, completed: true },
];

export const landingStorySteps = [
  { icon: Languages, title: "Nhập từ vựng", text: "Thêm bộ từ, nhập nghĩa và sắp xếp thư viện gọn gàng." },
  { icon: BookOpen, title: "Học", text: "Ôn bằng flashcard thích ứng và các phiên học tập trung." },
  { icon: Sparkles, title: "Luyện", text: "Dùng AI Quiz và luyện đặt câu để nhớ sâu hơn theo ngữ cảnh." },
  { icon: Clock3, title: "Ôn với SRS", text: "Xem lịch ôn sắp tới và giữ nhịp học đều đặn." },
  { icon: Target, title: "Chinh phục từ vựng", text: "Theo dõi streak, tiến độ và cảm giác đang tiến bộ rõ rệt." },
];

export const landingFeatureCards = [
  { icon: Gauge, title: "Bảng điều khiển sống động", description: "Mục tiêu ngày, streak và tiến độ được trình bày như một sản phẩm thật." },
  { icon: Mic, title: "Nghe chép và phát âm", description: "Đưa kỹ năng nghe và nói vào cùng một hành trình trực quan." },
  { icon: Brain, title: "AI Quiz cao cấp", description: "Ứng dụng trông như một cỗ máy học tập, không phải thư viện nội dung tĩnh." },
  { icon: LayoutGrid, title: "Thư viện từ vựng", description: "Các thẻ chủ đề và bộ từ giúp hệ thống gọn gàng, dễ mở rộng." },
];

export const landingStats = [
  { value: "20,000+", label: "Từ đã học" },
  { value: "98%", label: "Ghi nhớ" },
  { value: "1M+", label: "Lượt ôn" },
  { value: "4.9★", label: "Đánh giá" },
];
