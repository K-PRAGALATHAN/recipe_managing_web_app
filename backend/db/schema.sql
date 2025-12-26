-- Cook backend schema (PostgreSQL / Supabase)

create table if not exists public.menu_items (
  id text primary key,
  name text not null,
  minutes integer not null check (minutes >= 0),
  created_at timestamptz not null default now()
);

-- One row per day+menu item the cook selected, with an optional done flag.
create table if not exists public.cook_day_menu (
  day_date date not null,
  menu_id text not null references public.menu_items (id) on delete cascade,
  done boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (day_date, menu_id)
);

create index if not exists cook_day_menu_day_date_idx on public.cook_day_menu (day_date);
