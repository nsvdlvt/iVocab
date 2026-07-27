ALTER TABLE public.vocab_sets
  ADD COLUMN IF NOT EXISTS last_studied_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS vocab_sets_user_id_last_studied_at_idx
  ON public.vocab_sets(user_id, last_studied_at DESC NULLS LAST);
