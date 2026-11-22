#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const htmlPath = process.argv[2] ? path.resolve(process.argv[2]) : path.join(root, 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

const errors = [];

const numberInputs = [...html.matchAll(/<input[^>]*type="number"[^>]*>/gi)];
for (const tag of numberInputs) {
  const v = tag[0].match(/\bvalue="([^"]+)"/i);
  if (!v) continue;
  const val = v[1].trim();
  if (val === '' || val === '0') continue;
  errors.push(
    `Number input must not ship a non-zero default value="${val}" (regression: shift-worker commit 6ed4fc5). ` +
      'Use placeholder="0" and load user settings from localStorage only.',
  );
}

if (/\breset-btn\b|\bid="reset"\b/.test(html)) {
  errors.push('Avoid reset-to-hardcoded-defaults controls on a public PWA (regression: 6ed4fc5).');
}

if (errors.length) {
  for (const e of errors) console.error(e);
  process.exit(1);
}

console.log('ok: no personal numeric defaults in index.html');