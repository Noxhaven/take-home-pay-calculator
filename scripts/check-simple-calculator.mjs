#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const htmlPath = process.argv[2] ? path.resolve(process.argv[2]) : path.join(root, 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

const forbidden = [
  { re: /UK Shift Pay Calculator/i, msg: 'title must stay "UK Take-Home Pay Calculator" (revert 47cd183).' },
  { re: /\bid="baseRate"\b/, msg: 'remove ATOSS shift-calculator field baseRate (reverted in 47cd183).' },
  { re: /\bid="weeklyHours"\b/, msg: 'remove shift contracted-hours field weeklyHours.' },
  { re: /\bid="secondBankHrs"\b/, msg: 'remove second time-account field secondBankHrs.' },
  { re: /\bid="region"\b/, msg: 'Scottish/EWNI toggle belongs in a separate app; keep EWNI-only scope.' },
  { re: /time bank/i, msg: 'over-complicated shift time-bank UI was reverted in 47cd183.' },
  { re: /\bATOSS\b/i, msg: 'do not reintroduce employer-specific shift engines.' },
];

const lineCount = html.split('\n').length;
const errors = [];
if (lineCount > 900) {
  errors.push(
    `index.html is ${lineCount} lines (>900). Split logic into modules instead of another monolithic shift calc.`,
  );
}

for (const { re, msg } of forbidden) {
  if (re.test(html)) errors.push(msg);
}

if (errors.length) {
  for (const e of errors) console.error(e);
  process.exit(1);
}

console.log('ok: single-file calculator stays simple');