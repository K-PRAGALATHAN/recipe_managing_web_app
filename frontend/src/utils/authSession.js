import { authStorage, getRememberPreference, setRememberPreference } from './authStorage';

const SESSION_KEY = 'recipe_manager_session_v1';

const safe = (fn, fallback) => {
  try {
    return fn();
  } catch {
    return fallback;
  }
};

export function loadAuthSession() {
  const raw = safe(() => authStorage.getItem(SESSION_KEY), null);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed?.token || !parsed?.user?.role) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveAuthSession(session, { remember } = {}) {
  if (typeof remember === 'boolean') setRememberPreference(remember);
  const payload = { token: String(session?.token ?? ''), user: session?.user ?? null };
  if (!payload.token || !payload.user?.role) return;
  safe(() => authStorage.setItem(SESSION_KEY, JSON.stringify(payload)));
}

export function clearAuthSession() {
  safe(() => authStorage.removeItem(SESSION_KEY));
}

export function getSessionToken() {
  return loadAuthSession()?.token ?? null;
}

export function getRemember() {
  return getRememberPreference();
}

