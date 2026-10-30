// All dependencies needed for this *project* are checked here.
// Node and Chromium are system-level prerequisites, not bundled into the ZIP.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
let failed = false;
const check = (condition, message) => {
  console.log(`${condition ? '[OK]' : '[MISSING]'} ${message}`);
  if (!condition) failed = true;
};
const major = Number(process.versions.node.split('.')[0]);
check(major >= 22 && major <= 26, `Node 22/24/26 supported; installed ${process.version}`);
const requiredFiles = [
  'package.json', 'package-lock.json', 'playwright.config.js',
  'server.js', 'public/index.html', 'public/app.js', 'public/styles.css',
  'tests/01-smoke.spec.js', 'tests/02-availability.spec.js',
  'tests/03-reservation.spec.js', 'tests/04-outage.spec.js',
  '.github/workflows/playwright.yml', '.gitignore', 'README.md'
];
for (const f of requiredFiles) check(fs.existsSync(path.join(root,f)), `Required project file: ${f}`);
let playwrightAvailable = false;
try { require.resolve('@playwright/test', { paths: [root] }); playwrightAvailable = true; } catch {}
check(playwrightAvailable, '@playwright/test installed (run npm ci if missing)');
if (playwrightAvailable) {
  try {
    const { chromium } = require('@playwright/test');
    const exe = chromium.executablePath();
    check(fs.existsSync(exe), `Playwright Chromium available: ${exe} (otherwise run npx playwright install chromium)`);
  } catch (err) { check(false, `Playwright Chromium resolution: ${err.message}`); }
}
if (failed) {
  console.log('\nSetup: npm ci && npx playwright install chromium');
  process.exitCode = 1;
} else {
  console.log('\nAll project files, npm dependencies and Playwright Chromium are available.');
}
