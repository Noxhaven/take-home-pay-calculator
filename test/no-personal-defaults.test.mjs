import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

describe('no personal numeric defaults (6ed4fc5 regression)', () => {
  it('passes on current index.html', () => {
    const r = spawnSync('node', [path.join(root, 'scripts/check-no-personal-defaults.mjs')], {
      cwd: root,
      encoding: 'utf8',
    });
    assert.equal(r.status, 0, r.stderr);
  });

  it('fails on fixture with shift-style value= attributes', () => {
    const fixture = path.join(root, 'test/fixtures/index-with-defaults.html');
    const r = spawnSync('node', [path.join(root, 'scripts/check-no-personal-defaults.mjs'), fixture], {
      cwd: root,
      encoding: 'utf8',
    });
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /value="40"/);
  });
});