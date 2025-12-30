import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookRouter from './routes/cook.js';
import authRouter from './routes/auth.js';
import adminUsersRouter from './routes/admin.users.js';
import chefRouter from './routes/chef.js';

dotenv.config();

export function createApp() {
  const app = express();

  app.disable('x-powered-by');

  app.use(
    cors({
      origin: process.env.CORS_ORIGIN?.split(',').map((s) => s.trim()).filter(Boolean) ?? true,
      credentials: true,
    })
  );
  app.use(express.json({ limit: '1mb' }));

  app.get('/', (_req, res) =>
    res.json({
      name: 'rmwa-backend',
      ok: true,
      endpoints: [
        '/health',
        '/api/auth/login',
        '/api/auth/me',
        '/api/auth/supabase',
        '/api/admin/users',
        '/api/chef/recipes',
        '/api/chef/recipes/:id',
        '/api/cook/menu',
        '/api/cook/status?date=YYYY-MM-DD',
      ],
    })
  );
  app.get('/health', (_req, res) => res.json({ ok: true }));
  app.use('/api/auth', authRouter);
  app.use('/api/admin', adminUsersRouter);
  app.use('/api/chef', chefRouter);
  app.use('/api/cook', cookRouter);

  app.use((_req, res) => res.status(404).json({ error: 'not_found' }));

  app.use((err, _req, res, _next) => {
    // eslint-disable-next-line no-console
    console.error(err);
    res.status(500).json({ error: 'internal_error' });
  });

  return app;
}
