import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';

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

export default function OAuthCallback({ onComplete }) {
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const run = async () => {
      if (!supabase) {
        if (!active) return;
        setError('Authentication is not configured.');
        return;
      }

      const url = new URL(window.location.href);
      const oauthError = url.searchParams.get('error_description') || url.searchParams.get('error');
      const code = url.searchParams.get('code');

      if (oauthError) {
        if (!active) return;
        setError(decodeURIComponent(oauthError));
        stripOAuthParams();
        return;
      }

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!active) return;
        if (error) setError(error.message || 'Unable to finish OAuth sign-in.');
      }

      stripOAuthParams();
      onComplete?.();
    };

    run();
    return () => {
      active = false;
    };
  }, [onComplete]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-400 via-orange-500 to-amber-500 px-4 py-10">
      <div className="mx-auto flex w-full max-w-md flex-col items-center rounded-2xl bg-white p-8 shadow-2xl shadow-orange-900/25">
        <h1 className="text-center text-2xl font-extrabold tracking-tight text-slate-900">Signing you in…</h1>
        <p className="mt-2 text-center text-sm text-slate-600">Finishing OAuth redirect.</p>
        {error ? (
          <p className="mt-6 w-full rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
