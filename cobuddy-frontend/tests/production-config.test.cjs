const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

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

test('Vercel preflight works with frontend configuration alone', () => {
  const result = spawnSync(
    process.execPath,
    [path.join(__dirname, '../scripts/check-vercel-config.mjs')],
    {
      env: { NEXT_PUBLIC_API_URL: 'https://api.example.com/api' },
      encoding: 'utf8',
      timeout: 10000,
    },
  );
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Vercel frontend configuration passed/);
});

test('Vercel preflight blocks missing or unsafe API URLs without printing values', () => {
  for (const value of [
    undefined,
    '',
    'http://localhost:4000/api',
    'https://api.example.com',
    'https://user:do-not-log-this@api.example.com/api',
  ]) {
    const result = spawnSync(
      process.execPath,
      [path.join(__dirname, '../scripts/check-vercel-config.mjs')],
      {
        env: value === undefined ? {} : { NEXT_PUBLIC_API_URL: value },
        encoding: 'utf8',
        timeout: 10000,
      },
    );
    assert.equal(result.error, undefined);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /NEXT_PUBLIC_API_URL must be an HTTPS API URL/);
    assert.doesNotMatch(result.stdout + result.stderr, /do-not-log-this/);
  }
});
