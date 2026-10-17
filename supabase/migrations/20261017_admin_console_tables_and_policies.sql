-- Migration: 20261017_admin_console_tables_and_policies.sql
-- Description: Complete schema additions and RLS policies for Vocabee Admin Console

-- =========================================================================
-- 1. ADMIN RLS POLICIES FOR EXISTING CORE TABLES
-- =========================================================================

-- Helper function to check if the current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Profiles: Allow admins to view and update any profile
DROP POLICY IF EXISTS "profiles_admin_select_policy" ON public.profiles;
CREATE POLICY "profiles_admin_select_policy" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id OR public.is_admin()
  );

DROP POLICY IF EXISTS "profiles_admin_update_policy" ON public.profiles;
CREATE POLICY "profiles_admin_update_policy" ON public.profiles
  FOR UPDATE USING (
    auth.uid() = id OR public.is_admin()
  );

-- Vocab Sets: Allow admins full access to all sets
DROP POLICY IF EXISTS "vocab_sets_admin_policy" ON public.vocab_sets;
CREATE POLICY "vocab_sets_admin_policy" ON public.vocab_sets
  FOR ALL USING (
    auth.uid() = user_id OR public.is_admin()
  )
  WITH CHECK (
    auth.uid() = user_id OR public.is_admin()
  );

-- Vocabularies: Allow admins full access to all vocabulary words
DROP POLICY IF EXISTS "vocabularies_admin_policy" ON public.vocabularies;
CREATE POLICY "vocabularies_admin_policy" ON public.vocabularies
  FOR ALL USING (
    auth.uid() = owner_id OR public.is_admin()
  )
  WITH CHECK (
    auth.uid() = owner_id OR public.is_admin()
  );

-- Reviews: Allow admins to read review records
DROP POLICY IF EXISTS "reviews_admin_select_policy" ON public.reviews;
CREATE POLICY "reviews_admin_select_policy" ON public.reviews
  FOR SELECT USING (
    auth.uid() = user_id OR public.is_admin()
  );

-- Study Sessions: Allow admins to read study sessions
DROP POLICY IF EXISTS "study_sessions_admin_select_policy" ON public.study_sessions;
CREATE POLICY "study_sessions_admin_select_policy" ON public.study_sessions
  FOR SELECT USING (
    auth.uid() = user_id OR public.is_admin()
  );

-- Quiz History: Allow admins to read quiz attempts
DROP POLICY IF EXISTS "quiz_history_admin_select_policy" ON public.quiz_history;
CREATE POLICY "quiz_history_admin_select_policy" ON public.quiz_history
  FOR SELECT USING (
    auth.uid() = user_id OR public.is_admin()
  );

-- User Statistics: Allow admins to read user statistics
DROP POLICY IF EXISTS "user_statistics_admin_select_policy" ON public.user_statistics;
CREATE POLICY "user_statistics_admin_select_policy" ON public.user_statistics
  FOR SELECT USING (
    auth.uid() = user_id OR public.is_admin()
  );

-- Sentence Practice History: Allow admins to read sentence attempts
DROP POLICY IF EXISTS "sentence_practice_history_admin_select_policy" ON public.sentence_practice_history;
CREATE POLICY "sentence_practice_history_admin_select_policy" ON public.sentence_practice_history
  FOR SELECT USING (
    auth.uid() = user_id OR public.is_admin()
  );

-- Reading Articles: Replace email check with is_admin()
DROP POLICY IF EXISTS "reading_articles_admin_write_policy" ON public.reading_articles;
DROP POLICY IF EXISTS "reading_articles_admin_policy" ON public.reading_articles;
CREATE POLICY "reading_articles_admin_policy" ON public.reading_articles
  FOR ALL USING (
    status = 'published' OR public.is_admin()
  )
  WITH CHECK (
    public.is_admin()
  );

-- =========================================================================
-- 2. ADMIN AUDIT LOGS TABLE
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_email TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON public.admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_entity ON public.admin_audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_actor ON public.admin_audit_logs(actor_id);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_audit_logs_policy" ON public.admin_audit_logs;
CREATE POLICY "admin_audit_logs_policy" ON public.admin_audit_logs
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- =========================================================================
-- 3. ADMIN ANNOUNCEMENTS TABLE
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.admin_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'broadcast')),
  target_audience TEXT NOT NULL DEFAULT 'all' CHECK (target_audience IN ('all', 'free', 'premium', 'admin')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  start_at TIMESTAMPTZ DEFAULT now(),
  end_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_announcements_active ON public.admin_announcements(is_active, start_at, end_at);

ALTER TABLE public.admin_announcements ENABLE ROW LEVEL SECURITY;

-- Admins can manage announcements
DROP POLICY IF EXISTS "admin_announcements_admin_policy" ON public.admin_announcements;
CREATE POLICY "admin_announcements_admin_policy" ON public.admin_announcements
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Regular authenticated users can read active announcements
DROP POLICY IF EXISTS "admin_announcements_public_read_policy" ON public.admin_announcements;
CREATE POLICY "admin_announcements_public_read_policy" ON public.admin_announcements
  FOR SELECT USING (
    is_active = true 
    AND (start_at IS NULL OR start_at <= now())
    AND (end_at IS NULL OR end_at >= now())
  );

-- =========================================================================
-- 4. ADMIN FEATURE FLAGS TABLE
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.admin_feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  environment TEXT NOT NULL DEFAULT 'all',
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_feature_flags_key ON public.admin_feature_flags(key);

ALTER TABLE public.admin_feature_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_feature_flags_admin_policy" ON public.admin_feature_flags;
CREATE POLICY "admin_feature_flags_admin_policy" ON public.admin_feature_flags
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Allow all authenticated users to read feature flags
DROP POLICY IF EXISTS "admin_feature_flags_read_policy" ON public.admin_feature_flags;
CREATE POLICY "admin_feature_flags_read_policy" ON public.admin_feature_flags
  FOR SELECT USING (true);

-- Seed default flags if not existing
INSERT INTO public.admin_feature_flags (key, name, description, is_enabled)
VALUES
  ('ai_writing_assistant', 'AI Writing Assistant', 'Trợ lý AI chấm câu và gợi ý sửa lỗi', true),
  ('community_library', 'Community Vocabulary Library', 'Thư viện từ vựng công khai cho cộng đồng', true),
  ('azure_speech_assessment', 'Azure Speech Assessment', 'Đánh giá phát âm qua nhận diện giọng nói', true),
  ('ai_quiz_generation', 'AI Quiz Generator', 'Tạo bài kiểm tra tự động bằng AI', true),
  ('bilingual_reading', 'Bilingual Reading Articles', 'Bài đọc song ngữ Anh - Việt với câu hỏi', true),
  ('maintenance_mode', 'System Maintenance Mode', 'Bảo trì hệ thống (Chỉ quản trị viên truy cập)', false)
ON CONFLICT (key) DO NOTHING;

-- =========================================================================
-- 5. ADMIN PROMPTS TABLE (VERSIONED)
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.admin_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_key TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  name TEXT NOT NULL,
  description TEXT,
  system_prompt TEXT NOT NULL,
  user_template TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_admin_prompts_key_version UNIQUE (prompt_key, version)
);

CREATE INDEX IF NOT EXISTS idx_admin_prompts_key_active ON public.admin_prompts(prompt_key, is_active);

ALTER TABLE public.admin_prompts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_prompts_admin_policy" ON public.admin_prompts;
CREATE POLICY "admin_prompts_admin_policy" ON public.admin_prompts
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Seed default production prompts
INSERT INTO public.admin_prompts (prompt_key, version, name, description, system_prompt, user_template, variables, is_active)
VALUES
  (
    'sentence_evaluation',
    1,
    'Đánh giá đặt câu tiếng Anh',
    'Chấm điểm câu người dùng viết theo từ vựng mục tiêu và cung cấp phản hồi',
    'You are an expert English language teacher and linguistic evaluator. Evaluate the student sentence with high pedagogical precision.',
    'Target word: {{targetWord}}\nTarget meaning: {{meaning}}\nStudent sentence: {{sentence}}',
    '["targetWord", "meaning", "sentence"]'::jsonb,
    true
  ),
  (
    'quiz_generation',
    1,
    'Tạo câu hỏi trắc nghiệm',
    'Tạo câu hỏi trắc nghiệm ngữ cảnh từ danh sách từ vựng',
    'You are an expert curriculum developer specializing in English language vocabulary testing. Return valid JSON only.',
    'Words: {{wordsList}}\nDifficulty: {{difficulty}}\nCount: {{count}}',
    '["wordsList", "difficulty", "count"]'::jsonb,
    true
  ),
  (
    'writing_hint',
    1,
    'Gợi ý viết câu',
    'Gợi ý cấu trúc hoặc ý tưởng viết câu với từ vựng',
    'You are a helpful English writing tutor. Provide a gentle, inspiring hint without giving away the exact sentence.',
    'Word: {{word}}\nPart of speech: {{partOfSpeech}}\nMeaning: {{meaning}}',
    '["word", "partOfSpeech", "meaning"]'::jsonb,
    true
  )
ON CONFLICT (prompt_key, version) DO NOTHING;

-- =========================================================================
-- 6. ADMIN APPLICATION SETTINGS TABLE
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.admin_settings (
  key TEXT PRIMARY KEY,
  category TEXT NOT NULL DEFAULT 'general',
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_settings_admin_policy" ON public.admin_settings;
CREATE POLICY "admin_settings_admin_policy" ON public.admin_settings
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Seed default application settings
INSERT INTO public.admin_settings (key, category, value, description)
VALUES
  ('general_app_info', 'general', '{"appName": "Vocabee", "supportEmail": "support@vocabee.site", "defaultLanguage": "vi", "allowSignups": true}'::jsonb, 'Thông tin cấu hình chung của hệ thống'),
  ('learning_defaults', 'learning', '{"defaultDailyGoal": 20, "srsInitialIntervalDays": 1, "srsEaseFactor": 2.5, "maxReviewsPerBatch": 30}'::jsonb, 'Thiết lập mặc định cho thuật toán học và SRS'),
  ('ai_configuration', 'ai', '{"defaultModel": "gemini-2.5-flash", "temperature": 0.4, "maxOutputTokens": 2048, "timeoutMs": 10000}'::jsonb, 'Cấu hình mặc định cho các yêu cầu Gemini AI')
ON CONFLICT (key) DO NOTHING;

-- =========================================================================
-- 7. AI USAGE LOGS TABLE
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  feature TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'gemini',
  model TEXT NOT NULL DEFAULT 'gemini-2.5-flash',
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  duration_ms INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'error', 'timeout')),
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_created_at ON public.ai_usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_feature ON public.ai_usage_logs(feature);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_status ON public.ai_usage_logs(status);

ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_usage_logs_admin_policy" ON public.ai_usage_logs;
CREATE POLICY "ai_usage_logs_admin_policy" ON public.ai_usage_logs
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
