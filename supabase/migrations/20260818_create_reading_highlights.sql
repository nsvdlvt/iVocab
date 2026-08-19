CREATE TABLE IF NOT EXISTS public.reading_highlights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  article_id uuid NOT NULL REFERENCES public.reading_articles(id) ON DELETE CASCADE,
  paragraph_id text NOT NULL,
  language text NOT NULL CHECK (language IN ('en', 'vi')),
  selected_text text NOT NULL,
  color text NOT NULL CHECK (color IN ('yellow', 'green', 'blue', 'pink', 'purple')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reading_highlights_unique_phrase UNIQUE (user_id, article_id, paragraph_id, language, selected_text)
);

ALTER TABLE public.reading_highlights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reading_highlights_select_own_policy" ON public.reading_highlights;
CREATE POLICY "reading_highlights_select_own_policy" ON public.reading_highlights
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "reading_highlights_insert_own_policy" ON public.reading_highlights;
CREATE POLICY "reading_highlights_insert_own_policy" ON public.reading_highlights
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "reading_highlights_update_own_policy" ON public.reading_highlights;
CREATE POLICY "reading_highlights_update_own_policy" ON public.reading_highlights
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "reading_highlights_delete_own_policy" ON public.reading_highlights;
CREATE POLICY "reading_highlights_delete_own_policy" ON public.reading_highlights
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS reading_highlights_article_idx ON public.reading_highlights(article_id);
CREATE INDEX IF NOT EXISTS reading_highlights_user_idx ON public.reading_highlights(user_id);
CREATE INDEX IF NOT EXISTS reading_highlights_article_language_idx ON public.reading_highlights(article_id, language);

DROP TRIGGER IF EXISTS on_reading_highlights_updated ON public.reading_highlights;
CREATE TRIGGER on_reading_highlights_updated
  BEFORE UPDATE ON public.reading_highlights
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
