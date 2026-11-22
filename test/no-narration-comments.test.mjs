import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

describe('/no-comments: tax year banners', () => {
  it('passes after banners removed', () => {
    const r = spawnSync('node', [path.join(root, 'scripts/check-tax-year-single-source.mjs')], {
      cwd: root,
      encoding: 'utf8',
    });
    assert.equal(r.status, 0, r.stderr);
  });

  it('fails when decorative banners return', () => {
    const fixture = path.join(root, 'test/fixtures/index-with-banners.html');
    const r = spawnSync('node', [path.join(root, 'scripts/check-tax-year-single-source.mjs'), fixture], {
      cwd: root,
      encoding: 'utf8',
    });
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /decorative section banners/i);
  });
});