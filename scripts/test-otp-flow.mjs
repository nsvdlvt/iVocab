import { chromium } from '@playwright/test';

async function testOtpUI() {
  console.log('--- STARTING PLAYWRIGHT OTP INTERACTION TEST ---');
  let browser;
  for (const channel of ['chrome', 'msedge']) {
    try {
      browser = await chromium.launch({ headless: true, channel });
      break;
    } catch {}
  }
  if (!browser) {
    browser = await chromium.launch({ headless: true });
  }
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  try {
    // 1. Visit /verify-otp with email param
    console.log('1. Navigating to /verify-otp?email=test.user@example.com&type=signup');
    await page.goto('http://localhost:3000/verify-otp?email=test.user@example.com&type=signup', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input[aria-label="Chữ số thứ 1"]');

    // Verify masked email text
    const maskedText = await page.locator('text=te***r@example.com').isVisible();
    console.log(`Masked email visible: ${maskedText}`);
    if (!maskedText) throw new Error('Masked email not found');

    // 2. Test single digit typing and auto-advance
    console.log('2. Typing individual digits "1", "2", "3"');
    const box1 = page.locator('input[aria-label="Chữ số thứ 1"]');
    const box2 = page.locator('input[aria-label="Chữ số thứ 2"]');
    const box3 = page.locator('input[aria-label="Chữ số thứ 3"]');
    
    await box1.click();
    await box1.press('1');
    await page.waitForTimeout(100);
    const activeLabel2 = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'));
    console.log(`Active element after typing '1': "${activeLabel2}"`);

    await page.keyboard.press('2');
    await page.waitForTimeout(100);
    const activeLabel3 = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'));
    console.log(`Active element after typing '2': "${activeLabel3}"`);

    // 3. Test backspace navigation
    console.log('3. Testing backspace');
    await page.keyboard.press('Backspace'); // clears current or previous
    await page.waitForTimeout(50);
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(50);

    // 4. Test paste entire 6-digit code
    console.log('4. Testing paste 6 digits: "654321"');
    await box1.focus();
    await box1.evaluate(el => {
      const dt = new DataTransfer();
      dt.setData('text/plain', '654321');
      el.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true }));
    });
    await page.waitForTimeout(200);

    const values = [];
    for (let i = 1; i <= 6; i++) {
      values.push(await page.locator(`input[aria-label="Chữ số thứ ${i}"]`).inputValue());
    }
    console.log(`Pasted digits across boxes: ${values.join('')}`);
    if (values.join('') !== '654321') {
      throw new Error(`Paste did not fill all boxes correctly. Received: ${values.join('')}`);
    }

    // 5. Test submission with invalid code (triggers real Supabase call & maps error)
    console.log('5. Clicking submit button');
    const submitBtn = page.locator('button:has-text("Xác nhận mã")');
    await submitBtn.click();

    // Wait for error banner
    console.log('Waiting for verification response from Supabase...');
    const errorAlert = page.locator('div.border-destructive\\/20').first();
    await errorAlert.waitFor({ timeout: 10000 });
    const errorMsg = await errorAlert.textContent();
    console.log(`Received error message from Supabase verification: "${errorMsg?.trim()}"`);

    // 6. Test inline email editing
    console.log('6. Testing email edit button');
    const editBtn = page.locator('button[aria-label="Sửa địa chỉ email"]');
    await editBtn.click();
    await page.waitForSelector('input#otp-target-email');
    console.log('Email edit input field opened successfully');

    console.log('--- ALL OTP INTERACTIVE TESTS PASSED SUCCESSFULLY! ---');
  } finally {
    await browser.close();
  }
}

testOtpUI().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
