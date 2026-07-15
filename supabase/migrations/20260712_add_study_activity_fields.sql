-- Add new fields to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ;

-- Add new fields to study_sessions
ALTER TABLE public.study_sessions
ADD COLUMN IF NOT EXISTS study_seconds INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS reviews_completed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS quizzes_completed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS dictations_completed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sentences_completed INTEGER DEFAULT 0;

-- RPC for recording learning progress atomically
CREATE OR REPLACE FUNCTION public.record_learning_progress(
  p_user_id UUID,
  p_count INTEGER,
  p_duration_seconds INTEGER,
  p_source TEXT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session_id UUID;
  v_start_of_today TIMESTAMPTZ;
  v_end_of_today TIMESTAMPTZ;
  v_last_activity_at TIMESTAMPTZ;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
  v_is_new_session BOOLEAN := FALSE;
BEGIN
  -- We'll use UTC for day truncation to be consistent
  v_start_of_today := date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
  v_end_of_today := v_start_of_today + interval '1 day';

  -- 1. Find or create session
  SELECT id INTO v_session_id 
  FROM study_sessions 
  WHERE user_id = p_user_id AND started_at >= v_start_of_today AND started_at < v_end_of_today
  LIMIT 1;

  IF v_session_id IS NULL THEN
    v_is_new_session := TRUE;
    INSERT INTO study_sessions (user_id, started_at) 
    VALUES (p_user_id, now())
    RETURNING id INTO v_session_id;
  END IF;

  -- 2. Update session counts
  IF p_source = 'learn' THEN
    UPDATE study_sessions SET studied_words = coalesce(studied_words, 0) + p_count, study_seconds = coalesce(study_seconds, 0) + p_duration_seconds WHERE id = v_session_id;
  ELSIF p_source = 'review' THEN
    UPDATE study_sessions SET reviews_completed = coalesce(reviews_completed, 0) + p_count, study_seconds = coalesce(study_seconds, 0) + p_duration_seconds WHERE id = v_session_id;
  ELSIF p_source = 'quiz' THEN
    UPDATE study_sessions SET quizzes_completed = coalesce(quizzes_completed, 0) + p_count, study_seconds = coalesce(study_seconds, 0) + p_duration_seconds WHERE id = v_session_id;
  ELSIF p_source = 'dictation' THEN
    UPDATE study_sessions SET dictations_completed = coalesce(dictations_completed, 0) + p_count, study_seconds = coalesce(study_seconds, 0) + p_duration_seconds WHERE id = v_session_id;
  ELSIF p_source = 'sentence' THEN
    UPDATE study_sessions SET sentences_completed = coalesce(sentences_completed, 0) + p_count, study_seconds = coalesce(study_seconds, 0) + p_duration_seconds WHERE id = v_session_id;
  END IF;

  -- 3. Update Streak (if new session)
  IF v_is_new_session THEN
    SELECT last_activity_at, coalesce(streak, 0), coalesce(longest_streak, 0)
    INTO v_last_activity_at, v_current_streak, v_longest_streak
    FROM profiles WHERE id = p_user_id FOR UPDATE;

    IF v_last_activity_at IS NOT NULL THEN
      -- check if last activity was exactly yesterday
      IF date_trunc('day', v_last_activity_at AT TIME ZONE 'UTC') = (v_start_of_today - interval '1 day') THEN
        v_current_streak := v_current_streak + 1;
      ELSIF date_trunc('day', v_last_activity_at AT TIME ZONE 'UTC') < (v_start_of_today - interval '1 day') THEN
        v_current_streak := 1;
      ELSE
        -- If last activity was today (e.g., from profile creation or a manual update)
        IF v_current_streak = 0 THEN
          v_current_streak := 1;
        END IF;
      END IF;
    ELSE
      v_current_streak := 1;
    END IF;

    IF v_current_streak > v_longest_streak THEN
      v_longest_streak := v_current_streak;
    END IF;

    UPDATE profiles 
    SET streak = v_current_streak, 
        longest_streak = v_longest_streak,
        last_activity_at = now()
    WHERE id = p_user_id;
  ELSE
    -- Just update last_activity_at
    UPDATE profiles SET last_activity_at = now() WHERE id = p_user_id;
  END IF;

END;
$$;
