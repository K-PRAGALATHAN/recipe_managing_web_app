const ROLE_KEY = 'recipe_manager_role';

const safe = (fn, fallback) => {
  try {
    return fn();
  } catch {
    return fallback;
  }
};

export const getRolePreference = () => safe(() => localStorage.getItem(ROLE_KEY), null);

export const setRolePreference = (role) => {
  safe(() => {
    if (!role) localStorage.removeItem(ROLE_KEY);
    else localStorage.setItem(ROLE_KEY, String(role));
  });
};

