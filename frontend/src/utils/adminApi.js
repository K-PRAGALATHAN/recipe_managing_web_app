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

export function listUsers() {
  return apiJson('/api/admin/users');
}

export function createUser({ username, password, role }) {
  return apiJson('/api/admin/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, role }),
  });
}

