const test = require('node:test');
const assert = require('node:assert/strict');

test('deployment preflight requires an explicit HTTPS API host', async () => {
  const { validatePublicApiUrl } = await import('../scripts/production-config.mjs');
  assert.equal(validatePublicApiUrl('https://api.cobuddy.in/api/'), 'https://api.cobuddy.in/api');
  for (const value of [
    undefined,
    '',
    'http://api.cobuddy.in/api',
    'https://localhost/api',
    'https://127.0.0.1/api',
    'https://[::1]/api',
    'https://api.example.invalid/api',
    'https://api.cobuddy.in',
    'https://user:secret@api.cobuddy.in/api',
    'https://api.cobuddy.in/api?secret=value',
    'https://api.cobuddy.in/api#fragment',
  ]) {
    assert.throws(() => validatePublicApiUrl(value), /NEXT_PUBLIC_API_URL/);
  }
});
