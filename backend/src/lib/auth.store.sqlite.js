import path from 'node:path';
import { promises as fs } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

const dataDir = path.join(process.cwd(), 'data');
const defaultDbPath = path.join(dataDir, 'auth.db');

let db = null;

async function ensureDataDir() {
  await fs.mkdir(dataDir, { recursive: true });
}

function getDbPath() {
  return process.env.AUTH_SQLITE_PATH ? path.resolve(process.env.AUTH_SQLITE_PATH) : defaultDbPath;
}

function ensureColumns(dbInstance) {
  const columns = dbInstance
    .prepare(`pragma table_info(app_users);`)
    .all()
    .map((row) => String(row?.name ?? ''));

  const hasEmail = columns.includes('email');
  const hasSupabaseUserId = columns.includes('supabase_user_id');

  if (!hasEmail) dbInstance.exec(`alter table app_users add column email text;`);
  if (!hasSupabaseUserId) dbInstance.exec(`alter table app_users add column supabase_user_id text;`);

  dbInstance.exec(
    `create unique index if not exists app_users_email_uq on app_users (email) where email is not null;`
  );
  dbInstance.exec(
    `create unique index if not exists app_users_supabase_user_id_uq on app_users (supabase_user_id) where supabase_user_id is not null;`
  );
}

function openDb() {
  if (db) return db;
  db = new DatabaseSync(getDbPath());
  db.exec('pragma foreign_keys = on;');
  db.exec(`
    create table if not exists app_users (
      id integer primary key autoincrement,
      username text not null unique,
      role text not null check (role in ('manager','chef','cook')),
      password_salt_b64 text not null,
      password_hash_b64 text not null,
      created_at text not null default (datetime('now'))
    );
  `);
  db.exec(`create index if not exists app_users_role_idx on app_users (role);`);
  ensureColumns(db);
  return db;
}

export async function initAuthDb() {
  await ensureDataDir();
  openDb();
  return getDbPath();
}

export async function getUserByUsername(username) {
  await initAuthDb();
  return openDb()
    .prepare(
      `select id, username, role, password_salt_b64, password_hash_b64
       from app_users where username = ? limit 1`
    )
    .get(String(username));
}

export async function getUserByEmail(email) {
  await initAuthDb();
  return openDb()
    .prepare(
      `select id, username, role, email, supabase_user_id as supabaseUserId
       from app_users where email = ? limit 1`
    )
    .get(String(email));
}

export async function getUserById(id) {
  await initAuthDb();
  return openDb()
    .prepare(
      `select id, username, role, email, supabase_user_id as supabaseUserId
       from app_users where id = ? limit 1`
    )
    .get(Number(id));
}

export async function getUserBySupabaseUserId(supabaseUserId) {
  await initAuthDb();
  return openDb()
    .prepare(
      `select id, username, role, email, supabase_user_id as supabaseUserId
       from app_users where supabase_user_id = ? limit 1`
    )
    .get(String(supabaseUserId));
}

export async function attachSupabaseUserId({ userId, supabaseUserId }) {
  await initAuthDb();
  openDb()
    .prepare(
      `update app_users
       set supabase_user_id = ?
       where id = ? and (supabase_user_id is null or supabase_user_id = '')`
    )
    .run(String(supabaseUserId), Number(userId));
  return getUserById(userId);
}

export async function countUsersByRole(role) {
  await initAuthDb();
  const row = openDb()
    .prepare('select count(1) as count from app_users where role = ?')
    .get(String(role));
  return Number(row?.count ?? 0);
}

export async function createUser({ username, role, passwordSaltB64, passwordHashB64 }) {
  await initAuthDb();
  const stmt = openDb().prepare(
    `insert into app_users (username, role, password_salt_b64, password_hash_b64, email, supabase_user_id)
     values (?, ?, ?, ?, ?, ?)`
  );
  const result = stmt.run(
    String(username),
    String(role),
    String(passwordSaltB64),
    String(passwordHashB64),
    username?.includes('@') ? String(username) : null,
    null
  );
  return getUserById(result.lastInsertRowid);
}

export async function createUserWithIdentity({ username, role, passwordSaltB64, passwordHashB64, email, supabaseUserId }) {
  await initAuthDb();
  const stmt = openDb().prepare(
    `insert into app_users (username, role, password_salt_b64, password_hash_b64, email, supabase_user_id)
     values (?, ?, ?, ?, ?, ?)`
  );
  const result = stmt.run(
    String(username),
    String(role),
    String(passwordSaltB64),
    String(passwordHashB64),
    email ? String(email) : null,
    supabaseUserId ? String(supabaseUserId) : null
  );
  return getUserById(result.lastInsertRowid);
}

export async function updateUserPassword(id, passwordSaltB64, passwordHashB64) {
  await initAuthDb();
  openDb()
    .prepare(`update app_users set password_salt_b64 = ?, password_hash_b64 = ? where id = ?`)
    .run(String(passwordSaltB64), String(passwordHashB64), Number(id));
  return true;
}

export async function listUsers() {
  await initAuthDb();
  const rows = openDb()
    .prepare(
      `select id, username, role, created_at, email, supabase_user_id
       from app_users order by created_at desc, id desc`
    )
    .all();
  return rows.map((r) => ({
    id: r.id,
    username: r.username,
    role: r.role,
    createdAt: r.created_at,
    email: r.email ?? null,
    supabaseUserId: r.supabase_user_id ?? null,
  }));
}
