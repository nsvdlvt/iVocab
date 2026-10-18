-- ==============================================================================
-- VOCABEE: Automated Notification & Dynamic Template Engine Schema
-- Migration: 20261018_automated_notifications_dynamic_templates.sql
-- ==============================================================================

-- 1. Notification Templates Table
CREATE TABLE IF NOT EXISTS public.notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    title_template TEXT NOT NULL,
    body_template TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'broadcast')),
    delivery_channels TEXT NOT NULL DEFAULT 'both' CHECK (delivery_channels IN ('in_app', 'push', 'both')),
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    action_url TEXT DEFAULT '/notifications',
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'archived')),
    variables_used TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_templates_status ON public.notification_templates(status);
CREATE INDEX IF NOT EXISTS idx_notification_templates_created_at ON public.notification_templates(created_at DESC);

ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notification_templates_admin_policy" ON public.notification_templates;
CREATE POLICY "notification_templates_admin_policy" ON public.notification_templates
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 2. Notification Automation Rules Table
CREATE TABLE IF NOT EXISTS public.notification_automation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES public.notification_templates(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    trigger_type TEXT NOT NULL CHECK (trigger_type IN ('scheduled', 'activity', 'inactivity', 'custom_condition')),
    trigger_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    target_audience TEXT NOT NULL DEFAULT 'all' CHECK (target_audience IN ('all', 'learners', 'has_due_reviews', 'inactive', 'goal_not_completed', 'custom')),
    conditions JSONB DEFAULT '[]'::jsonb,
    cooldown_hours INTEGER NOT NULL DEFAULT 24,
    max_per_user_per_day INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT false,
    last_run_at TIMESTAMPTZ,
    total_runs INTEGER NOT NULL DEFAULT 0,
    total_sent INTEGER NOT NULL DEFAULT 0,
    total_failed INTEGER NOT NULL DEFAULT 0,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_automation_rules_active ON public.notification_automation_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_automation_rules_template_id ON public.notification_automation_rules(template_id);

ALTER TABLE public.notification_automation_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notification_automation_rules_admin_policy" ON public.notification_automation_rules;
CREATE POLICY "notification_automation_rules_admin_policy" ON public.notification_automation_rules
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 3. Notification User Preferences Table
CREATE TABLE IF NOT EXISTS public.notification_user_preferences (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    study_reminders BOOLEAN NOT NULL DEFAULT true,
    review_reminders BOOLEAN NOT NULL DEFAULT true,
    streak_reminders BOOLEAN NOT NULL DEFAULT true,
    inactivity_reminders BOOLEAN NOT NULL DEFAULT true,
    milestone_reminders BOOLEAN NOT NULL DEFAULT true,
    quiet_hours_enabled BOOLEAN NOT NULL DEFAULT false,
    quiet_hours_start TEXT DEFAULT '22:00',
    quiet_hours_end TEXT DEFAULT '07:00',
    timezone TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notification_user_preferences_select_policy" ON public.notification_user_preferences;
CREATE POLICY "notification_user_preferences_select_policy" ON public.notification_user_preferences
    FOR SELECT
    TO authenticated
    USING ((select auth.uid()) = user_id OR public.is_admin());

DROP POLICY IF EXISTS "notification_user_preferences_insert_policy" ON public.notification_user_preferences;
CREATE POLICY "notification_user_preferences_insert_policy" ON public.notification_user_preferences
    FOR INSERT
    TO authenticated
    WITH CHECK ((select auth.uid()) = user_id OR public.is_admin());

DROP POLICY IF EXISTS "notification_user_preferences_update_policy" ON public.notification_user_preferences;
CREATE POLICY "notification_user_preferences_update_policy" ON public.notification_user_preferences
    FOR UPDATE
    TO authenticated
    USING ((select auth.uid()) = user_id OR public.is_admin())
    WITH CHECK ((select auth.uid()) = user_id OR public.is_admin());

-- 4. User In-App Notifications (Personalized delivery for dynamic templates)
CREATE TABLE IF NOT EXISTS public.user_in_app_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    template_id UUID REFERENCES public.notification_templates(id) ON DELETE SET NULL,
    rule_id UUID REFERENCES public.notification_automation_rules(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'broadcast')),
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    action_url TEXT DEFAULT '/notifications',
    is_read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMPTZ,
    dismissed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_in_app_notifs_user ON public.user_in_app_notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_in_app_notifs_rule ON public.user_in_app_notifications(rule_id);

ALTER TABLE public.user_in_app_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_in_app_notifs_select_policy" ON public.user_in_app_notifications;
CREATE POLICY "user_in_app_notifs_select_policy" ON public.user_in_app_notifications
    FOR SELECT
    TO authenticated
    USING ((select auth.uid()) = user_id OR public.is_admin());

DROP POLICY IF EXISTS "user_in_app_notifs_insert_policy" ON public.user_in_app_notifications;
CREATE POLICY "user_in_app_notifs_insert_policy" ON public.user_in_app_notifications
    FOR INSERT
    TO authenticated
    WITH CHECK ((select auth.uid()) = user_id OR public.is_admin());

DROP POLICY IF EXISTS "user_in_app_notifs_update_policy" ON public.user_in_app_notifications;
CREATE POLICY "user_in_app_notifs_update_policy" ON public.user_in_app_notifications
    FOR UPDATE
    TO authenticated
    USING ((select auth.uid()) = user_id OR public.is_admin())
    WITH CHECK ((select auth.uid()) = user_id OR public.is_admin());

DROP POLICY IF EXISTS "user_in_app_notifs_delete_policy" ON public.user_in_app_notifications;
CREATE POLICY "user_in_app_notifs_delete_policy" ON public.user_in_app_notifications
    FOR DELETE
    TO authenticated
    USING ((select auth.uid()) = user_id OR public.is_admin());

-- 5. Automation Runs (Execution Run Audit Logs)
CREATE TABLE IF NOT EXISTS public.notification_automation_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID REFERENCES public.notification_automation_rules(id) ON DELETE CASCADE,
    trigger_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'partial')),
    eligible_recipients INTEGER NOT NULL DEFAULT 0,
    processed_count INTEGER NOT NULL DEFAULT 0,
    in_app_sent_count INTEGER NOT NULL DEFAULT 0,
    push_sent_count INTEGER NOT NULL DEFAULT 0,
    skipped_count INTEGER NOT NULL DEFAULT 0,
    failed_count INTEGER NOT NULL DEFAULT 0,
    error_details JSONB DEFAULT '[]'::jsonb,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_automation_runs_rule_id ON public.notification_automation_runs(rule_id);
CREATE INDEX IF NOT EXISTS idx_automation_runs_started_at ON public.notification_automation_runs(started_at DESC);

ALTER TABLE public.notification_automation_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "automation_runs_admin_policy" ON public.notification_automation_runs;
CREATE POLICY "automation_runs_admin_policy" ON public.notification_automation_runs
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 6. Delivery Logs (Per-user delivery & Idempotency)
CREATE TABLE IF NOT EXISTS public.notification_delivery_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID REFERENCES public.notification_automation_runs(id) ON DELETE SET NULL,
    rule_id UUID REFERENCES public.notification_automation_rules(id) ON DELETE SET NULL,
    template_id UUID REFERENCES public.notification_templates(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    idempotency_key TEXT NOT NULL UNIQUE,
    channel TEXT NOT NULL CHECK (channel IN ('in_app', 'push', 'both')),
    in_app_status TEXT CHECK (in_app_status IN ('sent', 'failed', 'skipped', 'none')),
    push_status TEXT CHECK (push_status IN ('sent', 'failed', 'skipped', 'none', 'expired')),
    rendered_title TEXT NOT NULL,
    rendered_body TEXT NOT NULL,
    variables_snapshot JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_delivery_logs_user_id ON public.notification_delivery_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_delivery_logs_rule_id ON public.notification_delivery_logs(rule_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_delivery_logs_key ON public.notification_delivery_logs(idempotency_key);

ALTER TABLE public.notification_delivery_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "delivery_logs_admin_policy" ON public.notification_delivery_logs;
CREATE POLICY "delivery_logs_admin_policy" ON public.notification_delivery_logs
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "delivery_logs_user_select_policy" ON public.notification_delivery_logs;
CREATE POLICY "delivery_logs_user_select_policy" ON public.notification_delivery_logs
    FOR SELECT
    TO authenticated
    USING ((select auth.uid()) = user_id);

-- 7. Seed 6 Default Production Templates (in 'draft' or 'active' state ready for Admin)
INSERT INTO public.notification_templates (
    id, name, description, title_template, body_template, type, delivery_channels, priority, action_url, status, variables_used
) VALUES
(
    '00000000-0000-0000-0001-000000000001',
    'Nhắc học hằng ngày',
    'Nhắc nhở học viên tiếp tục mục tiêu học tập hằng ngày theo lịch',
    '🐝 {name} ơi, đến giờ học từ vựng rồi!',
    'Hôm nay bạn đã học {words_learned_today} từ. Cùng dành một chút thời gian để tiếp tục nhé!',
    'info',
    'both',
    'normal',
    '/vocabulary',
    'draft',
    ARRAY['name', 'words_learned_today']
),
(
    '00000000-0000-0000-0001-000000000002',
    'Nhắc ôn tập từ vựng đến hạn',
    'Kích hoạt khi người dùng có các từ vựng cần ôn tập theo thuật toán ngắt quãng SRS',
    '📚 Bạn có từ vựng cần ôn tập',
    'Bạn đang có {words_review_due} từ đến hạn ôn tập. Hãy mở Vocabee để củng cố kiến thức nhé!',
    'warning',
    'both',
    'high',
    '/review',
    'draft',
    ARRAY['words_review_due']
),
(
    '00000000-0000-0000-0001-000000000003',
    'Duy trì chuỗi streak',
    'Nhắc học viên hoàn thành bài học trong ngày để không bị đứt chuỗi streak quý giá',
    '🔥 Đừng quên hành trình {streak} ngày của bạn!',
    'Dành chút thời gian học hôm nay để tiếp tục duy trì thói quen học tập nhé, {name}.',
    'warning',
    'both',
    'high',
    '/vocabulary',
    'draft',
    ARRAY['streak', 'name']
),
(
    '00000000-0000-0000-0001-000000000004',
    'Chúc mừng hoàn thành mục tiêu',
    'Kích hoạt khi học viên hoàn thành mục tiêu từ vựng đặt ra trong ngày',
    '🎉 Chúc mừng {name}!',
    'Bạn đã học {words_learned_today} từ hôm nay và đạt {goal_progress} mục tiêu học tập. Tiếp tục phát huy nhé!',
    'success',
    'both',
    'normal',
    '/dashboard',
    'draft',
    ARRAY['name', 'words_learned_today', 'goal_progress']
),
(
    '00000000-0000-0000-0001-000000000005',
    'Nhắc học viên quay lại sau vắng mặt',
    'Kích hoạt khi học viên không hoạt động trong một số ngày nhất định',
    '🐝 Vocabee nhớ bạn!',
    'Đã {days_inactive} ngày kể từ lần học gần nhất. Hãy quay lại và tiếp tục hành trình chinh phục từ vựng nhé!',
    'info',
    'both',
    'normal',
    '/vocabulary',
    'draft',
    ARRAY['days_inactive']
),
(
    '00000000-0000-0000-0001-000000000006',
    'Chúc mừng đạt cột mốc thành tích',
    'Kích hoạt khi học viên đạt cột mốc mới về số lượng từ hoặc streak kỷ lục',
    '🏆 Một cột mốc mới!',
    'Bạn đã học được {word_count} từ và đạt streak dài nhất {longest_streak} ngày. Chúc mừng bạn!',
    'success',
    'both',
    'normal',
    '/profile',
    'draft',
    ARRAY['word_count', 'longest_streak']
)
ON CONFLICT (id) DO NOTHING;

-- 8. Seed Default Pre-configured Automation Rules for each Template
INSERT INTO public.notification_automation_rules (
    id, template_id, name, description, trigger_type, trigger_config, target_audience, conditions, cooldown_hours, max_per_user_per_day, is_active
) VALUES
(
    '00000000-0000-0000-0002-000000000001',
    '00000000-0000-0000-0001-000000000001',
    'Lịch nhắc học 20:00 hằng ngày',
    'Tự động gửi nhắc học vào 20:00 tối mỗi ngày cho người dùng chưa học hôm nay',
    'scheduled',
    '{"schedule_type": "daily", "time": "20:00", "timezone": "Asia/Ho_Chi_Minh"}'::jsonb,
    'all',
    '[{"field": "words_learned_today", "operator": "<", "value": 1}]'::jsonb,
    20,
    1,
    false
),
(
    '00000000-0000-0000-0002-000000000002',
    '00000000-0000-0000-0001-000000000002',
    'Quy tắc nhắc ôn tập SRS đến hạn',
    'Gửi nhắc nhở khi học viên có từ vựng đến hạn ôn tập trong ngày',
    'activity',
    '{"event": "review_due"}'::jsonb,
    'has_due_reviews',
    '[{"field": "words_review_due", "operator": ">", "value": 0}]'::jsonb,
    12,
    1,
    false
),
(
    '00000000-0000-0000-0002-000000000003',
    '00000000-0000-0000-0001-000000000003',
    'Cảnh báo giữ chuỗi Streak',
    'Gửi lúc 21:00 nếu người dùng đang có streak > 0 nhưng chưa học gì hôm nay',
    'scheduled',
    '{"schedule_type": "daily", "time": "21:00", "timezone": "Asia/Ho_Chi_Minh"}'::jsonb,
    'all',
    '[{"field": "streak", "operator": ">=", "value": 1}, {"field": "words_learned_today", "operator": "==", "value": 0}]'::jsonb,
    20,
    1,
    false
),
(
    '00000000-0000-0000-0002-000000000004',
    '00000000-0000-0000-0001-000000000004',
    'Chúc mừng đạt mục tiêu hằng ngày',
    'Kích hoạt khi người dùng hoàn thành 100% mục tiêu học tập trong ngày',
    'activity',
    '{"event": "daily_goal_reached"}'::jsonb,
    'all',
    '[{"field": "goal_remaining", "operator": "==", "value": 0}]'::jsonb,
    24,
    1,
    false
),
(
    '00000000-0000-0000-0002-000000000005',
    '00000000-0000-0000-0001-000000000005',
    'Kéo người dùng không hoạt động (Inactive >= 3 ngày)',
    'Gửi sau khi người dùng không có hoạt động trong 3 ngày liên tiếp',
    'inactivity',
    '{"min_inactive_days": 3}'::jsonb,
    'inactive',
    '[{"field": "days_inactive", "operator": ">=", "value": 3}]'::jsonb,
    72,
    1,
    false
),
(
    '00000000-0000-0000-0002-000000000006',
    '00000000-0000-0000-0001-000000000006',
    'Ghi nhận cột mốc từ vựng & streak',
    'Gửi khi người dùng đạt mốc >= 50 từ và streak >= 7 ngày',
    'custom_condition',
    '{"logic": "AND"}'::jsonb,
    'learners',
    '[{"field": "word_count", "operator": ">=", "value": 50}, {"field": "streak", "operator": ">=", "value": 7}]'::jsonb,
    168,
    1,
    false
)
ON CONFLICT (id) DO NOTHING;
