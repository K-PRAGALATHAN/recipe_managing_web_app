import {
  attachSupabaseUserId,
  authenticateUser,
  changePassword,
  ensureBootstrapManager,
  getUserByEmail,
  getUserById,
  getUserBySupabaseUserId,
  resolveAuthSecret,
} from '../lib/auth.store.js';
import { signAuthToken } from '../lib/auth.crypto.js';
import { requireAuth } from '../middleware/auth.js';
import { createSupabaseClient, hasSupabaseConfig } from '../lib/supabase.js';
import { Router } from 'express';

const router = Router();

router.post('/login', async (req, res, next) => {
  try {
    await ensureBootstrapManager();

    const username = String(req.body?.username ?? '').trim();
    const password = String(req.body?.password ?? '');
    if (!username || !password) return res.status(400).json({ error: 'invalid_payload' });

    const user = await authenticateUser({ username, password });
    if (!user) return res.status(401).json({ error: 'invalid_credentials' });

    const secret = resolveAuthSecret();
    if (!secret) return res.status(500).json({ error: 'server_missing_auth_secret' });

    const token = signAuthToken({ sub: user.id, role: user.role, username: user.username }, secret);
    res.json({ token, user });
  } catch (err) {
    next(err);
  }
});

router.post('/supabase', async (req, res, next) => {
  try {
    console.log('[auth] /supabase request received');
    await ensureBootstrapManager();

    const accessToken = String(req.body?.accessToken ?? '').trim();
    if (!accessToken) {
      console.log('[auth] missing access token');
      return res.status(400).json({ error: 'invalid_payload' });
    }
    if (!hasSupabaseConfig()) {
      console.log('[auth] missing supabase config');
      return res.status(501).json({ error: 'supabase_not_configured' });
    }

    const supabase = createSupabaseClient();
    const { data, error } = await supabase.auth.getUser(accessToken);
    if (error || !data?.user) {
      console.log('[auth] invalid oauth token or no user', error);
      return res.status(401).json({ error: 'invalid_oauth_token' });
    }

    const supabaseUserId = String(data.user.id ?? '').trim();
    const email = String(data.user.email ?? '').trim();
    console.log(`[auth] supabase user found: ${email} (${supabaseUserId})`);

    if (!supabaseUserId) return res.status(401).json({ error: 'invalid_oauth_token' });

    let user = await getUserBySupabaseUserId(supabaseUserId);
    if (!user && email) {
      console.log('[auth] looking up by email');
      user = await getUserByEmail(email);
      if (user && !user.supabaseUserId) {
        console.log('[auth] linking user');
        user = await attachSupabaseUserId({ userId: user.id, supabaseUserId });
      }
    }

    if (!user) {
      console.log('[auth] no local account found');
      return res.status(401).json({ error: 'no_account' });
    }

    const secret = resolveAuthSecret();
    if (!secret) {
      console.log('[auth] missing secret');
      return res.status(500).json({ error: 'server_missing_auth_secret' });
    }

    const token = signAuthToken({ sub: user.id, role: user.role, username: user.username }, secret);
    console.log('[auth] success');
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (err) {
    console.error('[auth] internal error', err);
    next(err);
  }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await getUserById(req.auth.payload.sub);
    if (!user) return res.status(401).json({ error: 'unauthorized' });
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

router.post('/change-password', requireAuth, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'invalid_payload' });
    }

    await changePassword({
      userId: req.auth.payload.sub,
      currentPassword,
      newPassword,
    });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
