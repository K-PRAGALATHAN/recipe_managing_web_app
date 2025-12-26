import React, { useEffect, useState } from 'react';
import AppInner from './components/app.jsx';
import LoginPage from './components/LoginPage.jsx';
import { supabase } from './utils/supabaseClient';

const AUTH_STORAGE_KEY = 'recipe_manager_auth';
const ROLES = ['Manager', 'Chef', 'Cook'];

const normalizeRole = (role) => (ROLES.includes(role) ? role : 'Cook');

// Role Selection Component for OAuth users
const RoleSelectionModal = ({ email, onSelectRole }) => {
  const [selectedRole, setSelectedRole] = useState('Cook');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome!</h2>
        <p className="text-slate-600 mb-2">Signed in as: <span className="font-semibold text-orange-600">{email}</span></p>
        <p className="text-slate-600 mb-6">Please select your role to continue:</p>
        <div className="space-y-3 mb-6">
          {ROLES.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setSelectedRole(role)}
              className={`w-full rounded-xl border-2 p-4 text-left font-semibold transition ${
                selectedRole === role
                  ? 'border-orange-500 bg-orange-50 text-orange-700'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-orange-300'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-500 mb-6">
          Manager can view Chef + Cook, Chef can view Cook.
        </p>
        <button
          type="button"
          onClick={() => onSelectRole(selectedRole)}
          className="w-full rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 px-4 py-3 font-semibold text-white shadow-lg transition hover:from-orange-700 hover:to-amber-600"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

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

  const [pendingOAuthUser, setPendingOAuthUser] = useState(null);

  // Check for OAuth session on mount and handle redirect
  useEffect(() => {
    const checkOAuthSession = async () => {
      try {
        // Check for OAuth callback in URL hash or query params
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const queryParams = new URLSearchParams(window.location.search);
        
        // Check if this is an OAuth callback
        if (hashParams.get('access_token') || queryParams.get('code')) {
          // Get the session after OAuth redirect
          const { data: { session: oauthSession }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('Error getting OAuth session:', sessionError);
            return;
          }
          
          if (oauthSession?.user && !session) {
            // Extract email from Google account - use email from user metadata or user.email
            const userEmail = oauthSession.user.email || 
                             oauthSession.user.user_metadata?.email ||
                             oauthSession.user.user_metadata?.full_name?.split(' ')[0] + '@gmail.com';
            
            if (!userEmail) {
              console.error('No email found in OAuth session');
              return;
            }
            
            // User just logged in via OAuth but hasn't selected a role yet
            setPendingOAuthUser({
              email: userEmail,
              user: oauthSession.user,
            });
            
            // Clear the OAuth hash/query from URL
            window.history.replaceState(null, '', window.location.pathname);
          }
        } else {
          // Regular session check (not OAuth callback)
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          if (currentSession?.user && !session) {
            const userEmail = currentSession.user.email || 
                             currentSession.user.user_metadata?.email;
            if (userEmail) {
              setPendingOAuthUser({
                email: userEmail,
                user: currentSession.user,
              });
            }
          }
        }
      } catch (error) {
        console.error('Error checking OAuth session:', error);
      }
    };

    checkOAuthSession();

    // Listen for auth state changes (e.g., OAuth redirect)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, oauthSession) => {
      if (event === 'SIGNED_IN' && oauthSession?.user && !session) {
        // Extract email from Google account
        const userEmail = oauthSession.user.email || 
                         oauthSession.user.user_metadata?.email ||
                         oauthSession.user.user_metadata?.full_name?.split(' ')[0] + '@gmail.com';
        
        if (userEmail) {
          setPendingOAuthUser({
            email: userEmail,
            user: oauthSession.user,
          });
        }
      }
      
      if (event === 'SIGNED_OUT') {
        setPendingOAuthUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [session]);

  const handleOAuthRoleSelection = (role) => {
    if (pendingOAuthUser) {
      setSession({
        email: pendingOAuthUser.email,
        role: normalizeRole(role),
        remember: true,
        createdAt: Date.now(),
        user: pendingOAuthUser.user,
      });
      setPendingOAuthUser(null);
    }
  };

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

  // Show role selection if user logged in via OAuth
  if (pendingOAuthUser) {
    return (
      <RoleSelectionModal
        email={pendingOAuthUser.email}
        onSelectRole={handleOAuthRoleSelection}
      />
    );
  }

  if (!session) {
    return (
      <LoginPage
        onSuccess={({ email, role, remember, user }) => {
          setSession({ 
            email, 
            role: normalizeRole(role), 
            remember, 
            createdAt: Date.now(),
            user 
          });
        }}
      />
    );
  }

  return (
    <AppInner
      session={session}
      onLogout={async () => {
        // Sign out from Supabase if there's a Supabase session
        try {
          await supabase.auth.signOut();
        } catch (error) {
          console.error('Error signing out:', error);
        }
        
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
