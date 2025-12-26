import { Router } from 'express';
import { createManagedUser, listUsers } from '../lib/auth.store.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth, requireRole('manager'));

router.get('/users', async (_req, res, next) => {
  try {
    const users = await listUsers();
    res.json({ users });
  } catch (err) {
    next(err);
  }
});

router.post('/users', async (req, res, next) => {
  try {
    const username = String(req.body?.username ?? '').trim();
    const password = String(req.body?.password ?? '');
    const role = String(req.body?.role ?? '').trim();
    if (!username || !password || !role) return res.status(400).json({ error: 'invalid_payload' });
    if (password.length < 8) return res.status(400).json({ error: 'weak_password' });

    const user = await createManagedUser({ username, password, role });
    res.status(201).json({ user });
  } catch (err) {
    if (err?.code === 'username_taken') return res.status(409).json({ error: 'username_taken' });
    if (err?.code === 'supabase_email_taken') return res.status(409).json({ error: 'supabase_email_taken' });
    if (err?.code === 'invalid_role') return res.status(400).json({ error: 'invalid_role' });
    next(err);
  }
});

export default router;
