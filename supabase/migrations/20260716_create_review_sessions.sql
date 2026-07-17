create table if not exists public.review_sessions (
  id uuid primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  vocabulary_set_id uuid references public.vocab_sets(id) on delete cascade,
  title text not null,
  description text not null,
  words jsonb not null,
  completed_words text[] not null default '{}',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists review_sessions_user_id_idx on public.review_sessions (user_id);
create index if not exists review_sessions_vocabulary_set_id_idx on public.review_sessions (vocabulary_set_id);
create index if not exists review_sessions_expires_at_idx on public.review_sessions (expires_at);

alter table public.review_sessions enable row level security;

drop policy if exists "review_sessions_owner_policy" on public.review_sessions;

create policy "review_sessions_owner_policy" on public.review_sessions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
