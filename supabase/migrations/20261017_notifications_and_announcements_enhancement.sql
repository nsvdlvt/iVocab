-- Migration: 20261017_notifications_and_announcements_enhancement.sql
-- Description: Enhance admin_announcements with status, priority, action_url and add user_announcement_reads

-- 1. Enhance admin_announcements columns
ALTER TABLE public.admin_announcements 
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'scheduled', 'published', 'archived')),
  ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  ADD COLUMN IF NOT EXISTS summary TEXT,
  ADD COLUMN IF NOT EXISTS action_url TEXT,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ DEFAULT now();

-- Ensure start_at and end_at can be nullable
ALTER TABLE public.admin_announcements ALTER COLUMN start_at DROP NOT NULL;

-- Update existing records to have consistent status and published_at
UPDATE public.admin_announcements
SET 
  status = CASE WHEN is_active = true THEN 'published' ELSE 'draft' END,
  published_at = COALESCE(published_at, created_at, now())
WHERE status IS NULL OR published_at IS NULL;

-- Index for fast user queries
CREATE INDEX IF NOT EXISTS idx_admin_announcements_user_query 
  ON public.admin_announcements (status, target_audience, start_at, end_at, published_at DESC);

-- 2. Create user_announcement_reads table for per-user read states
CREATE TABLE IF NOT EXISTS public.user_announcement_reads (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  announcement_id UUID NOT NULL REFERENCES public.admin_announcements(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  dismissed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, announcement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_announcement_reads_user ON public.user_announcement_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_user_announcement_reads_ann ON public.user_announcement_reads(announcement_id);

-- Enable RLS on user_announcement_reads
ALTER TABLE public.user_announcement_reads ENABLE ROW LEVEL SECURITY;

-- Policies on user_announcement_reads
DROP POLICY IF EXISTS "user_announcement_reads_select_policy" ON public.user_announcement_reads;
CREATE POLICY "user_announcement_reads_select_policy" ON public.user_announcement_reads
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "user_announcement_reads_insert_policy" ON public.user_announcement_reads;
CREATE POLICY "user_announcement_reads_insert_policy" ON public.user_announcement_reads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_announcement_reads_update_policy" ON public.user_announcement_reads;
CREATE POLICY "user_announcement_reads_update_policy" ON public.user_announcement_reads
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_announcement_reads_delete_policy" ON public.user_announcement_reads;
CREATE POLICY "user_announcement_reads_delete_policy" ON public.user_announcement_reads
  FOR DELETE USING (auth.uid() = user_id OR public.is_admin());

-- 3. Update RLS policies on admin_announcements for secure user access
DROP POLICY IF EXISTS "admin_announcements_public_read_policy" ON public.admin_announcements;
CREATE POLICY "admin_announcements_public_read_policy" ON public.admin_announcements
  FOR SELECT USING (
    (
      -- Must be published and within active time window
      status = 'published'
      AND is_active = true
      AND (start_at IS NULL OR start_at <= now())
      AND (end_at IS NULL OR end_at >= now())
      AND (
        target_audience = 'all'
        OR (target_audience = 'admin' AND public.is_admin())
        OR (target_audience IN ('free', 'premium', 'learners') AND auth.uid() IS NOT NULL)
      )
    )
    OR public.is_admin()
  );
