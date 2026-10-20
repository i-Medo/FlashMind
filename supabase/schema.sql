-- Study PWA data layer (FlashMind fork). Apply in Supabase SQL editor.
-- Deviation from spec: added user_id to every table — required for auth.uid() RLS.

create table decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  name text not null,
  folder text,
  created_at timestamptz not null default now()
);

create table cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  deck_id uuid not null references decks(id) on delete cascade,
  front text not null,
  back text not null,
  tags text[] not null default '{}',
  fsrs_stability float,
  fsrs_difficulty float,
  due timestamptz,
  reps int not null default 0,
  lapses int not null default 0,
  created_at timestamptz not null default now()
);
create index cards_deck_id_idx on cards(deck_id);
create index cards_due_idx on cards(due);

create table mistakes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  deck_id uuid references decks(id) on delete set null,
  subject text,
  question text not null,
  solution text,
  notes text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);
create index mistakes_status_idx on mistakes(status);

create table reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  card_id uuid not null references cards(id) on delete cascade,
  rating text not null,
  reviewed_at timestamptz not null default now()
);

-- Single-user RLS: you see only your own rows.
alter table decks enable row level security;
alter table cards enable row level security;
alter table mistakes enable row level security;
alter table reviews enable row level security;

create policy "own rows" on decks    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on cards    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on mistakes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on reviews  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
