import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createPasswordHash,
  createSessionCookie,
  createSessionToken,
  parseCookies,
  verifyPassword,
  verifySessionToken,
} from '../server/auth.js';

test('password hashes verify the original password only', async () => {
  const hash = await createPasswordHash('original-password');

  assert.equal(await verifyPassword('original-password', hash), true);
  assert.equal(await verifyPassword('wrong-password', hash), false);
  assert.notEqual(hash, 'original-password');
});

test('session tokens reject tampering and expiration', () => {
  const secret = 'test-secret-value-with-enough-length';
  const token = createSessionToken({ email: 'user@example.com', secret, ttlMs: 1000 });

  assert.equal(verifySessionToken(token, secret)?.email, 'user@example.com');
  assert.equal(verifySessionToken(`${token}x`, secret), null);

  const expired = createSessionToken({ email: 'user@example.com', secret, ttlMs: -1000 });
  assert.equal(verifySessionToken(expired, secret), null);
});

test('auth cookie is http-only and same-site', () => {
  const cookie = createSessionCookie('token-value', false);

  assert.match(cookie, /^bt_session=token-value;/);
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Lax/);
  assert.match(cookie, /Path=\//);
});

test('cookie parser reads individual cookie values', () => {
  const cookies = parseCookies('theme=light; bt_session=abc.def; other=value');

  assert.equal(cookies.bt_session, 'abc.def');
  assert.equal(cookies.theme, 'light');
});
