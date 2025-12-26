import { Router } from 'express';
import { resolveISODate } from '../lib/date.js';
import { getMenu, getCookStateByDate, setCookStateByDate } from '../lib/store.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth, requireRole(['manager', 'cook']));

router.get('/menu', async (_req, res, next) => {
  try {
    const menu = await getMenu();
    res.json(menu);
  } catch (err) {
    next(err);
  }
});

router.get('/status', async (req, res, next) => {
  try {
    const date = resolveISODate(req.query.date);
    if (!date) return res.status(400).json({ error: 'invalid_date' });

    const { day } = await getCookStateByDate(date);
    res.json({ date, ...day });
  } catch (err) {
    next(err);
  }
});

router.put('/status', async (req, res, next) => {
  try {
    const date = resolveISODate(req.query.date ?? req.body?.date);
    if (!date) return res.status(400).json({ error: 'invalid_date' });

    const selectedMenuIds = Array.isArray(req.body?.selectedMenuIds) ? req.body.selectedMenuIds : null;
    const doneIds = Array.isArray(req.body?.doneIds) ? req.body.doneIds : null;
    if (!selectedMenuIds || !doneIds) return res.status(400).json({ error: 'invalid_payload' });

    const nextDay = {
      selectedMenuIds: [...new Set(selectedMenuIds.map(String))],
      doneIds: [...new Set(doneIds.map(String))]
    };

    const saved = await setCookStateByDate(date, nextDay);
    res.json({ date, ...saved });
  } catch (err) {
    next(err);
  }
});

export default router;
