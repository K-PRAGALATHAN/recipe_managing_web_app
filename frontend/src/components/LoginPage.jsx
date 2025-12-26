import React, { useEffect, useMemo, useState } from 'react';
import { ChefHat, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { login } from '../utils/authApi';
import { setRememberPreference } from '../utils/authStorage';
import { supabase } from '../utils/supabaseClient';

function GoogleIcon(props) {
  return (
    <svg viewBox="0 0 48 48" {...props}>
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303C33.656 32.659 29.161 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.954 4 4 12.954 4 24s8.954 20 20 20 20-8.954 20-20c0-1.341-.138-2.651-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 16.108 18.96 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.141 0-9.624-3.317-11.28-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303c-.792 2.238-2.231 4.166-4.084 5.57l.003-.002 6.19 5.238C36.973 39.205 44 34 44 24c0-1.341-.138-2.651-.389-3.917z"
      />
    </svg>
  );
}

export default function LoginPage({ onSuccess, initialError = '' }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialError) setError(initialError);
  }, [initialError]);

  const canSubmit = useMemo(() => Boolean(username.trim() && password.trim()), [username, password]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please enter your username and password.');
      return;
    }

    try {
      setRememberPreference(remember);
      const { token, user } = await login({ username: username.trim(), password });
      onSuccess?.({ token, user, remember });
    } catch (err) {
      if (import.meta.env.DEV) console.error(err);
      if (String(err?.message) === 'invalid_credentials') setError('Invalid username or password.');
      else if (String(err?.message) === 'server_missing_auth_secret')
        setError('Server is missing AUTH_SECRET. Configure backend env and try again.');
      else setError("We couldn't sign you in. Please try again.");
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    if (!supabase) {
      setError('Google sign-in is not configured.');
      return;
    }

    try {
      const redirectTo = `${window.location.origin}/oauth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });
      if (error) throw error;
    } catch (err) {
      if (import.meta.env.DEV) console.error(err);
      setError("We couldn't start Google sign-in. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-400 via-orange-500 to-amber-500 px-4 py-10">
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center">
        <div className="mb-6 grid h-20 w-20 place-items-center rounded-full bg-white/95 shadow-lg shadow-orange-900/20">
          <ChefHat className="h-9 w-9 text-orange-500" aria-hidden="true" />
        </div>

        <h1 className="text-center text-4xl font-extrabold tracking-tight text-white">Recipe Manager</h1>
        <p className="mt-2 text-center text-white/90">Sign in to your account</p>

        <div className="mt-10 w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl shadow-orange-900/25">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={!supabase}
            className="mb-6 flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <GoogleIcon className="h-5 w-5" aria-hidden="true" focusable="false" />
            Continue with Google
          </button>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Username</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-slate-900 outline-none ring-orange-300 transition focus:border-orange-400 focus:ring-4"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-12 text-slate-900 outline-none ring-orange-300 transition focus:border-orange-400 focus:ring-4"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
                </button>
              </div>
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
        </div>
      </div>
    </div>
  );
}
