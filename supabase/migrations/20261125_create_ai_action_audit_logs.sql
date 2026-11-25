-- Migration: Create ai_action_audit_logs table for AI Learning Agent database mutations
-- Preserves all existing production tables and enforces strict user isolation via RLS.

CREATE TABLE IF NOT EXISTS public.ai_action_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  target_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  affected_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled', 'executed', 'failed', 'expired')),
  summary TEXT NOT NULL DEFAULT '',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_ai_action_audit_logs_user_created
  ON public.ai_action_audit_logs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_action_audit_logs_action_id
  ON public.ai_action_audit_logs (action_id, user_id);

ALTER TABLE public.ai_action_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_action_audit_logs_select_policy" ON public.ai_action_audit_logs;
CREATE POLICY "ai_action_audit_logs_select_policy" ON public.ai_action_audit_logs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "ai_action_audit_logs_insert_policy" ON public.ai_action_audit_logs;
CREATE POLICY "ai_action_audit_logs_insert_policy" ON public.ai_action_audit_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
