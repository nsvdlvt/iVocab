import { chromium } from '@playwright/test';

const baseUrl = 'http://localhost:3000';

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
  throw new Error('Could not launch browser');
}

async function testFavicons(page) {
  const faviconUrls = [
    '/favicon.ico',
    '/favicon-32x32.png',
    '/favicon-16x16.png',
    '/favicon-48x48.png',
    '/apple-touch-icon.png',
    '/icon-192.png',
    '/icon-512.png',
    '/icon.png',
    '/apple-icon.png',
  ];

  console.log('\n--- Checking Favicon Assets ---');
  let allFaviconsOk = true;
  for (const url of faviconUrls) {
    const res = await page.request.get(`${baseUrl}${url}`);
    const status = res.status();
    const contentType = res.headers()['content-type'] || '';
    const length = (await res.body()).length;
    const ok = status === 200 && length > 500;
    if (!ok) allFaviconsOk = false;
    console.log(
      `${ok ? '✅' : '❌'} ${url.padEnd(25)} status: ${status} | content-type: ${contentType} | size: ${length} bytes`
    );
  }
  return allFaviconsOk;
}

async function testRoutes(page) {
  const routes = [
    { path: '/', expected: 'Trang chủ | Vocabee' },
    { path: '/login', expected: 'Đăng nhập | Vocabee' },
    { path: '/register', expected: 'Đăng ký | Vocabee' },
    { path: '/forgot-password', expected: 'Quên mật khẩu | Vocabee' },
    { path: '/reset-password', expected: 'Đặt lại mật khẩu | Vocabee' },
    { path: '/403', expected: '403 - Không có quyền truy cập | Vocabee' },
    { path: '/offline', expected: 'Ngoại tuyến | Vocabee' },
  ];

  console.log('\n--- Checking Direct Page Titles ---');
  let allTitlesOk = true;

  for (const route of routes) {
    await page.goto(`${baseUrl}${route.path}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    // Let Next.js client router and head settle
    await page.waitForTimeout(600);
    const title = await page.title();
    const matches = title === route.expected;
    if (!matches) allTitlesOk = false;
    console.log(
      `${matches ? '✅' : '❌'} Route: ${route.path.padEnd(25)} -> Title: "${title}" (Expected: "${route.expected}")`
    );
  }

  return allTitlesOk;
}

async function testClientSideNavigation(page) {
  console.log('\n--- Testing Client-Side Navigation Title Updates ---');
  await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(500);
  const loginTitle = await page.title();
  console.log(`Initial page (/login): "${loginTitle}"`);

  // Navigate client-side to Register
  const registerLink = page.locator('a[href*="/register"]').first();
  if (await registerLink.isVisible()) {
    await registerLink.click();
    await page.waitForURL('**/register');
    await page.waitForTimeout(600);
    const registerTitle = await page.title();
    console.log(`Client navigated to /register -> Title: "${registerTitle}"`);
    if (registerTitle === 'Đăng ký | Vocabee') {
      console.log('✅ Client-side navigation successfully updated document.title to "Đăng ký | Vocabee"');
    } else {
      console.log('❌ Title mismatch on client-side navigation');
      return false;
    }
  }

  // Navigate client-side to Forgot Password
  await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(500);
  const forgotLink = page.locator('a[href*="/forgot-password"]').first();
  if (await forgotLink.isVisible()) {
    await forgotLink.click();
    await page.waitForURL('**/forgot-password');
    await page.waitForTimeout(600);
    const forgotTitle = await page.title();
    console.log(`Client navigated to /forgot-password -> Title: "${forgotTitle}"`);
    if (forgotTitle === 'Quên mật khẩu | Vocabee') {
      console.log('✅ Client-side navigation successfully updated document.title to "Quên mật khẩu | Vocabee"');
    } else {
      console.log('❌ Title mismatch on client-side navigation');
      return false;
    }
  }

  return true;
}

async function run() {
  const browser = await launchBrowser();
  const page = await browser.newPage();

  try {
    const faviconsOk = await testFavicons(page);
    const routesOk = await testRoutes(page);
    const navOk = await testClientSideNavigation(page);

    console.log('\n========================================');
    if (faviconsOk && routesOk && navOk) {
      console.log('🎉 ALL VERIFICATIONS PASSED PERFECTLY!');
    } else {
      console.error('⚠️ SOME CHECKS FAILED!');
      process.exitCode = 1;
    }
    console.log('========================================\n');
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('Error running verification:', err);
  process.exit(1);
});
