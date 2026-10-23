-- Migration: 20261024_create_learning_sessions.sql
-- Description: Create persistent adaptive learning sessions with active session constraint, RLS, and mastery tracking

create table if not exists public.learning_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  vocabulary_set_id varchar(11) not null references public.vocab_sets(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'completed', 'abandoned')),
  stage text not null default 'flashcards' check (stage in ('flashcards', 'practice', 'results')),
  selected_word_ids text[] not null default '{}',
  current_card_index int not null default 0,
  reviewed_card_ids text[] not null default '{}',
  question_bank jsonb not null default '[]'::jsonb,
  asked_question_ids text[] not null default '{}',
  current_question_id text,
  word_states jsonb not null default '{}'::jsonb,
  answers_history jsonb not null default '[]'::jsonb,
  score int not null default 0,
  streak int not null default 0,
  highest_streak int not null default 0,
  summary jsonb,
  is_mastery_updated boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

-- Indexes for performance
create index if not exists learning_sessions_user_set_idx on public.learning_sessions (user_id, vocabulary_set_id);
create index if not exists learning_sessions_status_idx on public.learning_sessions (status);

-- Partial unique index ensuring AT MOST ONE active session per user per vocabulary set
create unique index if not exists learning_sessions_active_user_set_uidx 
  on public.learning_sessions (user_id, vocabulary_set_id) 
  where (status = 'active');

-- Enable Row Level Security
alter table public.learning_sessions enable row level security;

-- Drop policy if exists
drop policy if exists "learning_sessions_owner_policy" on public.learning_sessions;

-- Create policy for user ownership
create policy "learning_sessions_owner_policy" on public.learning_sessions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
