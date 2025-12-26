import path from 'node:path';
import { promises as fs } from 'node:fs';
import { hasSupabaseConfig } from './supabase.js';

const dataDir = path.join(process.cwd(), 'data');
const menuPath = path.join(dataDir, 'menu.json');
const statePath = path.join(dataDir, 'cook-state.json');

let supabaseStorePromise = null;
async function loadSupabaseStore() {
  if (!supabaseStorePromise) supabaseStorePromise = import('./store.supabase.js');
  return supabaseStorePromise;
}

let sqliteStorePromise = null;
async function loadSqliteStore() {
  if (!sqliteStorePromise) sqliteStorePromise = import('./store.sqlite.js');
  return sqliteStorePromise;
}

function getStoreMode() {
  const mode = String(process.env.STORE ?? '').trim().toLowerCase();
  if (mode) return mode;
  if (hasSupabaseConfig()) return 'supabase';
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

async function getMenuFromFiles() {
  await ensureDataDir();
  return readJsonFile(menuPath, {
    items: [
      { id: 'm1', name: 'Grilled Salmon', minutes: 25 },
      { id: 'm2', name: 'Caesar Salad', minutes: 15 },
      { id: 'm3', name: 'Pasta Carbonara', minutes: 30 },
      { id: 'm4', name: 'Beef Wellington', minutes: 45 }
    ]
  });
}

async function getCookStateByDateFromFiles(date) {
  await ensureDataDir();
  const base = await readJsonFile(statePath, { byDate: {} });
  const day = base.byDate[date] ?? { selectedMenuIds: [], doneIds: [] };
  return { base, day };
}

async function setCookStateByDateFromFiles(date, nextDayState) {
  await ensureDataDir();
  const base = await readJsonFile(statePath, { byDate: {} });
  base.byDate[date] = nextDayState;
  await writeJsonFile(statePath, base);
  return base.byDate[date];
}

export async function getMenu() {
  const mode = getStoreMode();
  if (mode === 'supabase') {
    const store = await loadSupabaseStore();
    return store.getMenu();
  }
  if (mode === 'sqlite') {
    const store = await loadSqliteStore();
    return store.getMenu();
  }
  return getMenuFromFiles();
}

export async function getCookStateByDate(date) {
  const mode = getStoreMode();
  if (mode === 'supabase') {
    const store = await loadSupabaseStore();
    return store.getCookStateByDate(date);
  }
  if (mode === 'sqlite') {
    const store = await loadSqliteStore();
    return store.getCookStateByDate(date);
  }
  return getCookStateByDateFromFiles(date);
}

export async function setCookStateByDate(date, nextDayState) {
  const mode = getStoreMode();
  if (mode === 'supabase') {
    const store = await loadSupabaseStore();
    return store.setCookStateByDate(date, nextDayState);
  }
  if (mode === 'sqlite') {
    const store = await loadSqliteStore();
    return store.setCookStateByDate(date, nextDayState);
  }
  return setCookStateByDateFromFiles(date, nextDayState);
}
