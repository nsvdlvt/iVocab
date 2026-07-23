-- Permanently delete a vocabulary set and all related records in one atomic operation.
CREATE OR REPLACE FUNCTION public.delete_vocab_set_cascade(
  p_set_id VARCHAR(11),
  p_user_id UUID
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Remove set-linked session/history rows first so the database is clean even
  -- if any future foreign keys are added without cascade semantics.
  DELETE FROM public.review_sessions
  WHERE vocabulary_set_id = p_set_id
    AND user_id = p_user_id;

  DELETE FROM public.sentence_practice_history
  WHERE vocab_set_id = p_set_id
    AND user_id = p_user_id;

  -- Deleting vocabularies removes review rows via ON DELETE CASCADE.
  DELETE FROM public.vocabularies
  WHERE set_id = p_set_id
    AND owner_id = p_user_id;

  DELETE FROM public.vocab_sets
  WHERE id = p_set_id
    AND user_id = p_user_id;
END;
$$;
