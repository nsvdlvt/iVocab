-- Allow anonymous users to read shared vocabulary sets and their words.
-- Existing owner policies continue to govern private access and all mutations.

DROP POLICY IF EXISTS "vocab_sets_public_read_policy" ON public.vocab_sets;
CREATE POLICY "vocab_sets_public_read_policy" ON public.vocab_sets
  FOR SELECT
  USING ((visibility IN ('public', 'unlisted') OR visibility IS NULL) AND deleted_at IS NULL);

DROP POLICY IF EXISTS "vocabularies_public_read_policy" ON public.vocabularies;
CREATE POLICY "vocabularies_public_read_policy" ON public.vocabularies
  FOR SELECT
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1
      FROM public.vocab_sets vs
      WHERE vs.id = vocabularies.set_id
        AND (vs.visibility IN ('public', 'unlisted') OR vs.visibility IS NULL)
        AND vs.deleted_at IS NULL
    )
  );

UPDATE public.vocab_sets
SET visibility = 'public'
WHERE visibility IS NULL
  AND deleted_at IS NULL;
