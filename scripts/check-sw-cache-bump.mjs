#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const swPath = process.argv[2] ? path.resolve(process.argv[2]) : path.join(repoRoot, 'sw.js');
const lockPath = process.argv[3] ? path.resolve(process.argv[3]) : path.join(repoRoot, 'sw-cache-lock.json');
const assetRoot = process.argv[2] ? path.dirname(swPath) : repoRoot;

const sw = fs.readFileSync(swPath, 'utf8');
const cacheMatch = sw.match(/const\s+CACHE\s*=\s*['"](take-home-v(\d+))['"]/);
if (!cacheMatch) {
  console.error('sw.js must declare const CACHE = "take-home-vN" (regression: forgetting to bump cache).');
  process.exit(1);
}
const cacheName = cacheMatch[1];
const cacheNum = parseInt(cacheMatch[2], 10);

const assetsMatch = sw.match(/const\s+ASSETS\s*=\s*(\[[\s\S]*?\]);/);
if (!assetsMatch) {
  console.error('sw.js must declare const ASSETS = [...].');
  process.exit(1);
}
let assets;
try {
  assets = new Function(`return ${assetsMatch[1]}`)();
} catch {
  console.error('Could not parse ASSETS array in sw.js.');
  process.exit(1);
}

function hashFile(rel) {
  const p = path.join(assetRoot, rel.replace(/^\.\//, ''));
  const data = fs.readFileSync(p);
  return crypto.createHash('sha256').update(data).digest('hex');
}

const currentHashes = {};
for (const a of assets) {
  if (a === './' || a === '.') continue;
  const key = a.replace(/^\.\//, '');
  currentHashes[key] = hashFile(a);
}

let lock;
try {
  lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
} catch {
  console.error(
    'Missing sw-cache-lock.json — run: node scripts/update-sw-cache-lock.mjs after bumping CACHE.',
  );
  process.exit(1);
}

const lockHashes = lock.assetHashes || {};
const keys = new Set([...Object.keys(currentHashes), ...Object.keys(lockHashes)]);
const fingerprintsMatch = [...keys].every((k) => currentHashes[k] === lockHashes[k]);

if (fingerprintsMatch) {
  if (lock.cache !== cacheName) {
    console.error(
      `CACHE is ${cacheName} but fingerprints still match lock for ${lock.cache}. ` +
        'Bump CACHE only when cached files change, then update sw-cache-lock.json.',
    );
    process.exit(1);
  }
  console.log('ok: CACHE version matches cached asset fingerprints');
  process.exit(0);
}

if (lock.cache === cacheName) {
  const changed = [...keys].filter((k) => currentHashes[k] !== lockHashes[k]);
  console.error(
    `Cached assets changed (${changed.join(', ')}) but CACHE is still ${cacheName}. ` +
      'Bump CACHE in sw.js and run: node scripts/update-sw-cache-lock.mjs',
  );
  process.exit(1);
}

const lockNum = parseInt(String(lock.cache).match(/v(\d+)$/)?.[1] || '0', 10);
if (cacheNum <= lockNum) {
  console.error(
    `Cached assets changed but CACHE ${cacheName} is not newer than lock ${lock.cache}. ` +
      'Increase the vN suffix when any ASSETS file changes.',
  );
  process.exit(1);
}

const lockStillStale = [...keys].some((k) => currentHashes[k] !== lockHashes[k]);
if (lockStillStale) {
  console.error(
    `CACHE bumped to ${cacheName} but sw-cache-lock.json does not list current file fingerprints. ` +
      'Run: node scripts/update-sw-cache-lock.mjs',
  );
  process.exit(1);
}

console.log('ok: CACHE bumped and lock updated');
process.exit(0);