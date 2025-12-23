const STORAGE_KEY = 'recipe_manager_demo_session_v1';

export const isLocalDemoEnabled = () => {
  if (!import.meta.env.DEV) return false;
  const flag = import.meta.env.VITE_ENABLE_LOCAL_DEMO;
  return flag == null ? true : String(flag).toLowerCase() !== 'false';
};

export const createDemoAuthSession = ({ email, role }) => {
  return {
    access_token: 'demo-access-token',
    user: {
      email: email ?? '',
      user_metadata: { role: role ?? 'Cook' },
    },
  };
};

export const loadDemoSession = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.user?.email) return null;
    return parsed;
  } catch {
    return null;
  }
};

export const saveDemoSession = (session) => {
  try {
    if (!session) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // ignore
  }
};

export const clearDemoSession = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
};

