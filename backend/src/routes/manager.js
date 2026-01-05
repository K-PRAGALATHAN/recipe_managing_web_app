import { Router } from 'express';
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
    } catch (err) {
        next(err);
    }
});

router.post('/vendors', async (req, res, next) => {
    try {
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
    } catch (err) {
        next(err);
    }
});

router.delete('/vendors/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const supabase = createSupabaseClient();
        const { error } = await supabase.from('vendors').delete().eq('id', id);
        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

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
    } catch (err) {
        next(err);
    }
});

router.post('/ingredients', async (req, res, next) => {
    try {
        const { name, unit, unitCost, onHand, parLevel, vendorId } = req.body;
        if (!name) return res.status(400).json({ error: 'name_required' });

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
    } catch (err) {
        next(err);
    }
});

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
    } catch (err) {
        next(err);
    }
});

router.delete('/ingredients/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const supabase = createSupabaseClient();
        const { error } = await supabase.from('ingredients').delete().eq('id', id);
        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

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

export default router;
