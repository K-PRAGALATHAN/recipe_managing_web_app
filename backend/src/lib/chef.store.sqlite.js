import path from 'node:path';
import { promises as fs } from 'node:fs';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

const dataDir = path.join(process.cwd(), 'data');
const defaultDbPath = path.join(dataDir, 'chef.db');

let db = null;

async function ensureDataDir() {
  await fs.mkdir(dataDir, { recursive: true });
}

function getDbPath() {
  return process.env.CHEF_SQLITE_PATH ? path.resolve(process.env.CHEF_SQLITE_PATH) : defaultDbPath;
}

function openDb() {
  if (db) return db;
  db = new DatabaseSync(getDbPath());
  db.exec('pragma foreign_keys = on;');

  db.exec(`
    create table if not exists recipes (
      id text primary key,
      name text not null,
      created_by integer,
      created_at text not null default (datetime('now')),
      archived integer not null default 0
    );
  `);

  db.exec(`
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
  `);

  db.exec(`create index if not exists recipe_versions_recipe_id_idx on recipe_versions (recipe_id);`);
  db.exec(`create index if not exists recipe_versions_status_idx on recipe_versions (status);`);

  return db;
}

export async function initChefDb() {
  await ensureDataDir();
  openDb();
  return getDbPath();
}

function parseJson(raw) {
  try {
    return JSON.parse(String(raw ?? 'null'));
  } catch {
    return null;
  }
}

function normalizeRecipeData(data) {
  const servings = data?.servings == null ? null : Number(data.servings);
  const portions = data?.portions == null ? (Number.isFinite(servings) ? servings : null) : Number(data.portions);
  const yieldAmount = data?.yield == null ? null : Number(data.yield);
  const prepMinutes = data?.prepMinutes == null ? null : Number(data.prepMinutes);
  const cookMinutes = data?.cookMinutes == null ? null : Number(data.cookMinutes);
  const tags = Array.isArray(data?.tags) ? data.tags.map((t) => String(t ?? '').trim()).filter(Boolean) : [];

  const ingredients = Array.isArray(data?.ingredients)
    ? data.ingredients
        .map((i) => {
          if (typeof i === 'string') {
            return { name: i.trim(), quantity: null, unit: '' };
          }
          return {
            name: String(i?.name ?? '').trim(),
            quantity: i?.quantity == null ? null : Number(i.quantity),
            unit: String(i?.unit ?? '').trim(),
          };
        })
        .filter((i) => i.name)
    : [];

  const steps = Array.isArray(data?.steps) ? data.steps.map((s) => String(s ?? '').trim()).filter(Boolean) : [];

  return {
    description: data?.description == null ? null : String(data.description).trim() || null,
    category: data?.category == null ? null : String(data.category).trim() || null,
    imageUrl: data?.imageUrl == null ? null : String(data.imageUrl).trim() || null,
    prepMinutes: Number.isFinite(prepMinutes) ? prepMinutes : null,
    cookMinutes: Number.isFinite(cookMinutes) ? cookMinutes : null,
    servings: Number.isFinite(servings) ? servings : null,
    portions: Number.isFinite(portions) ? portions : null,
    yield: Number.isFinite(yieldAmount) ? yieldAmount : null,
    tags,
    ingredients,
    steps,
  };
}

export async function listRecipes() {
  await initChefDb();
  const rows = openDb()
    .prepare(
      `
      select
        r.id,
        r.name,
        r.created_at as createdAt,
        r.created_by as createdBy,
        (
          select v.version
          from recipe_versions v
          where v.recipe_id = r.id
          order by v.version desc
          limit 1
        ) as latestVersion,
        (
          select v.status
          from recipe_versions v
          where v.recipe_id = r.id
          order by v.version desc
          limit 1
        ) as latestStatus,
        (
          select v.updated_at
          from recipe_versions v
          where v.recipe_id = r.id
          order by v.version desc
          limit 1
        ) as latestUpdatedAt
      from recipes r
      where r.archived = 0
      order by coalesce(latestUpdatedAt, r.created_at) desc, r.id asc
      `
    )
    .all();

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    createdAt: r.createdAt,
    createdBy: r.createdBy ?? null,
    latestVersion: r.latestVersion == null ? null : Number(r.latestVersion),
    latestStatus: r.latestStatus ?? null,
    latestUpdatedAt: r.latestUpdatedAt ?? null,
  }));
}

export async function getRecipeById(id) {
  await initChefDb();
  const recipeId = String(id);
  const recipe = openDb()
    .prepare(
      `select id, name, created_at as createdAt, created_by as createdBy, archived
       from recipes where id = ? limit 1`
    )
    .get(recipeId);
  if (!recipe || Number(recipe.archived) === 1) return null;

  const versions = openDb()
    .prepare(
      `select
         recipe_id as recipeId,
         version,
         status,
         data_json as dataJson,
         created_by as createdBy,
         created_at as createdAt,
         updated_by as updatedBy,
         updated_at as updatedAt,
         released_by as releasedBy,
         released_at as releasedAt
       from recipe_versions
       where recipe_id = ?
       order by version desc`
    )
    .all(recipeId)
    .map((v) => ({
      recipeId: v.recipeId,
      version: Number(v.version),
      status: v.status,
      data: parseJson(v.dataJson) ?? { portions: null, yield: null, ingredients: [], steps: [] },
      createdBy: v.createdBy ?? null,
      createdAt: v.createdAt,
      updatedBy: v.updatedBy ?? null,
      updatedAt: v.updatedAt ?? null,
      releasedBy: v.releasedBy ?? null,
      releasedAt: v.releasedAt ?? null,
    }));

  return {
    id: recipe.id,
    name: recipe.name,
    createdAt: recipe.createdAt,
    createdBy: recipe.createdBy ?? null,
    versions,
  };
}

export async function getRecipeVersion({ recipeId, version }) {
  await initChefDb();
  const row = openDb()
    .prepare(
      `select
         recipe_id as recipeId,
         version,
         status,
         data_json as dataJson,
         created_by as createdBy,
         created_at as createdAt,
         updated_by as updatedBy,
         updated_at as updatedAt,
         released_by as releasedBy,
         released_at as releasedAt
       from recipe_versions
       where recipe_id = ? and version = ?
       limit 1`
    )
    .get(String(recipeId), Number(version));
  if (!row) return null;
  return {
    recipeId: row.recipeId,
    version: Number(row.version),
    status: row.status,
    data: parseJson(row.dataJson) ?? { portions: null, yield: null, ingredients: [], steps: [] },
    createdBy: row.createdBy ?? null,
    createdAt: row.createdAt,
    updatedBy: row.updatedBy ?? null,
    updatedAt: row.updatedAt ?? null,
    releasedBy: row.releasedBy ?? null,
    releasedAt: row.releasedAt ?? null,
  };
}

export async function createRecipe({ name, createdBy, initialData }) {
  await initChefDb();
  const recipeId = crypto.randomUUID();
  const database = openDb();

  database.exec('begin;');
  try {
    database
      .prepare(`insert into recipes (id, name, created_by) values (?, ?, ?)`)
      .run(recipeId, String(name), createdBy == null ? null : Number(createdBy));

    const normalized = normalizeRecipeData(initialData);
    database
      .prepare(
        `insert into recipe_versions (recipe_id, version, status, data_json, created_by)
         values (?, ?, 'draft', ?, ?)`
      )
      .run(recipeId, 1, JSON.stringify(normalized), createdBy == null ? null : Number(createdBy));

    database.exec('commit;');
  } catch (err) {
    database.exec('rollback;');
    throw err;
  }

  return { recipe: await getRecipeById(recipeId) };
}

export async function createRecipeVersion({ recipeId, createdBy, data }) {
  await initChefDb();
  const database = openDb();
  const recipe = await getRecipeById(recipeId);
  if (!recipe) return null;

  const row = database
    .prepare(`select coalesce(max(version), 0) as maxVersion from recipe_versions where recipe_id = ?`)
    .get(String(recipeId));
  const nextVersion = Number(row?.maxVersion ?? 0) + 1;

  const normalized = normalizeRecipeData(data);
  database
    .prepare(
      `insert into recipe_versions (recipe_id, version, status, data_json, created_by)
       values (?, ?, 'draft', ?, ?)`
    )
    .run(String(recipeId), nextVersion, JSON.stringify(normalized), createdBy == null ? null : Number(createdBy));

  return getRecipeVersion({ recipeId, version: nextVersion });
}

export async function updateDraftRecipeVersion({ recipeId, version, updatedBy, data }) {
  await initChefDb();
  const database = openDb();

  const existing = await getRecipeVersion({ recipeId, version });
  if (!existing) return null;
  if (existing.status !== 'draft') return 'not_draft';

  const normalized = normalizeRecipeData(data);
  database
    .prepare(
      `update recipe_versions
       set data_json = ?, updated_by = ?, updated_at = datetime('now')
       where recipe_id = ? and version = ?`
    )
    .run(
      JSON.stringify(normalized),
      updatedBy == null ? null : Number(updatedBy),
      String(recipeId),
      Number(version)
    );

  return getRecipeVersion({ recipeId, version });
}

export async function releaseRecipeVersion({ recipeId, version, releasedBy }) {
  await initChefDb();
  const database = openDb();

  const existing = await getRecipeVersion({ recipeId, version });
  if (!existing) return null;
  if (existing.status !== 'draft') return 'not_draft';

  database
    .prepare(
      `update recipe_versions
       set status = 'released',
           released_by = ?,
           released_at = datetime('now')
       where recipe_id = ? and version = ?`
    )
    .run(releasedBy == null ? null : Number(releasedBy), String(recipeId), Number(version));

  return getRecipeVersion({ recipeId, version });
}
