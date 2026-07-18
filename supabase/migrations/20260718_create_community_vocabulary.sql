create table if not exists public.community_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  icon text,
  color text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists community_categories_is_active_sort_order_idx
  on public.community_categories (is_active, sort_order, name);

alter table public.community_categories enable row level security;

drop policy if exists "community_categories_admin_policy" on public.community_categories;

create policy "community_categories_admin_policy" on public.community_categories
  for all
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  );

create table if not exists public.community_vocabulary_sets (
  id uuid primary key default gen_random_uuid(),
  vocabulary_set_id text not null references public.vocab_sets(id) on delete cascade,
  community_category_id uuid not null references public.community_categories(id) on delete restrict,
  title_snapshot text not null,
  description_snapshot text,
  cover_image text,
  difficulty text not null default 'beginner',
  estimated_minutes integer,
  sort_order integer not null default 0,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  published_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists community_vocabulary_sets_active_sort_order_idx
  on public.community_vocabulary_sets (is_active, sort_order, created_at desc);
create index if not exists community_vocabulary_sets_category_idx
  on public.community_vocabulary_sets (community_category_id);
create index if not exists community_vocabulary_sets_vocabulary_set_idx
  on public.community_vocabulary_sets (vocabulary_set_id);

alter table public.community_vocabulary_sets enable row level security;

drop policy if exists "community_vocabulary_sets_admin_policy" on public.community_vocabulary_sets;

create policy "community_vocabulary_sets_admin_policy" on public.community_vocabulary_sets
  for all
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  );
