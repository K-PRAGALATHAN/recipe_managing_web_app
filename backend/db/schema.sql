-- Create Recipes Table
create table if not exists recipes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  archived boolean not null default false
);

-- Create Recipe Versions Table
create table if not exists recipe_versions (
  recipe_id uuid not null references recipes(id) on delete cascade,
  version integer not null,
  status text not null check (status in ('draft', 'released')),
  data_json jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),
  updated_at timestamptz,
  released_by uuid references auth.users(id),
  released_at timestamptz,
  primary key (recipe_id, version)
);

-- Create Indexes
create index if not exists idx_recipe_versions_recipe_id on recipe_versions(recipe_id);
create index if not exists idx_recipe_versions_status on recipe_versions(status);

-- Enable RLS (Optional but recommended, allowing public access for now as per internal app context)
alter table recipes enable row level security;
alter table recipe_versions enable row level security;

-- Policy to allow authenticated users to do everything (internal tool style)
create policy "Allow all for authenticated" on recipes for all using (auth.role() = 'authenticated');
create policy "Allow all for authenticated" on recipe_versions for all using (auth.role() = 'authenticated');
