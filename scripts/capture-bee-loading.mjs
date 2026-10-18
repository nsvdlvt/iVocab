import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

async function launchBrowser() {
  for (const channel of ['chrome', 'msedge', undefined]) {
    try {
      return await chromium.launch({
        headless: true,
        ...(channel ? { channel } : {}),
      });
    } catch {
      // try next
    }
  }
  throw new Error('No browser channel available');
}

async function run() {
  const browser = await launchBrowser();
  const outDir = './screenshots';
  fs.mkdirSync(outDir, { recursive: true });

  // 1. Desktop Light Mode Fullscreen
  {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      colorScheme: 'light',
    });
    const page = await context.newPage();
    await page.goto('http://localhost:3000/share/bee-loading-preview', { waitUntil: 'networkidle' });
    
    // Click "Thử toàn màn hình"
    await page.getByRole('button', { name: 'Thử toàn màn hình' }).click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outDir, 'bee-loading-fullscreen-light.png') });
    await context.close();
  }

  // 2. Desktop Dark Mode Fullscreen
  {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });
    const page = await context.newPage();
    await page.goto('http://localhost:3000/share/bee-loading-preview', { waitUntil: 'networkidle' });
    
    // Toggle to dark mode
    await page.getByRole('button', { name: 'Đổi giao diện', exact: true }).click();
    await page.waitForTimeout(400);

    // Click "Thử toàn màn hình"
    await page.getByRole('button', { name: 'Thử toàn màn hình' }).click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outDir, 'bee-loading-fullscreen-dark.png') });
    await context.close();
  }

  // 3. Mobile Viewport (iPhone 14 / 390x844)
  {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    await page.goto('http://localhost:3000/share/bee-loading-preview', { waitUntil: 'networkidle' });
    
    // Click "Thử toàn màn hình"
    await page.getByRole('button', { name: 'Thử toàn màn hình' }).click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outDir, 'bee-loading-mobile.png') });
    await context.close();
  }

  // 4. Mascot 3D Image Asset variant
  {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });
    const page = await context.newPage();
    await page.goto('http://localhost:3000/share/bee-loading-preview', { waitUntil: 'networkidle' });
    
    // Switch to Mascot 3D Asset and Ai-Quiz context
    await page.getByRole('button', { name: 'Mascot 3D Asset' }).click();
    await page.getByRole('button', { name: 'ai-quiz' }).click();
    await page.getByRole('button', { name: 'Mô phỏng 0-100%' }).click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, 'bee-loading-3d-asset.png') });
    await context.close();
  }

  await browser.close();
  console.log('All screenshots captured successfully!');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
