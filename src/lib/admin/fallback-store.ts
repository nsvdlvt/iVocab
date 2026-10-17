/**
 * In-memory fallback store for administrative entities when remote tables
 * have not yet been migrated to the database.
 * 
 * Provides seamless continuity and testing capabilities.
 */

export interface FallbackAuditLog {
  id: string;
  actor_id: string | null;
  actor_email: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

export interface FallbackAnnouncement {
  id: string;
  title: string;
  content: string;
  summary?: string | null;
  type: "info" | "warning" | "success" | "broadcast";
  priority?: "low" | "normal" | "high" | "urgent";
  target_audience: "all" | "free" | "premium" | "admin";
  status?: "draft" | "scheduled" | "published" | "archived";
  is_active: boolean;
  action_url?: string | null;
  published_at?: string | null;
  start_at: string | null;
  end_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  delivery_channels?: "in_app" | "push" | "both";
  push_attempt_count?: number;
  push_success_count?: number;
  push_failure_count?: number;
  push_delivered_at?: string | null;
}

export interface FallbackFeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  is_enabled: boolean;
  environment: string;
  updated_at: string;
}

export interface FallbackPrompt {
  id: string;
  prompt_key: string;
  version: number;
  name: string;
  description: string;
  system_prompt: string;
  user_template: string;
  variables: string[];
  is_active: boolean;
  created_at: string;
}

export interface FallbackSetting {
  key: string;
  category: string;
  value: Record<string, unknown>;
  description: string;
  updated_at: string;
}

export interface FallbackAiLog {
  id: string;
  user_id: string | null;
  feature: string;
  provider: string;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  duration_ms: number;
  status: "success" | "error" | "timeout";
  error_message: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

class AdminFallbackStore {
  auditLogs: FallbackAuditLog[] = [
    {
      id: "log_init",
      actor_id: null,
      actor_email: "system@vocabee.site",
      action: "system_bootstrap",
      entity_type: "system",
      entity_id: "0",
      details: { message: "Vocabee Admin Console initialized" },
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
  ];

  announcements: FallbackAnnouncement[] = [
    {
      id: "ann_welcome",
      title: "Chào mừng bạn đến với Vocabee 2.0!",
      content: "Hệ thống học từ vựng thông minh với AI và Spaced Repetition đã sẵn sàng phục vụ.",
      type: "info",
      target_audience: "all",
      is_active: true,
      start_at: new Date(Date.now() - 86400000).toISOString(),
      end_at: null,
      created_by: null,
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: "ann_ai_release",
      title: "Tính năng mới: AI Writing Assistant",
      content: "Luyện tập đặt câu và nhận phản hồi chi tiết ngay lập tức từ trợ lý AI Gemini.",
      type: "success",
      target_audience: "all",
      is_active: true,
      start_at: new Date(Date.now() - 43200000).toISOString(),
      end_at: null,
      created_by: null,
      created_at: new Date(Date.now() - 43200000).toISOString(),
      updated_at: new Date(Date.now() - 43200000).toISOString(),
    },
  ];

  featureFlags: FallbackFeatureFlag[] = [
    {
      id: "flag_ai_writing",
      key: "ai_writing_assistant",
      name: "AI Writing Assistant",
      description: "Trợ lý AI chấm câu và gợi ý sửa lỗi",
      is_enabled: true,
      environment: "all",
      updated_at: new Date().toISOString(),
    },
    {
      id: "flag_community_lib",
      key: "community_library",
      name: "Community Vocabulary Library",
      description: "Thư viện từ vựng công khai cho cộng đồng",
      is_enabled: true,
      environment: "all",
      updated_at: new Date().toISOString(),
    },
    {
      id: "flag_speech",
      key: "azure_speech_assessment",
      name: "Azure Speech Assessment",
      description: "Đánh giá phát âm qua nhận diện giọng nói",
      is_enabled: true,
      environment: "all",
      updated_at: new Date().toISOString(),
    },
    {
      id: "flag_quiz",
      key: "ai_quiz_generation",
      name: "AI Quiz Generator",
      description: "Tạo bài kiểm tra tự động bằng AI",
      is_enabled: true,
      environment: "all",
      updated_at: new Date().toISOString(),
    },
    {
      id: "flag_reading",
      key: "bilingual_reading",
      name: "Bilingual Reading Articles",
      description: "Bài đọc song ngữ Anh - Việt với câu hỏi",
      is_enabled: true,
      environment: "all",
      updated_at: new Date().toISOString(),
    },
    {
      id: "flag_maint",
      key: "maintenance_mode",
      name: "System Maintenance Mode",
      description: "Bảo trì hệ thống (Chỉ quản trị viên truy cập)",
      is_enabled: false,
      environment: "all",
      updated_at: new Date().toISOString(),
    },
  ];

  prompts: FallbackPrompt[] = [
    {
      id: "prompt_sent_eval_v1",
      prompt_key: "sentence_evaluation",
      version: 1,
      name: "Đánh giá đặt câu tiếng Anh",
      description: "Chấm điểm câu người dùng viết theo từ vựng mục tiêu và cung cấp phản hồi sư phạm",
      system_prompt: "You are an expert English language teacher and linguistic evaluator. Evaluate the student sentence with high pedagogical precision.",
      user_template: "Target word: {{targetWord}}\nTarget meaning: {{meaning}}\nStudent sentence: {{sentence}}",
      variables: ["targetWord", "meaning", "sentence"],
      is_active: true,
      created_at: new Date(Date.now() - 172800000).toISOString(),
    },
    {
      id: "prompt_quiz_v1",
      prompt_key: "quiz_generation",
      version: 1,
      name: "Tạo câu hỏi trắc nghiệm",
      description: "Tạo câu hỏi trắc nghiệm ngữ cảnh từ danh sách từ vựng",
      system_prompt: "You are an expert curriculum developer specializing in English language vocabulary testing. Return valid JSON only.",
      user_template: "Words: {{wordsList}}\nDifficulty: {{difficulty}}\nCount: {{count}}",
      variables: ["wordsList", "difficulty", "count"],
      is_active: true,
      created_at: new Date(Date.now() - 172800000).toISOString(),
    },
    {
      id: "prompt_hint_v1",
      prompt_key: "writing_hint",
      version: 1,
      name: "Gợi ý viết câu",
      description: "Gợi ý cấu trúc hoặc ý tưởng viết câu với từ vựng",
      system_prompt: "You are a helpful English writing tutor. Provide a gentle, inspiring hint without giving away the exact sentence.",
      user_template: "Word: {{word}}\nPart of speech: {{partOfSpeech}}\nMeaning: {{meaning}}",
      variables: ["word", "partOfSpeech", "meaning"],
      is_active: true,
      created_at: new Date(Date.now() - 172800000).toISOString(),
    },
  ];

  settings: Record<string, FallbackSetting> = {
    general_app_info: {
      key: "general_app_info",
      category: "general",
      value: {
        appName: "Vocabee",
        supportEmail: "support@vocabee.site",
        defaultLanguage: "vi",
        allowSignups: true,
      },
      description: "Thông tin cấu hình chung của hệ thống",
      updated_at: new Date().toISOString(),
    },
    learning_defaults: {
      key: "learning_defaults",
      category: "learning",
      value: {
        defaultDailyGoal: 20,
        srsInitialIntervalDays: 1,
        srsEaseFactor: 2.5,
        maxReviewsPerBatch: 30,
      },
      description: "Thiết lập mặc định cho thuật toán học và SRS",
      updated_at: new Date().toISOString(),
    },
    ai_configuration: {
      key: "ai_configuration",
      category: "ai",
      value: {
        defaultModel: "gemini-2.5-flash",
        temperature: 0.4,
        maxOutputTokens: 2048,
        timeoutMs: 10000,
      },
      description: "Cấu hình mặc định cho các yêu cầu Gemini AI",
      updated_at: new Date().toISOString(),
    },
  };

  aiLogs: FallbackAiLog[] = [];
}

// Global singleton across server invocations
const globalStore = global as unknown as { __adminFallbackStore?: AdminFallbackStore };
if (!globalStore.__adminFallbackStore) {
  globalStore.__adminFallbackStore = new AdminFallbackStore();
}

export const adminFallbackStore = globalStore.__adminFallbackStore;
