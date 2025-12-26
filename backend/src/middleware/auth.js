import { resolveAuthSecret, getUserById } from '../lib/auth.store.js';
import { verifyAuthToken } from '../lib/auth.crypto.js';

export function requireAuth(req, res, next) {
  const header = String(req.headers.authorization ?? '');
  const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
  const secret = resolveAuthSecret();
  if (!token || !secret) return res.status(401).json({ error: 'unauthorized' });

  const payload = verifyAuthToken(token, secret);
  if (!payload?.sub) return res.status(401).json({ error: 'unauthorized' });

  req.auth = { token, payload };
  next();
}

export function requireRole(roles) {
  const allowed = new Set((Array.isArray(roles) ? roles : [roles]).map((r) => String(r).toLowerCase()));
  return (req, res, next) => {
    (async () => {
      if (!req.auth?.payload?.sub) return res.status(401).json({ error: 'unauthorized' });

      const user = await getUserById(req.auth.payload.sub);
      if (!user) return res.status(401).json({ error: 'unauthorized' });

      if (!allowed.has(String(user.role).toLowerCase())) return res.status(403).json({ error: 'forbidden' });
      req.user = user;
      next();
    })().catch(next);
  };
}
