import crypto from 'node:crypto';

export function createPasswordHash(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(String(password), salt, 64);
  return {
    saltB64: salt.toString('base64'),
    hashB64: hash.toString('base64'),
  };
}

export function verifyPassword(password, { saltB64, hashB64 }) {
  const salt = Buffer.from(String(saltB64), 'base64');
  const expected = Buffer.from(String(hashB64), 'base64');
  const actual = crypto.scryptSync(String(password), salt, expected.length);
  return crypto.timingSafeEqual(expected, actual);
}

function base64UrlEncode(buffer) {
  return Buffer.from(buffer)
    .toString('base64')
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
}

function base64UrlDecodeToBuffer(input) {
  const str = String(input).replaceAll('-', '+').replaceAll('_', '/');
  const padLen = (4 - (str.length % 4)) % 4;
  const padded = str + '='.repeat(padLen);
  return Buffer.from(padded, 'base64');
}

export function signAuthToken(payload, secret, { expiresInSeconds = 60 * 60 * 8 } = {}) {
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + expiresInSeconds };
  const encodedPayload = base64UrlEncode(JSON.stringify(body));
  const signature = crypto
    .createHmac('sha256', String(secret))
    .update(encodedPayload)
    .digest();
  return `v1.${encodedPayload}.${base64UrlEncode(signature)}`;
}

export function verifyAuthToken(token, secret) {
  const raw = String(token || '');
  const [version, encodedPayload, encodedSignature] = raw.split('.');
  if (version !== 'v1' || !encodedPayload || !encodedSignature) return null;

  const expectedSig = crypto
    .createHmac('sha256', String(secret))
    .update(encodedPayload)
    .digest();
  const providedSig = base64UrlDecodeToBuffer(encodedSignature);
  if (providedSig.length !== expectedSig.length) return null;
  if (!crypto.timingSafeEqual(expectedSig, providedSig)) return null;

  let payload = null;
  try {
    payload = JSON.parse(base64UrlDecodeToBuffer(encodedPayload).toString('utf8'));
  } catch {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  if (typeof payload?.exp !== 'number' || payload.exp <= now) return null;
  return payload;
}

