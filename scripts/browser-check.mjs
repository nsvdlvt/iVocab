#!/usr/bin/env node
/**
 * Live Browser Inspection & Health Check Script for iVocab
 *
 * Usage:
 *   node scripts/browser-check.mjs [url_or_path...] [--headed] [--screenshot <path>]
 *
 * Examples:
 *   node scripts/browser-check.mjs                         # Checks default routes headlessly
 *   node scripts/browser-check.mjs --headed                # Opens visible live browser window
 *   node scripts/browser-check.mjs / /login /dashboard     # Checks specific routes
 */

import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const isHeaded = args.includes('--headed') || args.includes('--live');
const screenshotIdx = args.indexOf('--screenshot');
const screenshotDir =
  screenshotIdx !== -1 && args[screenshotIdx + 1]
    ? args[screenshotIdx + 1]
    : null;

const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

const targetRoutes = args.filter(
  (arg, idx) =>
    !arg.startsWith('--') && (screenshotIdx === -1 || idx !== screenshotIdx + 1)
);

const routesToCheck =
  targetRoutes.length > 0
    ? targetRoutes
    : ['/', '/login', '/register', '/dashboard'];

async function launchBrowser() {
  for (const channel of ['chrome', 'msedge', undefined]) {
    try {
      return await chromium.launch({
        headless: !isHeaded,
        ...(channel ? { channel } : {}),
      });
    } catch {
      // Fallback to next channel or bundled chromium
    }
  }
  throw new Error(
    'Could not launch Chrome, Edge, or Playwright Chromium. Run `npx playwright install chromium`.'
  );
}

async function run() {
  const browser = await launchBrowser();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });

  const results = [];

  for (const route of routesToCheck) {
    const url = route.startsWith('http')
      ? route
      : `${baseUrl.replace(/\/$/, '')}/${route.replace(/^\//, '')}`;

    const page = await context.newPage();
    const consoleErrors = [];
    const pageErrors = [];
    const failedRequests = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', (err) => {
      pageErrors.push(err.message || String(err));
    });

    page.on('response', (res) => {
      if (res.status() >= 400) {
        failedRequests.push(`${res.status()} ${res.url()}`);
      }
    });

    let status = null;
    let finalUrl = url;
    let title = '';
    let navError = null;

    try {
      const response = await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: 20000,
      });
      status = response ? response.status() : null;
      finalUrl = page.url();
      title = await page.title();

      if (screenshotDir) {
        fs.mkdirSync(screenshotDir, { recursive: true });
        const safeName =
          route.replace(/[^a-z0-9]/gi, '_').replace(/^_+|_+$/g, '') || 'home';
        const shotPath = path.join(screenshotDir, `${safeName}.png`);
        await page.screenshot({ path: shotPath, fullPage: true });
      }
    } catch (err) {
      navError = err.message || String(err);
    }

    results.push({
      route,
      url,
      finalUrl,
      status,
      title,
      navError,
      consoleErrors,
      pageErrors,
      failedRequests,
    });

    await page.close();
  }

  await browser.close();

  console.log(JSON.stringify({ baseUrl, results }, null, 2));

  const hasCriticalErrors = results.some(
    (r) => r.navError || (r.status && r.status >= 500) || r.pageErrors.length > 0
  );
  if (hasCriticalErrors) {
    process.exitCode = 1;
  }
}

run().catch((err) => {
  console.error('Browser check failed:', err);
  process.exit(1);
});
