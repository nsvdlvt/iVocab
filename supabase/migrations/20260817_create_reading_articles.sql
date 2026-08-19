CREATE TABLE IF NOT EXISTS public.reading_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  topic TEXT NOT NULL,
  level TEXT NOT NULL,
  estimated_reading_minutes INTEGER NOT NULL DEFAULT 5,
  vocabulary_count INTEGER NOT NULL DEFAULT 0,
  english_content JSONB NOT NULL DEFAULT '{"paragraphs":[]}'::jsonb,
  vietnamese_content JSONB NOT NULL DEFAULT '{"paragraphs":[]}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  published_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT reading_articles_status_check CHECK (status IN ('draft', 'published'))
);

ALTER TABLE public.reading_articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reading_articles_public_read_policy" ON public.reading_articles;
CREATE POLICY "reading_articles_public_read_policy" ON public.reading_articles
  FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "reading_articles_admin_write_policy" ON public.reading_articles;
CREATE POLICY "reading_articles_admin_write_policy" ON public.reading_articles
  FOR ALL
  USING ((auth.jwt() ->> 'email'::text) = 'dungbnlvt@gmail.com')
  WITH CHECK ((auth.jwt() ->> 'email'::text) = 'dungbnlvt@gmail.com');

CREATE INDEX IF NOT EXISTS reading_articles_status_idx ON public.reading_articles(status);
CREATE INDEX IF NOT EXISTS reading_articles_slug_idx ON public.reading_articles(slug);
CREATE INDEX IF NOT EXISTS reading_articles_published_at_idx ON public.reading_articles(published_at DESC);

DROP TRIGGER IF EXISTS on_reading_articles_updated ON public.reading_articles;
CREATE TRIGGER on_reading_articles_updated
  BEFORE UPDATE ON public.reading_articles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
