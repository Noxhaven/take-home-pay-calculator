#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

const errors = [];

const block = html.match(/serviceWorker[\s\S]{0,1200}/);
const frag = block ? block[0] : html;

if (!frag.includes("updateViaCache:'none'") && !frag.includes('updateViaCache: "none"')) {
  errors.push(
    "index.html must register the service worker with updateViaCache:'none' (regression: stale sw.js on reinstall).",
  );
}
if (!/reg\.update\s*\(\s*\)/.test(frag)) {
  errors.push('index.html must call reg.update() after registration so updates are polled on load.');
}
if (!/visibilitychange/.test(frag)) {
  errors.push('index.html must call reg.update() when the page becomes visible again.');
}
if (!/controllerchange/.test(frag)) {
  errors.push('index.html must reload on controllerchange when a waiting worker activates.');
}
if (!/updatefound/.test(frag)) {
  errors.push('index.html must listen for updatefound to detect new service worker installs.');
}

if (errors.length) {
  for (const e of errors) console.error(e);
  process.exit(1);
}

console.log('ok: PWA registration includes eager update + reload wiring');