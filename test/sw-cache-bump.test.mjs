import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function runCheck(swPath, lockPath) {
  return spawnSync(
    'node',
    [path.join(root, 'scripts/check-sw-cache-bump.mjs'), swPath, lockPath],
    { cwd: root, encoding: 'utf8' },
  );
}

describe('CACHE version bump when ASSETS change', () => {
  it('passes when lock matches sw.js on main', () => {
    const r = runCheck(path.join(root, 'sw.js'), path.join(root, 'sw-cache-lock.json'));
    assert.equal(r.status, 0, r.stderr || r.stdout);
  });

  it('fails when index.html changes but CACHE is not bumped', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-cache-prove-'));
    const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
    fs.writeFileSync(path.join(dir, 'sw.js'), sw);
    fs.copyFileSync(path.join(root, 'sw-cache-lock.json'), path.join(dir, 'lock.json'));
    fs.writeFileSync(path.join(dir, 'index.html'), fs.readFileSync(path.join(root, 'index.html')) + '\n');
    fs.cpSync(path.join(root, 'icons'), path.join(dir, 'icons'), { recursive: true });
    fs.cpSync(path.join(root, 'manifest.webmanifest'), path.join(dir, 'manifest.webmanifest'));
    if (fs.existsSync(path.join(root, 'calc.mjs'))) {
      fs.copyFileSync(path.join(root, 'calc.mjs'), path.join(dir, 'calc.mjs'));
    }

    const r = spawnSync(
      'node',
      [path.join(root, 'scripts/check-sw-cache-bump.mjs'), path.join(dir, 'sw.js'), path.join(dir, 'lock.json')],
      { cwd: dir, encoding: 'utf8', env: { ...process.env } },
    );
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /still take-home-v\d+/i);
  });
});