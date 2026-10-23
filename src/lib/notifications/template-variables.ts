/**
 * Centralized Template Variable Registry for Vocabee
 * Defines allowed variables, data types, descriptions, sample values, and data sources.
 */

export type VariableCategory = "user" | "learning" | "quiz" | "system";
export type VariableDataType = "string" | "number" | "date" | "url" | "percentage";

export interface TemplateVariableDefinition {
  key: string;
  placeholder: string;
  label: string;
  category: VariableCategory;
  dataType: VariableDataType;
  description: string;
  sampleValue: string | number;
  formattingRule: string;
  dataSource: string;
}

export const TEMPLATE_VARIABLES: TemplateVariableDefinition[] = [
  // --- A. Thông tin người dùng ---
  {
    key: "name",
    placeholder: "{name}",
    label: "Tên hiển thị người dùng",
    category: "user",
    dataType: "string",
    description: "Tên hiển thị của học viên trong hồ sơ cá nhân",
    sampleValue: "Dũng",
    formattingRule: "Chuỗi văn bản (Mặc định 'Học viên' nếu chưa đặt tên)",
    dataSource: "profiles.display_name",
  },
  {
    key: "email",
    placeholder: "{email}",
    label: "Email người dùng",
    category: "user",
    dataType: "string",
    description: "Địa chỉ email đã đăng ký của học viên",
    sampleValue: "dung@vocabee.site",
    formattingRule: "Email hợp lệ",
    dataSource: "profiles.email",
  },
  {
    key: "streak",
    placeholder: "{streak}",
    label: "Số ngày streak hiện tại",
    category: "user",
    dataType: "number",
    description: "Số ngày học liên tiếp hiện tại của học viên",
    sampleValue: 7,
    formattingRule: "Số nguyên không âm (ví dụ: 7)",
    dataSource: "profiles.streak",
  },
  {
    key: "longest_streak",
    placeholder: "{longest_streak}",
    label: "Kỷ lục streak dài nhất",
    category: "user",
    dataType: "number",
    description: "Số ngày học liên tiếp dài nhất từng đạt được",
    sampleValue: 21,
    formattingRule: "Số nguyên không âm (ví dụ: 21)",
    dataSource: "profiles.longest_streak",
  },
  {
    key: "last_study_date",
    placeholder: "{last_study_date}",
    label: "Ngày học gần nhất",
    category: "user",
    dataType: "date",
    description: "Ngày ghi nhận phiên học hoặc ôn tập gần đây nhất",
    sampleValue: "18/10/2026",
    formattingRule: "Định dạng ngày DD/MM/YYYY theo múi giờ học viên",
    dataSource: "profiles.last_activity_at",
  },
  {
    key: "days_inactive",
    placeholder: "{days_inactive}",
    label: "Số ngày không hoạt động",
    category: "user",
    dataType: "number",
    description: "Số ngày trôi qua kể từ phiên học gần nhất (0 nếu học hôm nay)",
    sampleValue: 3,
    formattingRule: "Số nguyên không âm (ví dụ: 3)",
    dataSource: "Tính từ profiles.last_activity_at so với thời điểm hiện tại",
  },
  {
    key: "timezone",
    placeholder: "{timezone}",
    label: "Múi giờ của người dùng",
    category: "user",
    dataType: "string",
    description: "Múi giờ cấu hình của học viên",
    sampleValue: "Asia/Ho_Chi_Minh",
    formattingRule: "Tên chuẩn IANA timezone",
    dataSource: "notification_user_preferences.timezone",
  },

  // --- B. Tiến trình học tập ---
  {
    key: "word_count",
    placeholder: "{word_count}",
    label: "Tổng số từ vựng",
    category: "learning",
    dataType: "number",
    description: "Tổng số từ vựng trong kho học tập cá nhân của học viên",
    sampleValue: 120,
    formattingRule: "Số nguyên không âm (ví dụ: 120)",
    dataSource: "COUNT(vocabularies) WHERE owner_id = user_id",
  },
  {
    key: "words_learned_today",
    placeholder: "{words_learned_today}",
    label: "Số từ đã học hôm nay",
    category: "learning",
    dataType: "number",
    description: "Số từ vựng mới hoàn thành qua chế độ Learn hôm nay",
    sampleValue: 15,
    formattingRule: "Số nguyên không âm (ví dụ: 15)",
    dataSource: "study_sessions.studied_words của ngày hôm nay",
  },
  {
    key: "words_review_due",
    placeholder: "{words_review_due}",
    label: "Số từ đến hạn ôn tập",
    category: "learning",
    dataType: "number",
    description: "Số từ vựng đã đến hạn ôn tập theo thuật toán ngắt quãng SRS",
    sampleValue: 8,
    formattingRule: "Số nguyên không âm (ví dụ: 8)",
    dataSource: "COUNT(reviews) WHERE next_review <= now()",
  },
  {
    key: "words_reviewed_today",
    placeholder: "{words_reviewed_today}",
    label: "Số từ đã ôn tập hôm nay",
    category: "learning",
    dataType: "number",
    description: "Số lượt ôn tập từ vựng đã hoàn thành trong ngày hôm nay",
    sampleValue: 10,
    formattingRule: "Số nguyên không âm (ví dụ: 10)",
    dataSource: "study_sessions.reviews_completed của ngày hôm nay",
  },
  {
    key: "words_mastered",
    placeholder: "{words_mastered}",
    label: "Số từ đã thành thạo",
    category: "learning",
    dataType: "number",
    description: "Số từ vựng đã đạt cấp độ ghi nhớ cao nhất (Level 5 hoặc Mastered)",
    sampleValue: 45,
    formattingRule: "Số nguyên không âm (ví dụ: 45)",
    dataSource: "COUNT(reviews) WHERE status IN ('lv5', 'mastered')",
  },
  {
    key: "learning_goal",
    placeholder: "{learning_goal}",
    label: "Mục tiêu học hằng ngày",
    category: "learning",
    dataType: "number",
    description: "Mục tiêu số từ học tập hằng ngày được cài đặt",
    sampleValue: 20,
    formattingRule: "Số nguyên không âm (ví dụ: 20)",
    dataSource: "profiles.daily_goal",
  },
  {
    key: "goal_progress",
    placeholder: "{goal_progress}",
    label: "Tiến độ mục tiêu",
    category: "learning",
    dataType: "percentage",
    description: "Tỷ lệ phần trăm hoàn thành mục tiêu ngày hôm nay",
    sampleValue: "75%",
    formattingRule: "Phần trăm định dạng chuỗi (ví dụ: 75% hoặc 100%)",
    dataSource: "Tỷ lệ (words_learned_today + words_reviewed_today) / learning_goal",
  },
  {
    key: "goal_remaining",
    placeholder: "{goal_remaining}",
    label: "Phần mục tiêu còn lại",
    category: "learning",
    dataType: "number",
    description: "Số từ còn thiếu để đạt mục tiêu hằng ngày",
    sampleValue: 5,
    formattingRule: "Số nguyên không âm (ví dụ: 5, hoặc 0 nếu đã xong)",
    dataSource: "MAX(0, learning_goal - hoạt động đã làm)",
  },
  {
    key: "study_minutes_today",
    placeholder: "{study_minutes_today}",
    label: "Thời gian học hôm nay (phút)",
    category: "learning",
    dataType: "number",
    description: "Tổng số phút học tập và ôn tập ghi nhận trong ngày",
    sampleValue: 18,
    formattingRule: "Số nguyên số phút (ví dụ: 18)",
    dataSource: "ROUND(study_sessions.study_seconds / 60)",
  },

  // --- C. Quiz và bài kiểm tra ---
  {
    key: "quiz_count",
    placeholder: "{quiz_count}",
    label: "Tổng số quiz đã làm",
    category: "quiz",
    dataType: "number",
    description: "Tổng số lượt làm bài kiểm tra trắc nghiệm từ trước đến nay",
    sampleValue: 14,
    formattingRule: "Số nguyên không âm (ví dụ: 14)",
    dataSource: "COUNT(quiz_history) WHERE user_id = user_id",
  },
  {
    key: "quizzes_today",
    placeholder: "{quizzes_today}",
    label: "Số quiz hoàn thành hôm nay",
    category: "quiz",
    dataType: "number",
    description: "Số bài kiểm tra trắc nghiệm hoàn thành trong ngày",
    sampleValue: 2,
    formattingRule: "Số nguyên không âm (ví dụ: 2)",
    dataSource: "COUNT(quiz_history) trong ngày hôm nay",
  },
  {
    key: "last_quiz_score",
    placeholder: "{last_quiz_score}",
    label: "Điểm quiz gần nhất",
    category: "quiz",
    dataType: "string",
    description: "Điểm số hoặc tỷ lệ đúng của bài quiz gần nhất",
    sampleValue: "9/10",
    formattingRule: "Chuỗi phân số hoặc phần trăm (ví dụ: 9/10 hoặc 90%)",
    dataSource: "quiz_history.correct_answers / total_questions gần nhất",
  },
  {
    key: "best_quiz_score",
    placeholder: "{best_quiz_score}",
    label: "Điểm quiz cao nhất",
    category: "quiz",
    dataType: "string",
    description: "Kết quả làm quiz cao nhất từng đạt được",
    sampleValue: "10/10",
    formattingRule: "Chuỗi phân số hoặc phần trăm (ví dụ: 10/10)",
    dataSource: "MAX điểm từ bảng quiz_history",
  },
  {
    key: "quiz_accuracy",
    placeholder: "{quiz_accuracy}",
    label: "Tỷ lệ trả lời quiz đúng",
    category: "quiz",
    dataType: "percentage",
    description: "Tỷ lệ phần trăm trả lời chính xác trung bình trên các câu hỏi quiz",
    sampleValue: "88%",
    formattingRule: "Phần trăm định dạng chuỗi (ví dụ: 88%)",
    dataSource: "Tổng số câu đúng / tổng số câu hỏi từ quiz_history",
  },
  {
    key: "pending_tasks",
    placeholder: "{pending_tasks}",
    label: "Số nhiệm vụ chưa xong",
    category: "quiz",
    dataType: "number",
    description: "Tổng số nhiệm vụ đang chờ (từ ôn tập đến hạn + phần mục tiêu còn lại)",
    sampleValue: 6,
    formattingRule: "Số nguyên không âm (ví dụ: 6)",
    dataSource: "words_review_due + goal_remaining",
  },

  // --- D. Thông tin hệ thống ---
  {
    key: "app_name",
    placeholder: "{app_name}",
    label: "Tên ứng dụng",
    category: "system",
    dataType: "string",
    description: "Tên thương hiệu ứng dụng Vocabee",
    sampleValue: "Vocabee",
    formattingRule: "Chuỗi cố định 'Vocabee'",
    dataSource: "Hằng số hệ thống",
  },
  {
    key: "current_date",
    placeholder: "{current_date}",
    label: "Ngày hiện tại",
    category: "system",
    dataType: "date",
    description: "Ngày hiện tại theo múi giờ Việt Nam / người dùng",
    sampleValue: "18/10/2026",
    formattingRule: "Định dạng ngày DD/MM/YYYY",
    dataSource: "Hệ thống thời gian thực",
  },
  {
    key: "current_time",
    placeholder: "{current_time}",
    label: "Giờ hiện tại",
    category: "system",
    dataType: "string",
    description: "Giờ hiện tại (HH:mm) theo múi giờ",
    sampleValue: "12:00",
    formattingRule: "Định dạng giờ 24h (HH:mm)",
    dataSource: "Hệ thống thời gian thực",
  },
  {
    key: "notification_link",
    placeholder: "{notification_link}",
    label: "Đường dẫn Trung tâm thông báo",
    category: "system",
    dataType: "url",
    description: "Đường dẫn tương đối hợp lệ đến trang thông báo",
    sampleValue: "/notifications",
    formattingRule: "Đường dẫn nội bộ an toàn",
    dataSource: "Route ứng dụng '/notifications'",
  },
  {
    key: "review_link",
    placeholder: "{review_link}",
    label: "Đường dẫn trang Ôn tập",
    category: "system",
    dataType: "url",
    description: "Đường dẫn tương đối hợp lệ đến trang ôn tập SRS",
    sampleValue: "/u/review",
    formattingRule: "Đường dẫn nội bộ an toàn",
    dataSource: "Route ứng dụng '/u/review'",
  },
  {
    key: "learn_link",
    placeholder: "{learn_link}",
    label: "Đường dẫn trang Học từ vựng",
    category: "system",
    dataType: "url",
    description: "Đường dẫn tương đối hợp lệ đến kho từ vựng",
    sampleValue: "/u/vocabulary",
    formattingRule: "Đường dẫn nội bộ an toàn",
    dataSource: "Route ứng dụng '/u/vocabulary'",
  },
  {
    key: "quiz_link",
    placeholder: "{quiz_link}",
    label: "Đường dẫn trang Làm Quiz",
    category: "system",
    dataType: "url",
    description: "Đường dẫn tương đối hợp lệ đến trang làm quiz",
    sampleValue: "/u/quiz",
    formattingRule: "Đường dẫn nội bộ an toàn",
    dataSource: "Route ứng dụng '/u/quiz'",
  },
];

const VARIABLE_MAP = new Map<string, TemplateVariableDefinition>(
  TEMPLATE_VARIABLES.map((v) => [v.key, v])
);

/**
 * Returns all registered template variables.
 */
export function getAllTemplateVariables(): TemplateVariableDefinition[] {
  return TEMPLATE_VARIABLES;
}

/**
 * Finds a registered variable definition by key (e.g. 'name' or '{name}')
 */
export function findTemplateVariable(key: string): TemplateVariableDefinition | undefined {
  const cleanKey = key.replace(/[{}]/g, "").trim();
  return VARIABLE_MAP.get(cleanKey);
}

/**
 * Returns sample user context containing sample data for all registered variables.
 * Used for the Live Sample Preview in the Template Editor.
 */
export function getSampleUserContext(): Record<string, string | number> {
  const sample: Record<string, string | number> = {};
  for (const v of TEMPLATE_VARIABLES) {
    sample[v.key] = v.sampleValue;
  }
  return sample;
}
