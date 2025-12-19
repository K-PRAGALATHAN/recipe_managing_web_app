import React, { useEffect, useState } from 'react';
import AppInner from './components/app.jsx';
import LoginPage from './components/LoginPage.jsx';

const AUTH_STORAGE_KEY = 'recipe_manager_auth';
const ROLES = ['Manager', 'Chef', 'Cook'];

const normalizeRole = (role) => (ROLES.includes(role) ? role : 'Cook');

const App = () => {
  const [session, setSession] = useState(() => {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return null;
      return { ...parsed, role: normalizeRole(parsed.role) };
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (!session) return;

    if (!session.remember) {
      try {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      } catch {
        // ignore
      }
      return;
    }

    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    } catch {
      // ignore storage failures (private mode, quota, etc.)
    }
  }, [session]);

  if (!session) {
    return (
      <LoginPage
        onSuccess={({ email, role, remember }) => {
          setSession({ email, role: normalizeRole(role), remember, createdAt: Date.now() });
        }}
      />
    );
  }

  return (
    <AppInner
      session={session}
      onLogout={() => {
        setSession(null);
        try {
          localStorage.removeItem(AUTH_STORAGE_KEY);
        } catch {
          // ignore
        }
      }}
    />
  );
};

export default App;
