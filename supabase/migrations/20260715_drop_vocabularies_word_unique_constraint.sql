-- Remove the vocabulary word uniqueness constraint entirely.
-- Existing records are preserved.

ALTER TABLE public.vocabularies
  DROP CONSTRAINT IF EXISTS vocabularies_set_id_word_unique;
