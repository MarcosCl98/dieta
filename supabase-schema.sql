-- Run this in your Supabase SQL editor

create table if not exists daily_log (
  id           uuid primary key default gen_random_uuid(),
  user_id      text not null,
  date         date not null default current_date,
  day_type     text not null,   -- 'fuerza' | 'cardio' | 'descanso'
  schedule     text not null,   -- 'tarde' | 'manana' | 'main'
  created_at   timestamptz default now(),
  unique(user_id, date)
);

create table if not exists meal_selections (
  id           uuid primary key default gen_random_uuid(),
  user_id      text not null,
  date         date not null default current_date,
  meal_id      text not null,   -- 'desayuno' | 'comida' | 'post' | 'cena' etc.
  option_id    text not null,   -- 'a' | 'b' | 'c' ...
  kcal         integer not null,
  prot         integer not null,
  carbs        integer not null,
  grasa        integer not null,
  created_at   timestamptz default now(),
  unique(user_id, date, meal_id)
);

-- Enable RLS (optional but recommended even for personal use)
alter table daily_log enable row level security;
alter table meal_selections enable row level security;

-- Simple open policy for personal use (no auth)
create policy "Allow all for personal use" on daily_log for all using (true) with check (true);
create policy "Allow all for personal use" on meal_selections for all using (true) with check (true);
