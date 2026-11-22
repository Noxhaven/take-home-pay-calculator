#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const htmlPath = process.argv[2] ? path.resolve(process.argv[2]) : path.join(root, 'index.html');
const calcPath = process.argv[3] ? path.resolve(process.argv[3]) : path.join(root, 'calc.mjs');
const html = fs.readFileSync(htmlPath, 'utf8');
const calc = fs.readFileSync(calcPath, 'utf8');

if (/───/.test(html) || /───/.test(calc)) {
  console.error(
    'Remove decorative section banners (───); tax year constants belong in calc.mjs as export const TAX_YEAR and RATES.',
  );
  process.exit(1);
}

if (!/export const TAX_YEAR\s*=\s*'20\d{2}\/\d{2}'/.test(calc)) {
  console.error('calc.mjs must export const TAX_YEAR for the active UK tax year.');
  process.exit(1);
}

if (!/personalAllowance:\s*12570/.test(calc)) {
  console.error('RATES.personalAllowance must match the 2026/27 threshold (12570) in calc.mjs.');
  process.exit(1);
}

console.log('ok: tax year constraints encoded in data, not comments');
