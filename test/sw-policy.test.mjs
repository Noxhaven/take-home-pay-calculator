import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const run = (script, extraArgs = []) =>
  spawnSync('node', [path.join(root, 'scripts', script), ...extraArgs], {
    cwd: root,
    encoding: 'utf8',
  });

describe('service worker update policy (ec6d329 regression)', () => {
  it('passes on current sw.js', () => {
    const r = run('check-sw-network-first.mjs');
    assert.equal(r.status, 0, r.stderr || r.stdout);
  });

  it('fails on pre-ec6d329 cache-first sw (real past bug)', () => {
    const fixture = path.join(root, 'test/fixtures/sw-pre-ec6d329.js');
    const r = run('check-sw-network-first.mjs', [fixture]);
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /isNavigation/i);
  });

  it('passes PWA registration wiring in index.html', () => {
    const r = run('check-pwa-registration.mjs');
    assert.equal(r.status, 0, r.stderr || r.stdout);
  });
});