import { chromium } from '@playwright/test';

async function runTest() {
  console.log('🚀 Starting Smart Text Selection & Translation Playwright Verification...');
  let browser;
  for (const channel of ['chrome', 'msedge', undefined]) {
    try {
      browser = await chromium.launch({
        headless: true,
        ...(channel ? { channel } : {}),
      });
      break;
    } catch {
      // try next
    }
  }

  if (!browser) {
    throw new Error('Failed to launch browser');
  }

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  // Track network requests to verify NO API calls are made upon selection
  const apiCalls = [];
  page.on('request', (req) => {
    const url = req.url();
    if (url.includes('/api/dictionary/lookup') || url.includes('/api/translate')) {
      apiCalls.push(url);
    }
  });

  try {
    // 1. Visit landing page
    console.log('Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // 2. Add a test sandbox container with sample English & Vietnamese text and an input element
    await page.evaluate(() => {
      const container = document.createElement('div');
      container.id = 'smart-selection-test-container';
      container.style.padding = '40px';
      container.style.fontSize = '20px';
      container.innerHTML = `
        <p id="test-single-word">We are building a <span>resilient</span> community together.</p>
        <p id="test-sentence">Practice makes perfect every single day.</p>
        <p id="test-vietnamese">Học viên cần kiên trì luyện tập mỗi ngày.</p>
        <input id="test-input" type="text" value="Text inside an input should not trigger bubble" style="padding: 8px; width: 300px;" />
      `;
      document.body.prepend(container);
    });

    console.log('Test container injected.');

    // 3. Test: Select partial word "resili" in "resilient"
    console.log('Testing partial word selection expansion ("resili" -> "resilient")...');
    const selectedExpandedWord = await page.evaluate(() => {
      const p = document.getElementById('test-single-word');
      const span = p.querySelector('span');
      const textNode = span.firstChild;

      const range = document.createRange();
      // "resilient": select "resili" (index 0 to 6)
      range.setStart(textNode, 0);
      range.setEnd(textNode, 6);

      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);

      // Dispatch mouseup on the span
      span.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(window.getSelection().toString());
        }, 100);
      });
    });

    console.log(`Expanded word selection: "${selectedExpandedWord}"`);
    if (selectedExpandedWord !== 'resilient') {
      throw new Error(`Expected "resilient" but got "${selectedExpandedWord}"`);
    }

    // 4. Verify bubble appears
    await page.waitForSelector('[data-smart-selection-ui="true"]', { timeout: 3000 });
    const bubbleText = await page.textContent('[data-smart-selection-ui="true"]');
    console.log(`Bubble displayed: "${bubbleText.trim()}"`);

    // 5. Verify NO API calls were made just by selecting text!
    console.log('Verifying NO API calls were triggered merely by selection...');
    console.log(`API calls so far: ${apiCalls.length}`);
    if (apiCalls.length > 0) {
      throw new Error(`API called prematurely before user clicked bubble: ${apiCalls.join(', ')}`);
    }
    console.log('✓ Verified: Zero API calls upon selection.');

    // 6. Click the bubble to trigger lookup
    console.log('Clicking the translation bubble...');
    const bubble = await page.$('[data-smart-selection-ui="true"] button');
    await bubble.click();

    // 7. Verify popup appears and API was called
    console.log('Waiting for dictionary result popup...');
    await page.waitForSelector('button[aria-label="Đóng popup tra từ"]', { timeout: 8000 });
    await page.waitForTimeout(1000);

    const popupContent = await page.textContent('[data-smart-selection-ui="true"]');
    console.log(`Popup content contains "Từ điển": ${popupContent.includes('Từ điển')}`);
    console.log(`API calls made after clicking bubble: ${apiCalls.length}`);
    if (apiCalls.length === 0) {
      throw new Error('Expected dictionary API to be called after clicking bubble');
    }

    // Close the popup
    const closeBtn = await page.$('button[aria-label="Đóng popup tra từ"]');
    await closeBtn.click();
    await page.waitForTimeout(300);

    // 8. Test Sentence Selection
    console.log('Testing sentence selection ("Practice makes perfect every single day.")...');
    apiCalls.length = 0; // reset counter

    await page.evaluate(() => {
      const p = document.getElementById('test-sentence');
      const textNode = p.firstChild;

      const range = document.createRange();
      range.setStart(textNode, 0);
      range.setEnd(textNode, p.textContent.length);

      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);

      p.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    });

    await page.waitForTimeout(200);
    const sentenceBubble = await page.waitForSelector('[data-smart-selection-ui="true"]');
    const sentenceBubbleText = await sentenceBubble.textContent();
    console.log(`Sentence bubble text: "${sentenceBubbleText.trim()}"`);
    if (!sentenceBubbleText.includes('Dịch nhanh')) {
      throw new Error(`Expected "Dịch nhanh" for full sentence but got "${sentenceBubbleText}"`);
    }

    // Click sentence bubble
    const sentenceBubbleBtn = await sentenceBubble.$('button');
    await sentenceBubbleBtn.click();

    console.log('Waiting for translation result...');
    await page.waitForTimeout(2000);
    const translationPopupContent = await page.textContent('[data-smart-selection-ui="true"]');
    console.log(`Translation popup contains "Dịch câu / đoạn": ${translationPopupContent.includes('Dịch câu / đoạn')}`);
    console.log(`Translation popup contains "Bản dịch tiếng Việt": ${translationPopupContent.includes('Bản dịch tiếng Việt')}`);

    // Close sentence popup
    const closeBtn2 = await page.$('button[aria-label="Đóng popup tra từ"]');
    await closeBtn2.click();
    await page.waitForTimeout(300);

    // 9. Test: Selection inside input field should NOT show bubble
    console.log('Testing selection inside input element (should be ignored)...');
    await page.evaluate(() => {
      const input = document.getElementById('test-input');
      input.focus();
      input.setSelectionRange(0, 10);
      input.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    });

    await page.waitForTimeout(300);
    const inputBubble = await page.$('[data-smart-selection-ui="true"]');
    console.log(`Bubble displayed on input selection: ${Boolean(inputBubble)}`);
    if (inputBubble) {
      throw new Error('Smart selection bubble should NOT appear on input element selection');
    }
    console.log('✓ Verified: Input selection correctly ignored.');

    console.log('\n🎉 ALL SMART TEXT SELECTION & TRANSLATION TESTS PASSED SUCCESSFULLY! 🎉\n');
  } finally {
    await browser.close();
  }
}

runTest().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
