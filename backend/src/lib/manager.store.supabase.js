import { createSupabaseClient } from './supabase.js';

const supabase = createSupabaseClient();

export async function listVendors() {
    const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('[supabase:listVendors] error:', error);
        throw error;
    }
    return data;
}

export async function createVendor({ name, contact, leadTimeDays }) {
    const { data, error } = await supabase
        .from('vendors')
        .insert({
            name,
            contact,
            lead_time_days: leadTimeDays,
            active: true
        })
        .select()
        .single();

    if (error) {
        console.error('[supabase:createVendor] error:', error);
        throw error;
    }
    return data;
}

export async function updateVendor(id, updates) {
    // Map camelCase to snake_case for DB
    const payload = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.contact !== undefined) payload.contact = updates.contact;
    if (updates.leadTimeDays !== undefined) payload.lead_time_days = updates.leadTimeDays;
    if (updates.active !== undefined) payload.active = updates.active;

    const { data, error } = await supabase
        .from('vendors')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('[supabase:updateVendor] error:', error);
        throw error;
    }
    return data;
}

export async function deleteVendor(id) {
    const { error } = await supabase
        .from('vendors')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('[supabase:deleteVendor] error:', error);
        throw error;
    }
    return true;
}

export async function listIngredients() {
    // We also join with vendors to get the vendor name if needed, 
    // but the frontend currently does a separate join. 
    // Let's just return the raw table data for now, 
    // matching how listVendors works.
    const { data, error } = await supabase
        .from('ingredients')
        .select('*')
        .order('name');

    if (error) {
        console.error('[supabase:listIngredients] error:', error);
        throw error;
    }
    return data;
}

export async function createIngredient({ name, unit, unitCost, onHand, parLevel, vendorId }) {
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

    if (error) {
        console.error('[supabase:createIngredient] error:', error);
        throw error;
    }
    return data;
}

export async function updateIngredient(id, updates) {
    const payload = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.unit !== undefined) payload.unit = updates.unit;
    if (updates.unitCost !== undefined) payload.unit_cost = updates.unitCost;
    if (updates.onHand !== undefined) payload.on_hand = updates.onHand;
    if (updates.parLevel !== undefined) payload.par_level = updates.parLevel;
    if (updates.vendorId !== undefined) payload.vendor_id = updates.vendorId || null;

    const { data, error } = await supabase
        .from('ingredients')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('[supabase:updateIngredient] error:', error);
        throw error;
    }
    return data;
}

export async function deleteIngredient(id) {
    const { error } = await supabase
        .from('ingredients')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('[supabase:deleteIngredient] error:', error);
        throw error;
    }
    return true;
}
