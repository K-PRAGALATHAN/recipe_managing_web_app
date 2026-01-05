import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  createRecipe,
  createRecipeVersion,
  deleteRecipe,
  getRecipeById,
  getRecipeVersion,
  listRecipes,
  releaseRecipeVersion,
  updateDraftRecipeVersion,
} from '../lib/chef.store.js';

const router = Router();

router.use(requireAuth, requireRole(['manager', 'chef']));

router.get('/recipes', async (_req, res, next) => {
  try {
    const recipes = await listRecipes();
    res.json({ recipes });
  } catch (err) {
    next(err);
  }
});

router.post('/recipes', async (req, res, next) => {
  try {
    const name = String(req.body?.name ?? '').trim();
    if (!name) return res.status(400).json({ error: 'invalid_payload' });

    const initial = normalizeRecipeData(req.body);
    const created = await createRecipe({ name, createdBy: req.user.id, initialData: initial });
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

router.delete('/recipes/:id', async (req, res, next) => {
  try {
    const id = String(req.params.id ?? '').trim();
    if (!id) return res.status(400).json({ error: 'invalid_id' });

    await deleteRecipe(id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.get('/recipes/:id', async (req, res, next) => {
  try {
    const id = String(req.params.id ?? '').trim();
    if (!id) return res.status(400).json({ error: 'invalid_recipe_id' });

    const recipe = await getRecipeById(id);
    if (!recipe) return res.status(404).json({ error: 'not_found' });
    res.json({ recipe });
  } catch (err) {
    next(err);
  }
});

router.get('/recipes/:id/versions/:version', async (req, res, next) => {
  try {
    const recipeId = String(req.params.id ?? '').trim();
    const version = Number(req.params.version);
    if (!recipeId || !Number.isFinite(version)) return res.status(400).json({ error: 'invalid_params' });

    const v = await getRecipeVersion({ recipeId, version });
    if (!v) return res.status(404).json({ error: 'not_found' });
    res.json({ version: v });
  } catch (err) {
    next(err);
  }
});

router.post('/recipes/:id/versions', async (req, res, next) => {
  try {
    const recipeId = String(req.params.id ?? '').trim();
    if (!recipeId) return res.status(400).json({ error: 'invalid_recipe_id' });

    const data = normalizeRecipeData(req.body);
    const created = await createRecipeVersion({ recipeId, createdBy: req.user.id, data });
    if (!created) return res.status(404).json({ error: 'not_found' });
    res.status(201).json({ version: created });
  } catch (err) {
    next(err);
  }
});

router.put('/recipes/:id/versions/:version', async (req, res, next) => {
  try {
    const recipeId = String(req.params.id ?? '').trim();
    const version = Number(req.params.version);
    if (!recipeId || !Number.isFinite(version)) return res.status(400).json({ error: 'invalid_params' });

    const data = normalizeRecipeData(req.body);
    const updated = await updateDraftRecipeVersion({ recipeId, version, updatedBy: req.user.id, data });
    if (!updated) return res.status(404).json({ error: 'not_found' });
    if (updated === 'not_draft') return res.status(409).json({ error: 'version_not_draft' });
    res.json({ version: updated });
  } catch (err) {
    next(err);
  }
});

router.post('/recipes/:id/versions/:version/release', async (req, res, next) => {
  try {
    const recipeId = String(req.params.id ?? '').trim();
    const version = Number(req.params.version);
    if (!recipeId || !Number.isFinite(version)) return res.status(400).json({ error: 'invalid_params' });

    const released = await releaseRecipeVersion({ recipeId, version, releasedBy: req.user.id });
    if (!released) return res.status(404).json({ error: 'not_found' });
    if (released === 'not_draft') return res.status(409).json({ error: 'version_not_draft' });
    res.json({ version: released });
  } catch (err) {
    next(err);
  }
});

function normalizeRecipeData(body) {
  const servings = body?.servings == null ? null : Number(body.servings);
  const portions = body?.portions == null ? (Number.isFinite(servings) ? servings : null) : Number(body.portions);
  const yieldAmount = body?.yield == null ? null : Number(body.yield);
  const prepMinutes = body?.prepMinutes == null ? null : Number(body.prepMinutes);
  const cookMinutes = body?.cookMinutes == null ? null : Number(body.cookMinutes);
  const tags = Array.isArray(body?.tags) ? body.tags.map((t) => String(t ?? '').trim()).filter(Boolean) : [];

  const ingredients = Array.isArray(body?.ingredients)
    ? body.ingredients
      .map((i) => {
        if (typeof i === 'string') {
          return { name: i.trim(), quantity: null, unit: '' };
        }
        return {
          name: String(i?.name ?? '').trim(),
          quantity: i?.quantity == null ? null : Number(i.quantity),
          unit: String(i?.unit ?? '').trim(),
        };
      })
      .filter((i) => i.name)
    : [];

  const steps = Array.isArray(body?.steps)
    ? body.steps.map((s) => String(s ?? '').trim()).filter(Boolean)
    : [];

  return {
    description: body?.description == null ? null : String(body.description).trim() || null,
    category: body?.category == null ? null : String(body.category).trim() || null,
    imageUrl: body?.imageUrl == null ? null : String(body.imageUrl).trim() || null,
    prepMinutes: Number.isFinite(prepMinutes) ? prepMinutes : null,
    cookMinutes: Number.isFinite(cookMinutes) ? cookMinutes : null,
    servings: Number.isFinite(servings) ? servings : null,
    portions: Number.isFinite(portions) ? portions : null,
    yield: Number.isFinite(yieldAmount) ? yieldAmount : null,
    tags,
    ingredients,
    steps,
  };
}

export default router;
