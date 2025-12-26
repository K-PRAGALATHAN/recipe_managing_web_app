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
