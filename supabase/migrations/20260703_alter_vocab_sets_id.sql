-- 1. Xóa các bảng phụ thuộc để thay đổi kiểu dữ liệu (Dữ liệu profiles được bảo toàn)
DROP TABLE IF EXISTS public.reviews;
DROP TABLE IF EXISTS public.vocabularies;
DROP TABLE IF EXISTS public.vocab_sets;

-- 2. Tạo lại bảng vocab_sets với khóa chính ID VARCHAR(11)
CREATE TABLE public.vocab_sets (
  id VARCHAR(11) PRIMARY KEY, -- Lưu 'vs_XXXXXXXX'
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  source_language TEXT DEFAULT 'en',
  target_language TEXT DEFAULT 'vi',
  color TEXT,
  icon TEXT,
  visibility TEXT DEFAULT 'private',
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT vocab_sets_visibility_check CHECK (visibility IN ('private', 'unlisted', 'public')),
  CONSTRAINT vocab_sets_source_check CHECK (source IN ('manual', 'ai', 'ocr', 'csv'))
);

-- 3. Tạo lại bảng vocabularies với khóa ngoại set_id VARCHAR(11)
CREATE TABLE public.vocabularies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id VARCHAR(11) REFERENCES public.vocab_sets(id) ON DELETE CASCADE NOT NULL,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  word TEXT NOT NULL,
  ipa TEXT,
  part_of_speech TEXT,
  meaning TEXT NOT NULL,
  example TEXT,
  example_translation TEXT,
  synonyms TEXT[],
  antonyms TEXT[],
  note TEXT,
  image_url TEXT,
  audio_url TEXT,
  difficulty TEXT DEFAULT 'medium',
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  fts_vector TSVECTOR GENERATED ALWAYS AS (to_tsvector('simple', coalesce(word, '')) || to_tsvector('simple', coalesce(meaning, ''))) STORED,
  CONSTRAINT vocabularies_set_id_word_unique UNIQUE (set_id, word),
  CONSTRAINT vocabularies_difficulty_check CHECK (difficulty IN ('easy', 'medium', 'hard')),
  CONSTRAINT vocabularies_source_check CHECK (source IN ('manual', 'ai', 'ocr', 'csv'))
);

-- 4. Tạo lại bảng reviews
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  vocabulary_id UUID REFERENCES public.vocabularies(id) ON DELETE CASCADE NOT NULL,
  ease_factor NUMERIC DEFAULT 2.5,
  interval INTEGER DEFAULT 0,
  repetitions INTEGER DEFAULT 0,
  next_review TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_review TIMESTAMP WITH TIME ZONE,
  last_grade TEXT,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT reviews_user_id_vocabulary_id_unique UNIQUE (user_id, vocabulary_id),
  CONSTRAINT reviews_status_check CHECK (status IN ('new', 'learning', 'mastered')),
  CONSTRAINT reviews_last_grade_check CHECK (last_grade IN ('again', 'hard', 'good', 'easy'))
);

-- 5. Bật lại RLS
ALTER TABLE public.vocab_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocabularies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 6. Tạo lại RLS Policies
CREATE POLICY "vocab_sets_owner_policy" ON public.vocab_sets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "vocabularies_owner_policy" ON public.vocabularies FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "reviews_owner_policy" ON public.reviews FOR ALL USING (auth.uid() = user_id);

-- 7. Tạo lại Chỉ mục
CREATE INDEX IF NOT EXISTS vocab_sets_user_id_idx ON public.vocab_sets(user_id);
CREATE INDEX IF NOT EXISTS vocabularies_set_id_idx ON public.vocabularies(set_id);
CREATE INDEX IF NOT EXISTS vocabularies_owner_id_idx ON public.vocabularies(owner_id);
CREATE INDEX IF NOT EXISTS reviews_user_id_next_review_idx ON public.reviews(user_id, next_review);
CREATE INDEX IF NOT EXISTS reviews_vocabulary_id_idx ON public.reviews(vocabulary_id);
CREATE INDEX IF NOT EXISTS vocabularies_fts_idx ON public.vocabularies USING GIN (fts_vector);

-- 8. Gắn lại Triggers (Bảo đảm tính Idempotent bằng DROP TRIGGER IF EXISTS)
DROP TRIGGER IF EXISTS on_vocab_sets_updated ON public.vocab_sets;
CREATE TRIGGER on_vocab_sets_updated BEFORE UPDATE ON public.vocab_sets FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS on_vocabularies_updated ON public.vocabularies;
CREATE TRIGGER on_vocabularies_updated BEFORE UPDATE ON public.vocabularies FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS on_reviews_updated ON public.reviews;
CREATE TRIGGER on_reviews_updated BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
