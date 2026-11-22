import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

describe('simple calculator guard (47cd183 regression)', () => {
  it('passes on current index.html', () => {
    const r = spawnSync('node', [path.join(root, 'scripts/check-simple-calculator.mjs')], {
      cwd: root,
      encoding: 'utf8',
    });
    assert.equal(r.status, 0, r.stderr);
  });

  it('fails on reverted shift-worker HTML snapshot', () => {
    const fixture = path.join(root, 'test/fixtures/index-6ed4fc5-shift.html');
    const r = spawnSync('node', [path.join(root, 'scripts/check-simple-calculator.mjs'), fixture], {
      cwd: root,
      encoding: 'utf8',
    });
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /baseRate|Shift Pay|time-bank|946 lines/i);
  });
});