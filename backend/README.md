# Backend (Cook + Chef)

Minimal Express backend for the Cook + Chef portals.

## Database

By default the backend uses local SQLite databases:

- Cook: `./data/cook.db`
- Chef: `./data/chef.db`

Cook can also use Supabase (PostgreSQL).

### SQLite (local)

- Cook store mode defaults to `sqlite`; set `SQLITE_PATH` to override the DB file location.
- Chef store mode defaults to `sqlite`; set `CHEF_SQLITE_PATH` to override the DB file location.

### Supabase (PostgreSQL)

1. Create a Supabase project.
2. In Supabase SQL Editor, run `db/schema.sql` then `db/seed.sql`.
3. Set `STORE=supabase` plus `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (or `SUPABASE_ANON_KEY` if your RLS policies allow it).

## Run

```bash
cd backend
npm install
npm start
```

## Endpoints

- `GET /health`
- `GET /api/chef/recipes`
- `POST /api/chef/recipes` body: `{ "name": "...", "portions": 1, "yield": 1, "ingredients": [{ "name": "...", "quantity": 1, "unit": "g" }], "steps": ["..."] }`
- `GET /api/chef/recipes/:id`
- `POST /api/chef/recipes/:id/versions` body: `{ "portions": 1, "yield": 1, "ingredients": [...], "steps": [...] }`
- `PUT /api/chef/recipes/:id/versions/:version` body: `{ "portions": 1, "yield": 1, "ingredients": [...], "steps": [...] }` (draft-only)
- `POST /api/chef/recipes/:id/versions/:version/release` (draft-only)
- `GET /api/cook/menu`
- `GET /api/cook/status?date=YYYY-MM-DD`
- `PUT /api/cook/status?date=YYYY-MM-DD` body: `{ "selectedMenuIds": [], "doneIds": [] }`
- `POST /api/auth/supabase` body: `{ "accessToken": "..." }` (exchanges Supabase OAuth token for app JWT)
