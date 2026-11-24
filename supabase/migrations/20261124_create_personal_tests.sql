-- Migration: Create personal_tests and personal_test_attempts tables
-- Version: 20261124_create_personal_tests

-- 1. Table: personal_tests
CREATE TABLE IF NOT EXISTS public.personal_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  schema_version TEXT NOT NULL DEFAULT 'vocabee-test-v1',
  content JSONB NOT NULL,
  total_words INTEGER NOT NULL,
  total_sets INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Table: personal_test_attempts
CREATE TABLE IF NOT EXISTS public.personal_test_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES public.personal_tests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  mode TEXT NOT NULL CHECK (mode IN ('practice', 'test')),
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  score NUMERIC NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  current_set_index INTEGER NOT NULL DEFAULT 0,
  current_exercise_index INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  completed_at TIMESTAMPTZ
);

-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_personal_tests_user_created 
  ON public.personal_tests (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_personal_test_attempts_test_user 
  ON public.personal_test_attempts (test_id, user_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_personal_test_attempts_user_status 
  ON public.personal_test_attempts (user_id, status);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.personal_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_test_attempts ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for personal_tests
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'personal_tests' AND policyname = 'personal_tests_select_policy'
  ) THEN
    CREATE POLICY personal_tests_select_policy ON public.personal_tests
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'personal_tests' AND policyname = 'personal_tests_insert_policy'
  ) THEN
    CREATE POLICY personal_tests_insert_policy ON public.personal_tests
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'personal_tests' AND policyname = 'personal_tests_update_policy'
  ) THEN
    CREATE POLICY personal_tests_update_policy ON public.personal_tests
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'personal_tests' AND policyname = 'personal_tests_delete_policy'
  ) THEN
    CREATE POLICY personal_tests_delete_policy ON public.personal_tests
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- 6. RLS Policies for personal_test_attempts
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'personal_test_attempts' AND policyname = 'personal_test_attempts_select_policy'
  ) THEN
    CREATE POLICY personal_test_attempts_select_policy ON public.personal_test_attempts
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'personal_test_attempts' AND policyname = 'personal_test_attempts_insert_policy'
  ) THEN
    CREATE POLICY personal_test_attempts_insert_policy ON public.personal_test_attempts
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'personal_test_attempts' AND policyname = 'personal_test_attempts_update_policy'
  ) THEN
    CREATE POLICY personal_test_attempts_update_policy ON public.personal_test_attempts
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'personal_test_attempts' AND policyname = 'personal_test_attempts_delete_policy'
  ) THEN
    CREATE POLICY personal_test_attempts_delete_policy ON public.personal_test_attempts
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;
