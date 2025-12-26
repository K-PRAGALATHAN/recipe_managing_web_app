import { createClient } from '@supabase/supabase-js';

function resolveSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;
  return { url, key };
}

export function hasSupabaseConfig() {
  const { url, key } = resolveSupabaseConfig();
  return Boolean(url && key);
}

export function createSupabaseClient() {
  const { url, key } = resolveSupabaseConfig();
  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY)');
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
