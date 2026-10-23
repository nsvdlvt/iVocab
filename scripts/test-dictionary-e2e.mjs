import { chromium } from '@playwright/test';

async function runTest() {
  console.log('Launching browser...');
  let browser;
  for (const channel of ['chrome', 'msedge', undefined]) {
    try {
      browser = await chromium.launch({ headless: true, ...(channel ? { channel } : {}) });
      break;
    } catch {}
  }
  if (!browser) throw new Error("Could not launch browser");
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  const consoleLogs = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleLogs.push(msg.text());
  });

  const pageErrors = [];
  page.on('pageerror', (err) => pageErrors.push(err.message));
  page.on('response', (res) => {
    if (res.url().includes('/api/')) console.log('API Response:', res.status(), res.url());
  });

  console.log('1. Navigating to http://localhost:3000/dictionary...');
  await page.goto('http://localhost:3000/dictionary', { waitUntil: 'networkidle', timeout: 15000 });

  const title = await page.title();
  console.log('Page Title:', title);

  // Check search bar
  const searchInput = page.locator('input[type="text"]').first();
  await searchInput.waitFor({ state: 'visible', timeout: 5000 });
  console.log('Search input visible: OK');

  // Check featured words
  const featuredEloquent = page.locator('text=eloquent').first();
  await featuredEloquent.waitFor({ state: 'visible', timeout: 5000 });
  console.log('Featured word "eloquent" visible: OK');

  // Click on eloquent
  console.log('2. Clicking featured word "eloquent"...');
  await featuredEloquent.click();

  // Wait for result card
  const resultHeader = page.locator('h1:has-text("eloquent")');
  await resultHeader.waitFor({ state: 'visible', timeout: 10000 });
  console.log('Result card for "eloquent" loaded: OK');

  // Check audio buttons
  const ukAudioBtn = page.locator('button:has-text("UK")');
  const usAudioBtn = page.locator('button:has-text("US")');
  console.log('UK Audio button present:', (await ukAudioBtn.count()) > 0);
  console.log('US Audio button present:', (await usAudioBtn.count()) > 0);

  // 3. Search for phrase "break the ice"
  console.log('3. Searching for phrase "break the ice"...');
  await searchInput.click();
  await searchInput.fill('');
  await searchInput.type('break the ice', { delay: 50 });
  await page.keyboard.press('Enter');

  const phraseHeader = page.locator('h1:has-text("break the ice")');
  await phraseHeader.waitFor({ state: 'visible', timeout: 15000 });
  console.log('Phrase "break the ice" loaded: OK');

  // 4. Test non-existent word
  console.log('4. Searching for nonsense word "qwxzjkptvly"...');
  await searchInput.click();
  await searchInput.fill('');
  await searchInput.type('qwxzjkptvly', { delay: 40 });
  await page.keyboard.press('Enter');

  const notFoundCard = page.getByRole('heading', { name: 'Không tìm thấy từ' });
  await notFoundCard.waitFor({ state: 'visible', timeout: 10000 });
  console.log('Not-found card displayed: OK');

  const retryBtn = page.locator('button:has-text("Thử lại")');
  console.log('Retry button present:', (await retryBtn.count()) > 0);

  console.log('5. Console errors count:', consoleLogs.length);
  if (consoleLogs.length > 0) {
    console.log('Console errors detail:', consoleLogs);
  }
  console.log('6. Page errors count:', pageErrors.length);

  await browser.close();
  console.log('ALL DICTIONARY E2E TESTS PASSED!');
}

runTest().catch((e) => {
  console.error('Test failed:', e);
  process.exit(1);
});
