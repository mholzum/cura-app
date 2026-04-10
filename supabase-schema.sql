-- Run this in Supabase SQL editor

-- Enable anonymous auth (do this in Supabase Dashboard > Authentication > Providers > Anonymous)

create table if not exists users_profile (
  id uuid primary key references auth.users(id) on delete cascade,
  archetype text,
  created_at timestamptz default now()
);

create table if not exists contexts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text default '',
  created_at timestamptz default now()
);

create table if not exists captures (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null default '',
  context_id uuid references contexts(id) on delete set null,
  status text not null default 'open' check (status in ('open', 'stale', 'closed')),
  insight text,
  urgency text not null default 'normal' check (urgency in ('high', 'normal', 'low')),
  created_at timestamptz default now(),
  closed_at timestamptz
);

-- RLS
alter table users_profile enable row level security;
alter table contexts enable row level security;
alter table captures enable row level security;

create policy "users own profile" on users_profile
  for all using (auth.uid() = id);

create policy "users own contexts" on contexts
  for all using (auth.uid() = user_id);

create policy "users own captures" on captures
  for all using (auth.uid() = user_id);
