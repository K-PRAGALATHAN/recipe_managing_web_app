const REMEMBER_KEY = 'recipe_manager_remember';

const safe = (fn, fallback) => {
  try {
    return fn();
  } catch {
    return fallback;
  }
};

export const setRememberPreference = (remember) => {
  safe(() => {
    if (remember) localStorage.setItem(REMEMBER_KEY, '1');
    else localStorage.removeItem(REMEMBER_KEY);
  });
};

export const getRememberPreference = () => safe(() => localStorage.getItem(REMEMBER_KEY) === '1', true);

const storageForWrite = () => (getRememberPreference() ? localStorage : sessionStorage);

export const authStorage = {
  getItem: (key) => {
    const preferLocal = getRememberPreference();
    const primary = preferLocal ? localStorage : sessionStorage;
    const secondary = preferLocal ? sessionStorage : localStorage;

    const primaryValue = safe(() => primary.getItem(key), null);
    if (primaryValue != null) return primaryValue;

    return safe(() => secondary.getItem(key), null);
  },
  setItem: (key, value) => {
    safe(() => storageForWrite().setItem(key, value));
  },
  removeItem: (key) => {
    safe(() => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
  },
};

