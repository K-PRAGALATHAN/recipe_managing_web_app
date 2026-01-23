import { apiFetch } from './apiClient';

export async function listVendors() {
    const res = await apiFetch('/api/manager/vendors');
    if (!res.ok) throw new Error('Failed to list vendors');
    const data = await res.json();
    return data.vendors;
}

export async function createVendor({ name, contact, leadTimeDays }) {
    const res = await apiFetch('/api/manager/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, contact, leadTimeDays }),
    });
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to create vendor');
    }
    const data = await res.json();
    return data.vendor;
}

export async function updateVendor(id, updates) {
    const res = await apiFetch(`/api/manager/vendors/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
    });
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to update vendor');
    }
    const data = await res.json();
    return data.vendor;
}

export async function deleteVendor(id) {
    const res = await apiFetch(`/api/manager/vendors/${id}`, {
        method: 'DELETE',
    });
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to delete vendor');
    }
    return true;
}

export async function listIngredients() {
    const res = await apiFetch('/api/manager/ingredients');
    if (!res.ok) throw new Error('Failed to list ingredients');
    const data = await res.json();
    return data.ingredients;
}

export async function createIngredient(data) {
    const res = await apiFetch('/api/manager/ingredients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to create ingredient');
    }
    const json = await res.json();
    return json.ingredient;
}

export async function updateIngredient(id, data) {
    const res = await apiFetch(`/api/manager/ingredients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to update ingredient');
    }
    const json = await res.json();
    return json.ingredient;
}

export async function deleteIngredient(id) {
    const res = await apiFetch(`/api/manager/ingredients/${id}`, {
        method: 'DELETE',
    });
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to delete ingredient');
    }
    return true;
}
