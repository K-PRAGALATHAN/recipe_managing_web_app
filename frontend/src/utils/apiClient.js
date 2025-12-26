import { getSessionToken } from './authSession';

const resolveUrl = (pathOrUrl) => {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const base = import.meta.env.VITE_API_BASE_URL ?? '';
  if (!base) return pathOrUrl;
  if (!pathOrUrl) return base;
  return `${base.replace(/\/+$/, '')}/${String(pathOrUrl).replace(/^\/+/, '')}`;
};

export const getAccessToken = async () => {
  return getSessionToken();
};

export const apiFetch = async (pathOrUrl, options = {}) => {
  const url = resolveUrl(pathOrUrl);
  const headers = new Headers(options.headers ?? {});

  const token = await getAccessToken();
  if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);

  return fetch(url, { ...options, headers });
};
