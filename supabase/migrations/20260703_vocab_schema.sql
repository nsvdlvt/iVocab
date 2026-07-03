-- Create Vocabulary & Study Tables
CREATE TABLE IF NOT EXISTS public.vocab_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  slug TEXT,
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
  CONSTRAINT vocab_sets_visibility_check CHECK (visibility IN ('private', 'public')),
  CONSTRAINT vocab_sets_source_check CHECK (source IN ('manual', 'ai', 'ocr', 'csv'))
);

CREATE TABLE IF NOT EXISTS public.vocabularies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id UUID REFERENCES public.vocab_sets(id) ON DELETE CASCADE NOT NULL,
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

CREATE TABLE IF NOT EXISTS public.reviews (
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

CREATE TABLE IF NOT EXISTS public.study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE,
  studied_words INTEGER DEFAULT 0,
  remembered_words INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.quiz_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  duration INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_statistics (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_words INTEGER DEFAULT 0,
  learned_words INTEGER DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_study_time INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.vocab_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocabularies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_statistics ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "vocab_sets_owner_policy" ON public.vocab_sets;
DROP POLICY IF EXISTS "vocabularies_owner_policy" ON public.vocabularies;
DROP POLICY IF EXISTS "reviews_owner_policy" ON public.reviews;
DROP POLICY IF EXISTS "study_sessions_owner_policy" ON public.study_sessions;
DROP POLICY IF EXISTS "quiz_history_owner_policy" ON public.quiz_history;
DROP POLICY IF EXISTS "user_statistics_owner_policy" ON public.user_statistics;

-- Create RLS Policies
CREATE POLICY "vocab_sets_owner_policy" ON public.vocab_sets
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "vocabularies_owner_policy" ON public.vocabularies
  FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "reviews_owner_policy" ON public.reviews
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "study_sessions_owner_policy" ON public.study_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "quiz_history_owner_policy" ON public.quiz_history
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "user_statistics_owner_policy" ON public.user_statistics
  FOR ALL USING (auth.uid() = user_id);

-- Create Indexes
CREATE INDEX IF NOT EXISTS vocab_sets_user_id_idx ON public.vocab_sets(user_id);
CREATE INDEX IF NOT EXISTS vocabularies_set_id_idx ON public.vocabularies(set_id);
CREATE INDEX IF NOT EXISTS vocabularies_owner_id_idx ON public.vocabularies(owner_id);
CREATE INDEX IF NOT EXISTS reviews_user_id_next_review_idx ON public.reviews(user_id, next_review);
CREATE INDEX IF NOT EXISTS reviews_vocabulary_id_idx ON public.reviews(vocabulary_id);
CREATE INDEX IF NOT EXISTS study_sessions_user_id_started_at_idx ON public.study_sessions(user_id, started_at);
CREATE INDEX IF NOT EXISTS quiz_history_user_id_created_at_idx ON public.quiz_history(user_id, created_at);

-- GIN Index for Full-text Search
CREATE INDEX IF NOT EXISTS vocabularies_fts_idx ON public.vocabularies USING GIN (fts_vector);

-- Trigger handle updated_at function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS on_vocab_sets_updated ON public.vocab_sets;
CREATE TRIGGER on_vocab_sets_updated
  BEFORE UPDATE ON public.vocab_sets
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS on_vocabularies_updated ON public.vocabularies;
CREATE TRIGGER on_vocabularies_updated
  BEFORE UPDATE ON public.vocabularies
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS on_reviews_updated ON public.reviews;
CREATE TRIGGER on_reviews_updated
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS on_study_sessions_updated ON public.study_sessions;
CREATE TRIGGER on_study_sessions_updated
  BEFORE UPDATE ON public.study_sessions
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS on_user_statistics_updated ON public.user_statistics;
CREATE TRIGGER on_user_statistics_updated
  BEFORE UPDATE ON public.user_statistics
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Trigger function to automatically initialize user_statistics when a new profile is created
CREATE OR REPLACE FUNCTION public.handle_new_profile_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_statistics (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Hook trigger to profiles table
DROP TRIGGER IF EXISTS on_profile_created_init_stats ON public.profiles;
CREATE TRIGGER on_profile_created_init_stats
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_profile_stats();

-- Retroactively initialize statistics rows for existing users (e.g. from Phase 2 testing)
INSERT INTO public.user_statistics (user_id)
SELECT id FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;
