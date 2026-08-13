const { chromium } = require('playwright');
const path = require('path');
const os = require('os');

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined });
  const output = path.join(os.tmpdir(), 'rig101-visual-pass');
  const cases = [
    { width: 1366, height: 768, view: 'share' },
    { width: 1024, height: 768, view: 'mastery' },
    { width: 768, height: 1024, view: 'course' },
    { width: 375, height: 667, view: 'share' }
  ].flatMap(item => ['en','es'].map(lang => ({ ...item, lang })));
  for (const item of cases) {
    const page = await browser.newPage({ viewport: { width: item.width, height: item.height } });
    await page.goto(process.env.BASE_URL || 'http://127.0.0.1:8321/index.html', { waitUntil: 'load' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'load' });
    if (item.lang === 'es') await page.click('#langToggle');
    if (item.view === 'share') {
      await page.click('[data-open-tool="share"]');
      await page.click('[data-share-preset="anglelimit"]');
      await page.locator('.share-stage').scrollIntoViewIfNeeded();
    } else if (item.view === 'mastery') {
      await page.click('[data-open-tool="mastery"]');
      await page.locator('#mastery').scrollIntoViewIfNeeded();
    } else {
      await page.click('#resumeNav');
      await page.locator('#learnerJourney').scrollIntoViewIfNeeded();
    }
    await page.waitForTimeout(500);
    const file = path.join(output, `${item.width}x${item.height}-${item.lang}-${item.view}.png`);
    await page.screenshot({ path: file, fullPage: false });
    console.log(file);
    await page.close();
  }
  await browser.close();
})();
