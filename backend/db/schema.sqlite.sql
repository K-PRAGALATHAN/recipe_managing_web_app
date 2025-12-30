-- SQLite schema for the Cook backend (stored locally, e.g. ./data/cook.db)

pragma foreign_keys = on;

create table if not exists menu_items (
  id text primary key,
  name text not null,
  minutes integer not null check (minutes >= 0)
);

-- One row per day+menu item the cook selected, with an optional done flag.
create table if not exists cook_day_menu (
  day_date text not null, -- YYYY-MM-DD
  menu_id text not null references menu_items (id) on delete cascade,
  done integer not null default 0, -- 0/1
  primary key (day_date, menu_id)
);

create index if not exists cook_day_menu_day_date_idx on cook_day_menu (day_date);

-- Chef portal (recipes + versions)

create table if not exists recipes (
  id text primary key,
  name text not null,
  created_by integer,
  created_at text not null default (datetime('now')),
  archived integer not null default 0
);

create table if not exists recipe_versions (
  recipe_id text not null references recipes (id) on delete cascade,
  version integer not null,
  status text not null check (status in ('draft','released')),
  data_json text not null,
  created_by integer,
  created_at text not null default (datetime('now')),
  updated_by integer,
  updated_at text,
  released_by integer,
  released_at text,
  primary key (recipe_id, version)
);

create index if not exists recipe_versions_recipe_id_idx on recipe_versions (recipe_id);
create index if not exists recipe_versions_status_idx on recipe_versions (status);
