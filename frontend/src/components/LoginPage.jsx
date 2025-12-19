import React, { useMemo, useState } from 'react';
import { ChefHat, Eye, EyeOff, Lock, Mail } from 'lucide-react';

const DEMO_EMAIL = 'demo@recipe.com';
const DEMO_PASSWORD = 'password123';
const ROLES = ['Manager', 'Chef', 'Cook'];

export default function LoginPage({ onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Cook');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = useMemo(() => email.trim() && password.trim() && role, [email, password, role]);

  const handleSubmit = (event) => {
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

    onSuccess?.({ email: email.trim(), role, remember });
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

          <div className="mt-8 border-t border-slate-200 pt-6">
            <p className="text-center text-sm font-semibold text-slate-600">Demo Credentials:</p>
            <div className="mt-3 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-slate-600">Email</span>
                <span className="font-mono">{DEMO_EMAIL}</span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="font-medium text-slate-600">Password</span>
                <span className="font-mono">{DEMO_PASSWORD}</span>
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  className="text-sm font-semibold text-orange-600 transition hover:text-orange-700"
                  onClick={() => {
                    setEmail(DEMO_EMAIL);
                    setPassword(DEMO_PASSWORD);
                    setRole('Manager');
                    setError('');
                  }}
                >
                  Use demo
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
