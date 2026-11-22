#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const htmlPath = process.argv[2] ? path.resolve(process.argv[2]) : path.join(root, 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

if (/───/.test(html)) {
  console.error(
    'Remove decorative section banners (───) from index.html; tax year lives in const TAX_YEAR beside RATES.',
  );
  process.exit(1);
}

if (!/const\s+TAX_YEAR\s*=\s*'20\d{2}\/\d{2}'/.test(html)) {
  console.error('index.html must declare const TAX_YEAR for the active UK tax year.');
  process.exit(1);
}

if (!/personalAllowance:\s*12570/.test(html)) {
  console.error('RATES.personalAllowance must match the 2026/27 threshold (12570).');
  process.exit(1);
}

console.log('ok: tax year constraints encoded in data, not comments');