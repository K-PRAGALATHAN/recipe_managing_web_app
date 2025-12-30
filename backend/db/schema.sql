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

-- Chef portal (recipes + versions)

create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by bigint,
  created_at timestamptz not null default now(),
  archived boolean not null default false
);

create table if not exists public.recipe_versions (
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  version integer not null,
  status text not null check (status in ('draft','released')),
  data jsonb not null default '{}'::jsonb,
  created_by bigint,
  created_at timestamptz not null default now(),
  updated_by bigint,
  updated_at timestamptz,
  released_by bigint,
  released_at timestamptz,
  primary key (recipe_id, version)
);

create index if not exists recipe_versions_recipe_id_idx on public.recipe_versions (recipe_id);
create index if not exists recipe_versions_status_idx on public.recipe_versions (status);
