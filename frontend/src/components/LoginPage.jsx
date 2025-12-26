import React, { useMemo, useState } from 'react';
import { ChefHat, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';

const ROLES = ['Manager', 'Chef', 'Cook'];

export default function LoginPage({ onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Cook');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const canSubmit = useMemo(() => email.trim() && password.trim() && role, [email, password, role]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }

    if (!ROLES.includes(role)) {
      setError('Please choose a role.');
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      // success: inform parent (App persists session and routes based on role)
      onSuccess?.({ email: email.trim(), role, remember, user: data.user });
    } catch (err) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-400 via-orange-500 to-amber-500 px-4 py-10">
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center">
        <div className="mb-6 grid h-20 w-20 place-items-center rounded-full bg-white/95 shadow-lg shadow-orange-900/20">
          <ChefHat className="h-9 w-9 text-orange-500" aria-hidden="true" />
        </div>

        <h1 className="text-center text-4xl font-extrabold tracking-tight text-white">
          Recipe Manager
        </h1>
        <p className="mt-2 text-center text-white/90">Sign in to your account</p>

        <div className="mt-10 w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl shadow-orange-900/25">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Email Address</label>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-3 text-slate-900 outline-none ring-orange-300 transition focus:border-orange-400 focus:ring-4"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Password</label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-12 text-slate-900 outline-none ring-orange-300 transition focus:border-orange-400 focus:ring-4"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Eye className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Role</label>
              <div className="relative">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-10 text-slate-900 outline-none ring-orange-300 transition focus:border-orange-400 focus:ring-4"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <span
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                >
                  ▾
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Manager can view Chef + Cook, Chef can view Cook.
              </p>
            </div>

            <div className="flex items-center justify-between gap-4">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-400"
                />
                Remember me
              </label>
              <button
                type="button"
                className="text-sm font-semibold text-orange-600 transition hover:text-orange-700"
              >
                Forgot password?
              </button>
            </div>

            {error ? (
              <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={!canSubmit}
              className="h-12 w-full rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 font-semibold text-white shadow-lg shadow-orange-600/25 transition hover:from-orange-700 hover:to-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Sign In
            </button>
          </form>

          <div className="mt-6 flex flex-col items-center gap-3">
            <p className="text-sm text-slate-600">Or continue with</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={async () => {
                  setIsGoogleLoading(true);
                  setError('');
                  
                  try {
                    const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
                      provider: 'google',
                      options: {
                        redirectTo: 'http://localhost:5173',
                      },
                    });

                    if (oauthError) {
                      throw oauthError;
                    }
                    // If successful, the user will be redirected to Google, then back to the app
                    // The OAuth callback will be handled in App.jsx
                    // The loading state will remain true until redirect happens
                  } catch (err) {
                    setIsGoogleLoading(false);
                    setError(err.message || 'Failed to sign in with Google. Please try again.');
                  }
                }}
                disabled={isGoogleLoading}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isGoogleLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Sign in with Google
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Demo credentials removed for production */}
        </div>
      </div>
    </div>
  );
}
