const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:8321/index.html';
const CHROMIUM_PATH = process.env.CHROMIUM_PATH;
const OUTPUT = path.resolve(__dirname, '..', 'audit-output', 'stage2-correction');

(async () => {
  fs.mkdirSync(OUTPUT, { recursive: true });
  const browser = await chromium.launch({ headless: true, ...(CHROMIUM_PATH ? { executablePath: CHROMIUM_PATH } : {}) });
  for (const view of [{ name: 'desktop', width: 1366, height: 900 }, { name: 'mobile', width: 390, height: 844 }]) {
    const page = await browser.newPage({ viewport: { width: view.width, height: view.height } });
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle' });
    await page.click('[data-journey-choice="1"]');
    await page.click('#journeyCheck');
    await page.click('#journeyNext');
    await page.locator('#learnerJourney').screenshot({ path: path.join(OUTPUT, `${view.name}-stage2-en.png`) });
    await page.click('[data-journey-choice="0"]');
    await page.click('#journeyCheck');
    await page.locator('#learnerJourney').screenshot({ path: path.join(OUTPUT, `${view.name}-stage2-miss-en.png`) });
    await page.click('#journeyFeedback [data-related-learning="RIG101_d2"]');
    await page.locator('#hitchPrimerDialog').screenshot({ path: path.join(OUTPUT, `${view.name}-hitch-primer-en.png`) });
    await page.click('#hitchPrimerClose');
    await page.click('#langToggle');
    await page.locator('#learnerJourney').screenshot({ path: path.join(OUTPUT, `${view.name}-stage2-miss-es.png`) });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (overflow > 1) throw new Error(`${view.name} page overflows by ${overflow}px`);
    await page.close();
  }
  await browser.close();
  console.log(`Stage 2 visual captures written to ${OUTPUT}`);
})().catch(error => { console.error(error); process.exit(1); });
