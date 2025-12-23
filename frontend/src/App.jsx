import React, { useEffect, useMemo, useState } from 'react';
import AppInner from './components/app.jsx';
import LoginPage from './components/LoginPage.jsx';
import OAuthCallback from './components/OAuthCallback.jsx';
import { supabase } from './utils/supabaseClient';
import { getRememberPreference } from './utils/authStorage';
import { getRolePreference, setRolePreference } from './utils/authPreferences';
import {
  clearDemoSession,
  createDemoAuthSession,
  isLocalDemoEnabled,
  loadDemoSession,
  saveDemoSession,
} from './utils/demoSession';

const ROLES = ['Manager', 'Chef', 'Cook'];
const normalizeRole = (role) => (ROLES.includes(role) ? role : 'Cook');

const isOAuthCallbackRoute = () => {
  try {
    const { pathname } = window.location;
    return pathname === '/oauth/callback' || pathname === '/auth/callback';
  } catch {
    return false;
  }
};

const stripOAuthParams = () => {
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete('code');
    url.searchParams.delete('error');
    url.searchParams.delete('error_code');
    url.searchParams.delete('error_description');
    url.hash = '';
    window.history.replaceState({}, document.title, url.pathname || '/');
  } catch {
    // ignore
  }
};

const App = () => {
  const initialRole = useMemo(() => normalizeRole(getRolePreference()), []);
  const [role, setRole] = useState(initialRole);
  const [remember, setRemember] = useState(() => getRememberPreference());
  const [authSession, setAuthSession] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    if (!supabase) {
      if (isLocalDemoEnabled()) {
        setAuthSession(loadDemoSession());
      }
      setAuthReady(true);
      return undefined;
    }

    let active = true;

    const init = async () => {
      setAuthError('');

      try {
        const url = new URL(window.location.href);
        const oauthError = url.searchParams.get('error_description') || url.searchParams.get('error');
        if (oauthError) {
          setAuthError(decodeURIComponent(oauthError));
          stripOAuthParams();
        }
      } catch {
        // ignore
      }

      const { data } = await supabase.auth.getSession();
      if (!active) return;

      if (data.session) {
        setAuthSession(data.session);
        stripOAuthParams();
        setAuthReady(true);
        return;
      }

      // Fallback: if detectSessionInUrl didn't exchange the code, do it here.
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (!active) return;
          setAuthSession(data.session ?? null);
          stripOAuthParams();
        }
      } catch {
        // ignore
      } finally {
        if (active) setAuthReady(true);
      }
    };

    init();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthSession(session ?? null);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const roleFromUser = authSession?.user?.user_metadata?.role;
    if (!roleFromUser) return;
    const normalized = normalizeRole(roleFromUser);
    setRole(normalized);
    setRolePreference(normalized);
  }, [authSession]);

  useEffect(() => {
    if (!supabase || !authSession) return;
    const currentRole = authSession.user?.user_metadata?.role;
    if (currentRole === role) return;

    supabase.auth.updateUser({ data: { role } }).catch(() => {
      // ignore (role metadata is best-effort)
    });
  }, [authSession, role]);

  const appSession = useMemo(() => {
    if (!authSession) return null;
    return {
      email: authSession.user?.email ?? '',
      role,
      remember,
      jwt: authSession.access_token,
      user: authSession.user,
    };
  }, [authSession, remember, role]);

  if (isOAuthCallbackRoute()) {
    return (
      <OAuthCallback
        onComplete={() => {
          try {
            window.location.replace('/');
          } catch {
            // ignore
          }
        }}
      />
    );
  }

  if (!authReady && supabase) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-400 via-orange-500 to-amber-500 px-4 py-10">
        <div className="mx-auto w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl shadow-orange-900/25">
          <p className="text-sm font-semibold text-slate-700">Checking your session…</p>
        </div>
      </div>
    );
  }

  if (!appSession) {
    return (
      <LoginPage
        onSuccess={({ role, remember, email, demo }) => {
          const normalized = normalizeRole(role);
          setRole(normalized);
          setRolePreference(normalized);
          setRemember(Boolean(remember));
          setAuthError('');

          if (!supabase && demo) {
            const session = createDemoAuthSession({ email, role: normalized });
            setAuthSession(session);
            saveDemoSession(session);
          }
        }}
        initialError={authError}
      />
    );
  }

  return (
    <AppInner
      session={appSession}
      onLogout={async () => {
        try {
          if (supabase) {
            await supabase.auth.signOut();
          } else {
            clearDemoSession();
          }
        } finally {
          setAuthSession(null);
        }
      }}
    />
  );
};

export default App;
