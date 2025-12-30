import path from 'node:path';
import { promises as fs } from 'node:fs';

const dataDir = path.join(process.cwd(), 'data');
const recipesPath = path.join(dataDir, 'chef-recipes.json');

let sqliteStorePromise = null;
async function loadSqliteStore() {
  if (!sqliteStorePromise) sqliteStorePromise = import('./chef.store.sqlite.js');
  return sqliteStorePromise;
}

function getChefStoreMode() {
  const mode = String(process.env.CHEF_STORE ?? '').trim().toLowerCase();
  if (mode) return mode;
  return 'sqlite';
}

async function ensureDataDir() {
  await fs.mkdir(dataDir, { recursive: true });
}

async function readJsonFile(filePath, fallbackValue) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    if (err?.code !== 'ENOENT') throw err;
    await fs.writeFile(filePath, JSON.stringify(fallbackValue, null, 2), 'utf8');
    return fallbackValue;
  }
}

async function writeJsonFile(filePath, value) {
  await fs.writeFile(filePath, JSON.stringify(value, null, 2), 'utf8');
}

async function listRecipesFromFiles() {
  await ensureDataDir();
  const base = await readJsonFile(recipesPath, { recipes: [] });
  return Array.isArray(base?.recipes) ? base.recipes : [];
}

async function getRecipeByIdFromFiles(id) {
  const recipes = await listRecipesFromFiles();
  return recipes.find((r) => r.id === id) ?? null;
}

async function saveRecipeToFiles(recipe) {
  await ensureDataDir();
  const base = await readJsonFile(recipesPath, { recipes: [] });
  const recipes = Array.isArray(base?.recipes) ? base.recipes : [];
  const idx = recipes.findIndex((r) => r.id === recipe.id);
  if (idx >= 0) recipes[idx] = recipe;
  else recipes.push(recipe);
  await writeJsonFile(recipesPath, { recipes });
  return recipe;
}

export async function listRecipes() {
  const mode = getChefStoreMode();
  if (mode === 'sqlite') {
    const store = await loadSqliteStore();
    return store.listRecipes();
  }
  return listRecipesFromFiles();
}

export async function getRecipeById(id) {
  const mode = getChefStoreMode();
  if (mode === 'sqlite') {
    const store = await loadSqliteStore();
    return store.getRecipeById(id);
  }
  return getRecipeByIdFromFiles(id);
}

export async function getRecipeVersion({ recipeId, version }) {
  const mode = getChefStoreMode();
  if (mode === 'sqlite') {
    const store = await loadSqliteStore();
    return store.getRecipeVersion({ recipeId, version });
  }
  const recipe = await getRecipeByIdFromFiles(recipeId);
  if (!recipe) return null;
  return recipe.versions?.find((v) => Number(v.version) === Number(version)) ?? null;
}

export async function createRecipe({ name, createdBy, initialData }) {
  const mode = getChefStoreMode();
  if (mode === 'sqlite') {
    const store = await loadSqliteStore();
    return store.createRecipe({ name, createdBy, initialData });
  }

  const recipe = {
    id: `r_${Math.random().toString(16).slice(2)}`,
    name: String(name),
    createdBy: Number(createdBy) || null,
    createdAt: new Date().toISOString(),
    versions: [
      {
        version: 1,
        status: 'draft',
        data: initialData ?? { portions: null, yield: null, ingredients: [], steps: [] },
        createdBy: Number(createdBy) || null,
        createdAt: new Date().toISOString(),
        releasedBy: null,
        releasedAt: null,
      },
    ],
  };
  await saveRecipeToFiles(recipe);
  return { recipe };
}

export async function createRecipeVersion({ recipeId, createdBy, data }) {
  const mode = getChefStoreMode();
  if (mode === 'sqlite') {
    const store = await loadSqliteStore();
    return store.createRecipeVersion({ recipeId, createdBy, data });
  }

  const recipe = await getRecipeByIdFromFiles(recipeId);
  if (!recipe) return null;
  const versions = Array.isArray(recipe.versions) ? recipe.versions : [];
  const nextVersion = versions.reduce((m, v) => Math.max(m, Number(v.version) || 0), 0) + 1;
  const v = {
    version: nextVersion,
    status: 'draft',
    data: data ?? { portions: null, yield: null, ingredients: [], steps: [] },
    createdBy: Number(createdBy) || null,
    createdAt: new Date().toISOString(),
    releasedBy: null,
    releasedAt: null,
  };
  recipe.versions = [...versions, v];
  await saveRecipeToFiles(recipe);
  return v;
}

export async function updateDraftRecipeVersion({ recipeId, version, updatedBy, data }) {
  const mode = getChefStoreMode();
  if (mode === 'sqlite') {
    const store = await loadSqliteStore();
    return store.updateDraftRecipeVersion({ recipeId, version, updatedBy, data });
  }

  const recipe = await getRecipeByIdFromFiles(recipeId);
  if (!recipe) return null;
  const idx = recipe.versions?.findIndex((v) => Number(v.version) === Number(version));
  if (idx == null || idx < 0) return null;
  if (recipe.versions[idx].status !== 'draft') return 'not_draft';
  recipe.versions[idx] = {
    ...recipe.versions[idx],
    data: data ?? recipe.versions[idx].data,
    updatedBy: Number(updatedBy) || null,
    updatedAt: new Date().toISOString(),
  };
  await saveRecipeToFiles(recipe);
  return recipe.versions[idx];
}

export async function releaseRecipeVersion({ recipeId, version, releasedBy }) {
  const mode = getChefStoreMode();
  if (mode === 'sqlite') {
    const store = await loadSqliteStore();
    return store.releaseRecipeVersion({ recipeId, version, releasedBy });
  }

  const recipe = await getRecipeByIdFromFiles(recipeId);
  if (!recipe) return null;
  const idx = recipe.versions?.findIndex((v) => Number(v.version) === Number(version));
  if (idx == null || idx < 0) return null;
  if (recipe.versions[idx].status !== 'draft') return 'not_draft';
  recipe.versions[idx] = {
    ...recipe.versions[idx],
    status: 'released',
    releasedBy: Number(releasedBy) || null,
    releasedAt: new Date().toISOString(),
  };
  await saveRecipeToFiles(recipe);
  return recipe.versions[idx];
}

