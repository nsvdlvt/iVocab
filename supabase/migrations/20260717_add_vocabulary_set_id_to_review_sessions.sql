alter table public.review_sessions
  add column if not exists vocabulary_set_id varchar(11);

alter table public.review_sessions
  alter column vocabulary_set_id type varchar(11)
  using vocabulary_set_id::varchar(11);

do $$
begin
  alter table public.review_sessions
    add constraint review_sessions_vocabulary_set_id_fkey
    foreign key (vocabulary_set_id)
    references public.vocab_sets(id)
    on delete cascade;
exception
  when duplicate_object then null;
end $$;

create index if not exists review_sessions_vocabulary_set_id_idx
  on public.review_sessions (vocabulary_set_id);
