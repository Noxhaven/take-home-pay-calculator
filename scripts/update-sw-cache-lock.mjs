#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const cacheMatch = sw.match(/const\s+CACHE\s*=\s*['"](take-home-v\d+)['"]/);
const assetsMatch = sw.match(/const\s+ASSETS\s*=\s*(\[[\s\S]*?\]);/);
if (!cacheMatch || !assetsMatch) throw new Error('Parse sw.js CACHE/ASSETS first');
const assets = new Function(`return ${assetsMatch[1]}`)();

const assetHashes = {};
for (const a of assets) {
  if (a === './' || a === '.') continue;
  const rel = a.replace(/^\.\//, '');
  const data = fs.readFileSync(path.join(root, rel));
  assetHashes[rel] = crypto.createHash('sha256').update(data).digest('hex');
}

const lock = { cache: cacheMatch[1], assetHashes };
fs.writeFileSync(path.join(root, 'sw-cache-lock.json'), JSON.stringify(lock, null, 2) + '\n');
console.log(`Wrote sw-cache-lock.json for ${lock.cache}`);