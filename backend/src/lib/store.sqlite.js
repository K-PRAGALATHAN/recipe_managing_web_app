import path from 'node:path';
import { promises as fs } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

const dataDir = path.join(process.cwd(), 'data');
const defaultDbPath = path.join(dataDir, 'cook.db');

let db = null;

async function ensureDataDir() {
  await fs.mkdir(dataDir, { recursive: true });
}

function getDbPath() {
  return process.env.SQLITE_PATH ? path.resolve(process.env.SQLITE_PATH) : defaultDbPath;
}

function openDb() {
  if (db) return db;
  db = new DatabaseSync(getDbPath());
  db.exec('pragma foreign_keys = on;');
  db.exec(`
    create table if not exists menu_items (
      id text primary key,
      name text not null,
      minutes integer not null check (minutes >= 0)
    );
  `);
  db.exec(`
    create table if not exists cook_day_menu (
      day_date text not null,
      menu_id text not null references menu_items (id) on delete cascade,
      done integer not null default 0,
      primary key (day_date, menu_id)
    );
  `);
  db.exec(`create index if not exists cook_day_menu_day_date_idx on cook_day_menu (day_date);`);
  return db;
}

function seedMenuIfEmpty(database) {
  const row = database.prepare('select count(1) as count from menu_items').get();
  const count = Number(row?.count ?? 0);
  if (count > 0) return;
  database.exec(`
    insert into menu_items (id, name, minutes) values
      ('m1', 'Grilled Salmon', 25),
      ('m2', 'Caesar Salad', 15),
      ('m3', 'Pasta Carbonara', 30),
      ('m4', 'Beef Wellington', 45);
  `);
}

export async function initCookDb() {
  await ensureDataDir();
  const database = openDb();
  seedMenuIfEmpty(database);
  return getDbPath();
}

export async function getMenu() {
  await initCookDb();
  const rows = openDb().prepare('select id, name, minutes from menu_items order by id').all();
  return { items: rows.map((r) => ({ id: r.id, name: r.name, minutes: r.minutes })) };
}

export async function getCookStateByDate(date) {
  await initCookDb();
  const rows = openDb()
    .prepare('select menu_id, done from cook_day_menu where day_date = ? order by menu_id')
    .all(String(date));
  const selectedMenuIds = rows.map((r) => r.menu_id);
  const doneIds = rows.filter((r) => Number(r.done) === 1).map((r) => r.menu_id);
  return { base: null, day: { selectedMenuIds, doneIds } };
}

export async function setCookStateByDate(date, nextDayState) {
  await initCookDb();
  const day = String(date);
  const selectedMenuIds = Array.isArray(nextDayState?.selectedMenuIds)
    ? nextDayState.selectedMenuIds.map(String)
    : [];
  const doneSet = new Set(Array.isArray(nextDayState?.doneIds) ? nextDayState.doneIds.map(String) : []);

  const database = openDb();
  database.exec('begin;');
  try {
    database.prepare('delete from cook_day_menu where day_date = ?').run(day);
    const insertStmt = database.prepare(
      'insert into cook_day_menu (day_date, menu_id, done) values (?, ?, ?)'
    );
    for (const menuId of selectedMenuIds) {
      insertStmt.run(day, menuId, doneSet.has(menuId) ? 1 : 0);
    }
    database.exec('commit;');
  } catch (err) {
    database.exec('rollback;');
    throw err;
  }

  return {
    selectedMenuIds,
    doneIds: selectedMenuIds.filter((menuId) => doneSet.has(menuId)),
  };
}
