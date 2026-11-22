#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const swPath = process.argv[2] ? path.resolve(process.argv[2]) : path.join(root, 'sw.js');
const sw = fs.readFileSync(swPath, 'utf8');

const errors = [];

if (!/function\s+isNavigation\s*\(/.test(sw)) {
  errors.push(
    'sw.js must define isNavigation() so document loads use a dedicated policy (regression: ec6d329 — cache-first HTML blocked PWA updates).',
  );
}

if (!/if\s*\(\s*isNavigation\s*\(\s*e\.request\s*\)\s*\)/.test(sw)) {
  errors.push(
    'sw.js fetch handler must branch on isNavigation(e.request) before the cache-first path.',
  );
}

const navBlock = sw.match(/if\s*\(\s*isNavigation\s*\(\s*e\.request\s*\)\s*\)\s*\{[\s\S]*?return;\s*\}/);
if (!navBlock) {
  errors.push('Could not find navigation branch in sw.js fetch handler.');
} else if (!/\bfetch\s*\(\s*e\.request\s*\)/.test(navBlock[0])) {
  errors.push(
    'Navigation requests must call fetch(e.request) first (network-first). Fix: restore network-first block from ec6d329.',
  );
} else if (/return\s+cached/.test(navBlock[0]) && !/\bfetch\s*\(\s*e\.request\s*\)/.test(navBlock[0].split('fetch')[0] || '')) {
  errors.push('Navigation branch must prefer network over cache on online loads.');
}

if (errors.length) {
  for (const e of errors) console.error(e);
  process.exit(1);
}

console.log('ok: service worker uses network-first navigation policy');