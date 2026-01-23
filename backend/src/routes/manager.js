import { Router } from 'express';
<<<<<<< HEAD
import { createSupabaseClient } from '../lib/supabase.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// Ensure only managers can access these routes
router.use(requireAuth, requireRole('manager'));

// -- VENDORS --

router.get('/vendors', async (req, res, next) => {
    try {
        const supabase = createSupabaseClient();
        const { data, error } = await supabase
            .from('vendors')
            .select('*')
            .order('name');

        if (error) throw error;
        res.json({ vendors: data });
=======
import { requireAuth, requireRole } from '../middleware/auth.js';
import * as store from '../lib/manager.store.supabase.js';

const router = Router();

router.use(requireAuth, requireRole(['manager']));

router.get('/vendors', async (_req, res, next) => {
    try {
        const vendors = await store.listVendors();
        // Transform to camelCase for frontend
        const mapped = vendors.map(v => ({
            id: v.id,
            name: v.name,
            contact: v.contact,
            leadTimeDays: v.lead_time_days,
            active: v.active,
            createdAt: v.created_at
        }));
        res.json({ vendors: mapped });
>>>>>>> 37eed91 (Update backend and frontend logic)
    } catch (err) {
        next(err);
    }
});

router.post('/vendors', async (req, res, next) => {
    try {
<<<<<<< HEAD
        const { name, contact, leadTimeDays, active } = req.body;
        if (!name) return res.status(400).json({ error: 'name_required' });

        const supabase = createSupabaseClient();
        const { data, error } = await supabase
            .from('vendors')
            .insert({
                name,
                contact,
                lead_time_days: leadTimeDays,
                active: active ?? true
            })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json({ vendor: data });
=======
        const { name, contact, leadTimeDays } = req.body;
        if (!name) return res.status(400).json({ error: 'name_required' });

        const created = await store.createVendor({
            name: String(name).trim(),
            contact: String(contact || '').trim(),
            leadTimeDays: Number(leadTimeDays) || 0
        });

        res.status(201).json({
            vendor: {
                id: created.id,
                name: created.name,
                contact: created.contact,
                leadTimeDays: created.lead_time_days,
                active: created.active,
                createdAt: created.created_at
            }
        });
    } catch (err) {
        next(err);
    }
});

router.put('/vendors/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, contact, leadTimeDays, active } = req.body;

        const updates = {};
        if (name !== undefined) updates.name = String(name).trim();
        if (contact !== undefined) updates.contact = String(contact).trim();
        if (leadTimeDays !== undefined) updates.leadTimeDays = Number(leadTimeDays);
        if (active !== undefined) updates.active = Boolean(active);

        const updated = await store.updateVendor(id, updates);

        res.json({
            vendor: {
                id: updated.id,
                name: updated.name,
                contact: updated.contact,
                leadTimeDays: updated.lead_time_days,
                active: updated.active,
                createdAt: updated.created_at
            }
        });
>>>>>>> 37eed91 (Update backend and frontend logic)
    } catch (err) {
        next(err);
    }
});

router.delete('/vendors/:id', async (req, res, next) => {
    try {
<<<<<<< HEAD
        const { id } = req.params;
        const supabase = createSupabaseClient();
        const { error } = await supabase.from('vendors').delete().eq('id', id);
        if (error) throw error;
        res.json({ success: true });
=======
        await store.deleteVendor(req.params.id);
        res.json({ ok: true });
>>>>>>> 37eed91 (Update backend and frontend logic)
    } catch (err) {
        next(err);
    }
});

<<<<<<< HEAD
router.patch('/vendors/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { active } = req.body;
        const supabase = createSupabaseClient();
        const { data, error } = await supabase
            .from('vendors')
            .update({ active })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json({ vendor: data });
    } catch (err) {
        next(err);
    }
});

// -- INGREDIENTS --

router.get('/ingredients', async (req, res, next) => {
    try {
        const supabase = createSupabaseClient();
        const { data, error } = await supabase
            .from('ingredients')
            .select('*')
            .order('name');

        if (error) throw error;
        // Map snake_case to camelCase for frontend compatibility if needed, 
        // but better to just handle snake_case in frontend or standardize. 
        // For now, let's keep it simple and send as is.
        res.json({ ingredients: data });
=======
router.get('/ingredients', async (_req, res, next) => {
    try {
        const ingredients = await store.listIngredients();
        const mapped = ingredients.map(i => ({
            id: i.id,
            name: i.name,
            unit: i.unit,
            unitCost: Number(i.unit_cost),
            onHand: Number(i.on_hand),
            parLevel: Number(i.par_level),
            vendorId: i.vendor_id,
            createdAt: i.created_at
        }));
        res.json({ ingredients: mapped });
>>>>>>> 37eed91 (Update backend and frontend logic)
    } catch (err) {
        next(err);
    }
});

router.post('/ingredients', async (req, res, next) => {
    try {
        const { name, unit, unitCost, onHand, parLevel, vendorId } = req.body;
        if (!name) return res.status(400).json({ error: 'name_required' });

<<<<<<< HEAD
        const supabase = createSupabaseClient();
        const { data, error } = await supabase
            .from('ingredients')
            .insert({
                name,
                unit,
                unit_cost: unitCost,
                on_hand: onHand,
                par_level: parLevel,
                vendor_id: vendorId || null
            })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json({ ingredient: data });
=======
        const created = await store.createIngredient({
            name: String(name).trim(),
            unit: String(unit || 'unit').trim(),
            unitCost: Number(unitCost) || 0,
            onHand: Number(onHand) || 0,
            parLevel: Number(parLevel) || 0,
            vendorId: vendorId ? Number(vendorId) : null
        });

        res.status(201).json({
            ingredient: {
                id: created.id,
                name: created.name,
                unit: created.unit,
                unitCost: Number(created.unit_cost),
                onHand: Number(created.on_hand),
                parLevel: Number(created.par_level),
                vendorId: created.vendor_id,
                createdAt: created.created_at
            }
        });
>>>>>>> 37eed91 (Update backend and frontend logic)
    } catch (err) {
        next(err);
    }
});

<<<<<<< HEAD
router.patch('/ingredients/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        // Extract potential updates. Only undefined fields are ignored by Supabase usually if passed as object,
        // but here we construct explicitly.
        const updates = {};
        if (req.body.onHand !== undefined) updates.on_hand = req.body.onHand;
        if (req.body.parLevel !== undefined) updates.par_level = req.body.parLevel;
        if (req.body.unitCost !== undefined) updates.unit_cost = req.body.unitCost;
        if (req.body.vendorId !== undefined) updates.vendor_id = req.body.vendorId || null;

        if (Object.keys(updates).length === 0) return res.json({ success: true });

        const supabase = createSupabaseClient();
        const { data, error } = await supabase
            .from('ingredients')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json({ ingredient: data });
=======
router.put('/ingredients/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, unit, unitCost, onHand, parLevel, vendorId } = req.body;

        const updates = {};
        if (name !== undefined) updates.name = String(name).trim();
        if (unit !== undefined) updates.unit = String(unit).trim();
        if (unitCost !== undefined) updates.unitCost = Number(unitCost);
        if (onHand !== undefined) updates.onHand = Number(onHand);
        if (parLevel !== undefined) updates.parLevel = Number(parLevel);
        if (vendorId !== undefined) updates.vendorId = vendorId ? Number(vendorId) : null;

        const updated = await store.updateIngredient(id, updates);

        res.json({
            ingredient: {
                id: updated.id,
                name: updated.name,
                unit: updated.unit,
                unitCost: Number(updated.unit_cost),
                onHand: Number(updated.on_hand),
                parLevel: Number(updated.par_level),
                vendorId: updated.vendor_id,
                createdAt: updated.created_at
            }
        });
>>>>>>> 37eed91 (Update backend and frontend logic)
    } catch (err) {
        next(err);
    }
});

router.delete('/ingredients/:id', async (req, res, next) => {
    try {
<<<<<<< HEAD
        const { id } = req.params;
        const supabase = createSupabaseClient();
        const { error } = await supabase.from('ingredients').delete().eq('id', id);
        if (error) throw error;
        res.json({ success: true });
=======
        await store.deleteIngredient(req.params.id);
        res.json({ ok: true });
>>>>>>> 37eed91 (Update backend and frontend logic)
    } catch (err) {
        next(err);
    }
});

<<<<<<< HEAD
// -- WASTE LOGS --

router.get('/wastage', async (req, res, next) => {
    try {
        const supabase = createSupabaseClient();
        const { data, error } = await supabase
            .from('waste_logs')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ wastage: data });
    } catch (err) {
        next(err);
    }
});

router.post('/wastage', async (req, res, next) => {
    try {
        const { ingredientId, qty, reason } = req.body;
        if (!ingredientId || !qty) return res.status(400).json({ error: 'invalid_waste_data' });

        const supabase = createSupabaseClient();
        const { data, error } = await supabase
            .from('waste_logs')
            .insert({
                ingredient_id: ingredientId,
                amount: qty,
                reason: reason || ''
            })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json({ entry: data });
    } catch (err) {
        console.error('Wastage Insert Error:', err);
        res.status(500).json({ error: err.message, code: err.code, details: err.details });
    }
});

=======
>>>>>>> 37eed91 (Update backend and frontend logic)
export default router;
