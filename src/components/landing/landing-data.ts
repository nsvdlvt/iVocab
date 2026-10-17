import {
  BookOpen,
  Brain,
  Clock3,
  FileSpreadsheet,
  Languages,
  Sparkles,
  Target,
} from "lucide-react";
import { FlashcardRow } from "@/components/features/flashcard/flashcard-utils";
import { UpcomingReviewSummary } from "@/repositories/review.repository";
import { DailyActivity, DailyProgress } from "@/repositories/statistics.repository";

export const landingDemoFlashcard = {
  id: "demo-peculiar",
  owner_id: "demo",
  set_id: "demo-set",
  word: "peculiar",
  meaning: "kỳ lạ, khác biệt riêng",
  ipa: "/pɪˈkjuːliə(r)/",
  part_of_speech: "adjective",
  example: "The region has its own peculiar charm and architectural style.",
  example_translation: "Vùng đất này mang một nét quyến rũ và phong cách kiến trúc rất riêng biệt.",
  synonyms: ["distinctive", "unusual", "unique"],
  antonyms: ["ordinary", "common"],
  note: "Thường dùng để miêu tả tính chất đặc trưng hoặc khác thường một cách thú vị (IELTS Band 7.0+).",
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
  busiestDay: { date: "2026-07-18", count: 31, label: "Thứ Bảy", isToday: false, isTomorrow: false },
  days: [
    { date: "2026-07-16", count: 22, label: "Hôm nay", isToday: true, isTomorrow: false },
    { date: "2026-07-17", count: 18, label: "Ngày mai", isToday: false, isTomorrow: true },
    { date: "2026-07-18", count: 31, label: "Thứ Bảy", isToday: false, isTomorrow: false },
    { date: "2026-07-19", count: 14, label: "Chủ Nhật", isToday: false, isTomorrow: false },
    { date: "2026-07-20", count: 17, label: "Thứ Hai", isToday: false, isTomorrow: false },
    { date: "2026-07-21", count: 11, label: "Thứ Ba", isToday: false, isTomorrow: false },
    { date: "2026-07-22", count: 15, label: "Thứ Tư", isToday: false, isTomorrow: false },
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
  {
    icon: Languages,
    title: "Thu thập & Nhập từ",
    text: "Nhập nhanh danh sách từ vựng từ CSV, Quizlet, bài đọc hoặc tạo bộ thẻ theo chủ đề cá nhân.",
  },
  {
    icon: BookOpen,
    title: "Học sâu đa chiều",
    text: "Nắm trọn IPA, từ loại, sắc thái nghĩa, từ đồng nghĩa và câu ví dụ sát thực tế.",
  },
  {
    icon: Sparkles,
    title: "Thực hành cùng AI",
    text: "Luyện tập bài điền từ (Cloze), trắc nghiệm thích ứng và phản hồi ngữ cảnh tức thì.",
  },
  {
    icon: Clock3,
    title: "Ôn tập ngắt quãng SRS",
    text: "Thuật toán tự động tính toán thời điểm vàng trước khi bạn quên để tối ưu hóa trí nhớ dài hạn.",
  },
  {
    icon: Target,
    title: "Làm chủ & Vận dụng",
    text: "Duy trì chuỗi ngày học (Streak), theo dõi độ thuộc lòng và tự tin sử dụng từ trong bài thi.",
  },
];

export const landingFeatureCards = [
  {
    id: "srs",
    icon: Clock3,
    badge: "Thuật toán SRS",
    title: "Lịch ôn tập ngắt quãng thông minh",
    description:
      "Tự động điều chỉnh chu kỳ ôn tập dựa trên mức độ ghi nhớ của từng từ, giúp bạn nhớ lâu gấp 3 lần chỉ với 15 phút mỗi ngày.",
  },
  {
    id: "ai-cloze",
    icon: Brain,
    badge: "AI Thực hành",
    title: "Luyện điền từ & Phản xạ ngữ cảnh AI",
    description:
      "Chấm dứt tình trạng học vẹt nghĩa rời rạc. AI tạo câu hỏi điền khuyết (Cloze) và giải thích chi tiết cách dùng từ trong câu.",
  },
  {
    id: "reading",
    icon: BookOpen,
    badge: "Đọc song ngữ",
    title: "Đọc hiểu song ngữ & Chạm tra từ tức thì",
    description:
      "Đọc các bài viết học thuật phân cấp CEFR, chạm vào bất kỳ từ mới nào để xem phiên âm, nghĩa ngữ cảnh và lưu thẳng vào bộ ôn tập.",
  },
  {
    id: "smart-import",
    icon: FileSpreadsheet,
    badge: "Tự động hóa",
    title: "Nhập từ vựng thông minh & Chuẩn hóa dữ liệu",
    description:
      "Nhập hàng trăm từ vựng từ danh sách thô hoặc file CSV chỉ trong vài giây, tự động bổ sung phiên âm IPA, từ loại và ví dụ chuẩn xác.",
  },
];

export const landingStats = [
  { value: "20,000+", label: "Từ vựng được lưu trữ", detail: "Chuẩn hóa IPA, từ loại và ngữ cảnh học thuật" },
  { value: "94.8%", label: "Tỷ lệ duy trì trí nhớ", detail: "Sau 30 ngày áp dụng lịch ôn tập ngắt quãng SRS" },
  { value: "1.2M+", label: "Lượt ôn thẻ hoàn thành", detail: "Tối ưu thời gian học mỗi ngày với phản hồi nhanh" },
  { value: "4.9 / 5.0", label: "Đánh giá từ người học", detail: "Được yêu thích bởi cộng đồng luyện thi IELTS & TOEIC" },
];
