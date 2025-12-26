import React, { useEffect, useMemo, useState } from 'react';
import AppInner from './components/app.jsx';
import LoginPage from './components/LoginPage.jsx';
import OAuthCallback from './components/OAuthCallback.jsx';
import { clearAuthSession, getRemember, loadAuthSession, saveAuthSession } from './utils/authSession';
import { loginWithSupabase } from './utils/authApi';
import { toUiRole, toUiRoleOrDefault } from './utils/roles';
import { supabase } from './utils/supabaseClient';

const App = () => {
  const [authSession, setAuthSession] = useState(() => loadAuthSession());
  const [initialError, setInitialError] = useState('');
  const remember = useMemo(() => getRemember(), [authSession]);

  useEffect(() => {
    if (!authSession) return;
    const uiRole = toUiRole(authSession.user?.role);
    if (uiRole) return;
    clearAuthSession();
    setAuthSession(null);
    setInitialError('Your account role is not recognized. Ask the manager to recreate your user.');
  }, [authSession]);

  const finishOAuthLogin = async () => {
    try {
      if (!supabase) {
        setInitialError('Authentication is not configured.');
        return;
      }

      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;

      const accessToken = data?.session?.access_token ?? '';
      if (!accessToken) {
        setInitialError("We couldn't finish Google sign-in. Please try again.");
        return;
      }

      const { token, user } = await loginWithSupabase({ accessToken });
      const uiRole = toUiRole(user?.role);
      if (!uiRole) {
        setInitialError('Your account role is not recognized. Ask the manager to recreate your user.');
        return;
      }

      const session = { token, user };
      saveAuthSession(session, { remember: true });
      setAuthSession(session);
      setInitialError('');
    } catch (err) {
      if (import.meta.env.DEV) console.error(err);
      if (String(err?.message) === 'no_account') {
        setInitialError('No account found for this Google login. Ask the manager to create your user.');
      } else {
        setInitialError("We couldn't finish Google sign-in. Please try again.");
      }
    } finally {
      try {
        window.history.replaceState({}, document.title, '/');
      } catch {
        // ignore
      }
    }
  };

  if (typeof window !== 'undefined' && window.location?.pathname === '/oauth/callback') {
    return <OAuthCallback onComplete={finishOAuthLogin} />;
  }

  const appSession = useMemo(() => {
    if (!authSession) return null;
    return {
      email: authSession.user?.username ?? '',
      role: toUiRoleOrDefault(authSession.user?.role, 'Cook'),
      remember: Boolean(remember),
      jwt: authSession.token,
      user: authSession.user,
    };
  }, [authSession, remember]);

  if (!appSession) {
    return (
      <LoginPage
        initialError={initialError}
        onSuccess={({ token, user, remember: rememberPref }) => {
          const uiRole = toUiRole(user?.role);
          if (!uiRole) {
            setInitialError('Your account role is not recognized. Ask the manager to recreate your user.');
            return;
          }
          setInitialError('');
          const session = { token, user };
          saveAuthSession(session, { remember: Boolean(rememberPref) });
          setAuthSession(session);
        }}
      />
    );
  }

  return (
    <AppInner
      session={appSession}
      onLogout={() => {
        clearAuthSession();
        setAuthSession(null);
      }}
    />
  );
};

export default App;
