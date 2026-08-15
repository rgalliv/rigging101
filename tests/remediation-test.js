const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const salt = (source.match(/const SALT="([^"]+)"/) || [])[1];
const fnv = value => { let hash = 0x811c9dc5; for (let i = 0; i < value.length; i++) { hash ^= value.charCodeAt(i); hash = Math.imul(hash, 0x01000193) >>> 0; } return hash.toString(16).padStart(8, '0'); };
const q1Hash = (source.match(/id:"RIG101_q1".*?hash:"([a-f0-9]{8})"/) || [])[1];
const q1Answer = [0,1,2,3].find(index => fnv(`${salt}:RIG101_q1:${index}`) === q1Hash);

const BASE = process.env.BASE_URL || 'http://127.0.0.1:8321/index.html';
const EXEC = process.env.CHROMIUM_PATH;
const results = [];
async function check(name, run) {
  try { if (!(await run())) throw new Error('assertion false'); results.push({ name, pass: true }); }
  catch (error) { results.push({ name, pass: false, why: error.message }); }
}

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: EXEC || undefined });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(BASE, { waitUntil: 'load' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'load' });

  await check('anonymous startup does not create a device record', async () =>
    !(await page.evaluate(() => localStorage.getItem('cq.rig101.recordEnvelope'))));

  await check('document has one H1 and four readiness cards', async () =>
    (await page.locator('h1').count()) === 1 && (await page.locator('.mastery-status .status').count()) === 4);

  await check('tool panels do not create nested complementary landmarks', async () => {
    for (const tool of ['visual','explorer','scenario','share','mastery']) {
      await page.locator(`[data-tool-tab="${tool}"]`).evaluate(button => button.click());
      if (await page.locator('main aside').count()) return false;
    }
    return true;
  });

  await check('learner record exposes identity, retention, export, and deletion controls', async () =>
    ['#learnerName','#learnerId','#retentionPeriod','#exportRecord','#deleteRecord'].every(selector => page.locator(selector)) &&
    (await page.locator('#retentionPeriod option').count()) === 4);

  await check('all rendered images have an alt attribute in English and Spanish', async () => {
    for (const language of ['en', 'es']) {
      const current = await page.getAttribute('html', 'lang');
      if (current !== language) await page.click('#langToggle');
      for (const tool of ['visual','explorer','scenario','share','mastery']) {
        await page.click(`[data-open-tool="${tool}"]`); await page.waitForTimeout(80);
        if (await page.locator('img:not([alt])').count()) return false;
        await page.click('#closeTool');
      }
      if (language === 'es') {
        await page.click('#navLearn');
        await page.click('.journey-step[data-journey-index="3"]');
        const hardwareAlt = await page.getAttribute('#journeyImage', 'alt');
        if (!hardwareAlt.includes('Grillete') || hardwareAlt.includes('Gancho')) return false;
      }
    }
    return true;
  });

  await check('Spanish mobile layout has no page-level horizontal overflow', async () => {
    if ((await page.getAttribute('html', 'lang')) !== 'es') await page.click('#langToggle');
    for (const tool of ['visual','explorer','scenario','share','mastery']) {
      await page.locator(`[data-tool-tab="${tool}"]`).evaluate(button => button.click()); await page.waitForTimeout(80);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (overflow > 1) {
        const offenders = await page.evaluate(() => [...document.querySelectorAll('body *')]
          .filter(element => { const rect = element.getBoundingClientRect(); return rect.right > innerWidth + 1 || rect.left < -1; })
          .slice(0, 8).map(element => `${element.tagName.toLowerCase()}${element.id ? '#' + element.id : ''}${element.className && typeof element.className === 'string' ? '.' + element.className.trim().replace(/\s+/g,'.') : ''}:${Math.round(element.getBoundingClientRect().right)}`));
        throw new Error(`${tool}: ${overflow}px overflow (${offenders.join(', ')})`);
      }
      await page.click('#closeTool');
    }
    return true;
  });

  await check('a second consecutive assessment miss requires related learning before retry', async () => {
    if ((await page.getAttribute('html', 'lang')) !== 'en') await page.click('#langToggle');
    await page.click('[data-open-tool="mastery"]');
    const wrong = (q1Answer + 1) % 4;
    for (let attempt = 0; attempt < 2; attempt++) {
      await page.click(`.quiz-option[data-qchoice="${wrong}"]`);
      await page.click('#checkAnswer');
      if (attempt === 0) await page.click('#checkAnswer');
    }
    const gated = await page.locator('#checkAnswer').isDisabled();
    await page.reload({ waitUntil: 'load' });
    await page.click('[data-open-tool="mastery"]');
    const gateSurvivedReload = await page.locator('#checkAnswer').isDisabled();
    const route = page.locator('#quizFeedback [data-related-learning]');
    const routeShown = await route.count() === 1;
    await route.click();
    await page.click('.resource-grid [data-open-tool="mastery"]');
    const released = !(await page.locator('#checkAnswer').isDisabled());
    await page.click('#closeTool');
    return gated && gateSurvivedReload && routeShown && released;
  });

  await check('near-30-degree scenario exposes angle bands, L/H, and LAF', async () => {
    if ((await page.getAttribute('html', 'lang')) !== 'en') await page.click('#langToggle');
    await page.click('[data-open-tool="share"]');
    await page.click('[data-share-preset="anglelimit"]');
    const text = await page.locator('#shareMetrics').innerText();
    const riskyBand = await page.locator('.angle-band.warning, .angle-band.stop').count();
    return riskyBand > 0 && text.includes('L/H') && text.includes('LAF');
  });

  await check('working-load escalation thresholds are configurable', async () => {
    await page.click('#resetShare');
    await page.click('[data-share-panel="capacity"]');
    const thresholdInputs = await page.locator('[data-threshold]').count();
    await page.fill('[data-threshold="critical"]', '90');
    await page.locator('[data-threshold="critical"]').dispatchEvent('change');
    for (const [key,value] of [['leftSlingWll','6000'],['rightSlingWll','20000'],['leftHardwareWll','20000'],['rightHardwareWll','20000'],['topHardwareWll','20000']]) await page.fill(`[data-capacity-key="${key}"]`, value);
    await page.click('[data-apply-capacity]');
    await page.click('[data-share-panel="assumptions"]');
    await page.check('[data-evidence-inspection]');
    await page.click('[data-share-panel="capacity"]');
    const statusCopy = await page.locator('.share-system-status').innerText();
    return thresholdInputs === 2 &&
      (await page.getAttribute('[data-threshold="elevated"]', 'value')) === '80' &&
      statusCopy.includes('90% or more') && !statusCopy.includes('95% or more');
  });

  await check('every public instructor entry uses the passcode gate', async () => {
    await page.click('#closeTool');
    await page.locator('#instructorAgendaNav').evaluate(button => button.click());
    const navGate = await page.locator('#instructorGate').evaluate(dialog => dialog.open);
    const navWorkspace = await page.locator('#instructorDialog').evaluate(dialog => dialog.open);
    await page.locator('#instructorGateForm button[value="cancel"]').click();
    return navGate && !navWorkspace && !(await page.locator('#instructorGate').evaluate(dialog => dialog.open));
  });

  await check('glossary links and print control are available at calculation terms', async () => {
    await page.click('[data-open-tool="share"]');
    await page.click('[data-share-panel="model"]');
    const links = await page.locator('[data-glossary-entry]').count();
    await page.locator('[data-glossary-entry="glossary-laf"]').first().click();
    const open = await page.locator('#glossaryDialog').evaluate(dialog => dialog.open);
    return links >= 2 && open && (await page.locator('#glossaryPrint').count()) === 1;
  });

  await check('listed contrast-sensitive labels meet 4.5:1', async () => {
    await page.locator('#glossaryClose').click();
    return page.evaluate(() => {
      const rgb = value => (value.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
      const lum = color => rgb(color).map(v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; })
        .reduce((sum, value, index) => sum + value * [.2126,.7152,.0722][index], 0);
      const background = element => {
        for (let node = element; node; node = node.parentElement) {
          const color = getComputedStyle(node).backgroundColor;
          if (color && !color.endsWith(', 0)') && color !== 'rgba(0, 0, 0, 0)') return color;
        }
        return 'rgb(255,255,255)';
      };
      const failures = ['.eyebrow','.competency-label','.section-label','.reference-label'].map(selector => {
        const element = document.querySelector(selector);
        if (!element) return null;
        const a = lum(getComputedStyle(element).color), b = lum(background(element));
        const ratio = (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
        return ratio < 4.5 ? `${selector}:${ratio.toFixed(2)}` : null;
      }).filter(Boolean);
      if (failures.length) throw new Error(failures.join(', '));
      return true;
    });
  });

  await check('mobile interactive targets meet 44 CSS pixels', async () => {
    for (const tool of ['visual','explorer','scenario','share','mastery']) {
      await page.click(`[data-open-tool="${tool}"]`); await page.waitForTimeout(80);
      const undersized = await page.evaluate(() => [...document.querySelectorAll('button,input,select,a[href]')]
        .filter(element => { const rect=element.getBoundingClientRect(),style=getComputedStyle(element); return rect.width>0&&rect.height>0&&style.visibility!=='hidden'&&(rect.width<44||rect.height<44); })
        .map(element => `${element.tagName.toLowerCase()}#${element.id || ''}:${Math.round(element.getBoundingClientRect().width)}x${Math.round(element.getBoundingClientRect().height)}`));
      if (undersized.length) throw new Error(`${tool}: ${undersized.slice(0,8).join(', ')}`);
    }
    return true;
  });

  await check('delete removes the device record without reload recreation', async () => {
    await page.locator('[data-tool-tab="mastery"]').evaluate(button => button.click());
    await page.fill('#learnerName', 'Delete Test');
    await page.locator('#learnerName').dispatchEvent('change');
    if (!(await page.evaluate(() => localStorage.getItem('cq.rig101.recordEnvelope')))) return false;
    await page.click('#deleteRecord');
    await page.waitForLoadState('load'); await page.waitForTimeout(150);
    return !(await page.evaluate(() => localStorage.getItem('cq.rig101.recordEnvelope')));
  });

  await check('no JavaScript errors occur in remediation checks', () => errors.length === 0);

  const passed = results.filter(result => result.pass).length;
  for (const result of results) console.log(`${result.pass ? 'PASS' : 'FAIL'}  ${result.name}${result.why ? ` -> ${result.why}` : ''}`);
  console.log(`\n${passed}/${results.length} passed`);
  await browser.close();
  process.exit(passed === results.length ? 0 : 1);
})();
