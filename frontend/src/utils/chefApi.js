import { apiFetch } from './apiClient';

async function readJson(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function apiJson(path, options) {
  const res = await apiFetch(path, options);
  const body = await readJson(res);
  if (!res.ok) {
    const message = body?.error ? String(body.error) : `http_${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

export function listChefRecipes() {
  return apiJson('/api/chef/recipes');
}

export function deleteRecipe(id) {
  return apiJson(`/api/chef/recipes/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export function createChefRecipe(payload) {
  return apiJson('/api/chef/recipes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function releaseChefRecipeVersion({ recipeId, version }) {
  return apiJson(`/api/chef/recipes/${encodeURIComponent(recipeId)}/versions/${Number(version)}/release`, {
    method: 'POST',
  });
}


export function getRecipe(id) {
  return apiJson(`/api/chef/recipes/${encodeURIComponent(id)}`);
}

export function updateDraftRecipeVersion({ recipeId, version, payload }) {
  return apiJson(`/api/chef/recipes/${encodeURIComponent(recipeId)}/versions/${Number(version)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
