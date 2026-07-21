import crypto from 'node:crypto';

const COOKIE_NAME = 'bt_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 12;
const SCRYPT_KEY_LENGTH = 64;

const base64UrlEncode = (input) => Buffer.from(input).toString('base64url');
const base64UrlDecode = (input) => Buffer.from(input, 'base64url').toString('utf8');

const timingSafeEqualText = (a, b) => {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
};

export const createPasswordHash = async (password) => {
  const salt = crypto.randomBytes(16).toString('base64url');
  const hash = await new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, SCRYPT_KEY_LENGTH, (error, key) => {
      if (error) reject(error);
      else resolve(key.toString('base64url'));
    });
  });
  return `scrypt:${salt}:${hash}`;
};

export const verifyPassword = async (password, storedHash) => {
  if (!storedHash?.startsWith('scrypt:')) return false;
  const [, salt, expected] = storedHash.split(':');
  if (!salt || !expected) return false;

  const actual = await new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, SCRYPT_KEY_LENGTH, (error, key) => {
      if (error) reject(error);
      else resolve(key.toString('base64url'));
    });
  });

  return timingSafeEqualText(actual, expected);
};

export const createSessionToken = ({ email, secret, ttlMs = SESSION_TTL_MS }) => {
  const payload = {
    email,
    exp: Date.now() + ttlMs,
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto.createHmac('sha256', secret).update(encodedPayload).digest('base64url');
  return `${encodedPayload}.${signature}`;
};

export const verifySessionToken = (token, secret) => {
  if (!token || !secret) return null;
  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) return null;

  const expected = crypto.createHmac('sha256', secret).update(encodedPayload).digest('base64url');
  if (!timingSafeEqualText(signature, expected)) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    if (!payload.email || !payload.exp || payload.exp <= Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
};

export const createSessionCookie = (token, secure = true) => {
  const parts = [
    `${COOKIE_NAME}=${token}`,
    'HttpOnly',
    'SameSite=Lax',
    'Path=/',
    `Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`,
  ];
  if (secure) parts.push('Secure');
  return parts.join('; ');
};

export const createClearSessionCookie = () => (
  `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`
);

export const parseCookies = (cookieHeader = '') => Object.fromEntries(
  cookieHeader
    .split(';')
    .map((cookie) => cookie.trim())
    .filter(Boolean)
    .map((cookie) => {
      const separator = cookie.indexOf('=');
      if (separator === -1) return [cookie, ''];
      return [
        decodeURIComponent(cookie.slice(0, separator)),
        decodeURIComponent(cookie.slice(separator + 1)),
      ];
    })
);

export const getSessionCookie = (req) => parseCookies(req.headers.cookie || '')[COOKIE_NAME];

