# Backend (Cook)

Minimal Express backend for the Cook portal.

## Database (Cook)

By default the backend uses a local SQLite database at `./data/cook.db`. You can also use Supabase (PostgreSQL).

### SQLite (local)

- Default store mode is `sqlite`; set `SQLITE_PATH` to override the DB file location.

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
- `GET /api/cook/menu`
- `GET /api/cook/status?date=YYYY-MM-DD`
- `PUT /api/cook/status?date=YYYY-MM-DD` body: `{ "selectedMenuIds": [], "doneIds": [] }`
- `POST /api/auth/supabase` body: `{ "accessToken": "..." }` (exchanges Supabase OAuth token for app JWT)
