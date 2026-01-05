import { createPasswordHash, verifyPassword } from './auth.crypto.js';
import { createSupabaseClient, hasSupabaseConfig } from './supabase.js';

let sqliteAuthStorePromise = null;
async function loadSqliteAuthStore() {
  if (!sqliteAuthStorePromise) sqliteAuthStorePromise = import('./auth.store.sqlite.js');
  return sqliteAuthStorePromise;
}

function normalizeRole(role) {
  const r = String(role ?? '').trim().toLowerCase();
  if (r === 'manager') return 'manager';
  if (r === 'chef') return 'chef';
  if (r === 'cook') return 'cook';
  return null;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email ?? '').trim());
}

export function resolveAuthSecret() {
  const secret = String(process.env.AUTH_SECRET ?? '').trim();
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production') return null;
  return 'dev-secret-change-me';
}

export async function ensureBootstrapManager() {
  const store = await loadSqliteAuthStore();
  const count = await store.countUsersByRole('manager');
  if (count > 0) return;

  const username = String(process.env.BOOTSTRAP_MANAGER_USERNAME ?? 'manager').trim();
  const password = String(process.env.BOOTSTRAP_MANAGER_PASSWORD ?? 'manager123').trim();
  const { saltB64, hashB64 } = createPasswordHash(password);
  await store.createUser({
    username,
    role: 'manager',
    passwordSaltB64: saltB64,
    passwordHashB64: hashB64,
  });
}

export async function authenticateUser({ username, password }) {
  const store = await loadSqliteAuthStore();
  const row = await store.getUserByUsername(username);
  if (!row) return null;

  const ok = verifyPassword(password, { saltB64: row.password_salt_b64, hashB64: row.password_hash_b64 });
  if (!ok) return null;

  return { id: row.id, username: row.username, role: row.role };
}

export async function getUserByEmail(email) {
  const store = await loadSqliteAuthStore();
  return store.getUserByEmail(String(email));
}

export async function getUserBySupabaseUserId(supabaseUserId) {
  const store = await loadSqliteAuthStore();
  return store.getUserBySupabaseUserId(String(supabaseUserId));
}

export async function attachSupabaseUserId({ userId, supabaseUserId }) {
  const store = await loadSqliteAuthStore();
  return store.attachSupabaseUserId({ userId, supabaseUserId });
}

export async function createManagedUser({ username, password, role }) {
  const normalizedRole = normalizeRole(role);
  if (!normalizedRole || normalizedRole === 'manager') {
    const err = new Error('invalid_role');
    err.code = 'invalid_role';
    throw err;
  }

  const resolvedUsername = String(username ?? '').trim();
  const email = isValidEmail(resolvedUsername) ? resolvedUsername : null;

  let supabaseUserId = null;
  if (email && hasSupabaseConfig()) {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: normalizedRole },
    });

    if (error) {
      // If user already exists, fetch their ID to recover
      if (error.message && (error.message.includes('already registered') || error.status === 422)) {
        console.log('User already exists, attempting to recover ID...');
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

        if (listError) {
          const err = new Error('supabase_email_taken');
          err.code = 'supabase_email_taken';
          throw err;
        }

        const existingUser = users.find(u => u.email === email);
        if (existingUser) {
          console.log('Found existing user ID:', existingUser.id);
          supabaseUserId = existingUser.id;
        } else {
          const err = new Error('supabase_email_taken');
          err.code = 'supabase_email_taken';
          throw err;
        }
      } else {
        throw error;
      }
    } else {
      supabaseUserId = data?.user?.id ?? null;
    }

    // Upsert into profiles table
    if (supabaseUserId) {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: supabaseUserId,
          email,
          role: normalizedRole,
        });

      if (profileError) {
        console.error('Failed to create profile:', profileError);
        // We continue even if profile creation fails, as the auth user was created/found
      }
    }
  }

  const { saltB64, hashB64 } = createPasswordHash(password);
  const store = await loadSqliteAuthStore();
  try {
    if (email || supabaseUserId) {
      return await store.createUserWithIdentity({
        username: resolvedUsername,
        email,
        supabaseUserId,
        role: normalizedRole,
        passwordSaltB64: saltB64,
        passwordHashB64: hashB64,
      });
    }
    return await store.createUser({
      username: resolvedUsername,
      role: normalizedRole,
      passwordSaltB64: saltB64,
      passwordHashB64: hashB64,
    });
  } catch (e) {
    // If local creation fails but Supabase succeeded (new user), we might want to cleanup, 
    // but for "recovery" mode (existing user) we absolutely should NOT delete the user.
    // Since we can't easily distinguish safely here, we'll skip the deletion to be safe.

    if (String(e?.message || '').toLowerCase().includes('unique')) {
      const err = new Error('username_taken');
      err.code = 'username_taken';
      throw err;
    }
    throw e;
  }
}

export async function getUserById(id) {
  const store = await loadSqliteAuthStore();
  return store.getUserById(id);
}

export async function listUsers() {
  const store = await loadSqliteAuthStore();
  return store.listUsers();
}
