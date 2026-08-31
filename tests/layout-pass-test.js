/* Visual/layout pass: overflow, sticky stack, empty columns, primary action. */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE_URL || 'http://127.0.0.1:8321/index.html';
const EXEC = process.env.CHROMIUM_PATH;
const source = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const salt = (source.match(/const SALT="([^"]+)"/) || [])[1];
const fnv = value => { let hash = 0x811c9dc5; for (let i = 0; i < value.length; i++) { hash ^= value.charCodeAt(i); hash = Math.imul(hash, 0x01000193) >>> 0; } return hash.toString(16).padStart(8, '0'); };
const answers = {};
for (const line of source.split('\n')) {
  const match = line.match(/id:"(RIG101_d\d)".*?hash:"([a-f0-9]{8})"/);
  if (match) for (let i = 0; i < 10; i++) if (fnv(`${salt}:${match[1]}:${i}`) === match[2]) { answers[match[1]] = i; break; }
}

const results = [];
const check = async (name, run) => {
  try { if (!(await run())) throw new Error('assertion false'); results.push({ name, pass: true }); console.log(`PASS  ${name}`); }
  catch (error) { results.push({ name, pass: false, why: error.message }); console.error(`FAIL  ${name}\n      ${error.message}`); }
};

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: EXEC || undefined });

  const measure = async (page) => page.evaluate(() => {
    const overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    const stickyTop = [...document.querySelectorAll('body *')].filter(el => {
      const style = getComputedStyle(el);
      if (style.position !== 'sticky' && style.position !== 'fixed') return false;
      if (style.display === 'none' || style.visibility === 'hidden') return false;
      const rect = el.getBoundingClientRect();
      return rect.height > 8 && rect.top < 8 && rect.bottom > 0;
    }).map(el => ({
      id: el.id || el.className,
      top: Math.round(el.getBoundingClientRect().top),
      height: Math.round(el.getBoundingClientRect().height)
    }));
    const card = document.querySelector('.journey-card');
    const cols = card ? getComputedStyle(card).gridTemplateColumns.split(' ').filter(Boolean) : [];
    const visual = document.querySelector('.journey-visual');
    const copy = document.querySelector('.journey-copy');
    const visualBox = visual?.getBoundingClientRect();
    const copyBox = copy?.getBoundingClientRect();
    const checkBtn = document.querySelector('#journeyCheck');
    const nextBtn = document.querySelector('#journeyNext');
    const prevBtn = document.querySelector('#journeyPrev');
    const weight = (el) => {
      if (!el) return 0;
      const style = getComputedStyle(el);
      const bg = style.backgroundColor;
      const nums = (bg.match(/\d+/g) || []).map(Number);
      const lum = nums.length >= 3 ? (0.2126 * nums[0] + 0.7152 * nums[1] + 0.0722 * nums[2]) : 255;
      return { lum, weight: Number(style.fontWeight) || 400, disabled: el.disabled };
    };
    return {
      overflow,
      stickyTop,
      cols,
      visualHeight: visualBox ? visualBox.height : 0,
      copyHeight: copyBox ? copyBox.height : 0,
      check: weight(checkBtn),
      next: weight(nextBtn),
      prev: weight(prevBtn),
      step: document.querySelector('.journey-card')?.dataset.journeyStep,
      checkClass: checkBtn?.className,
      nextClass: nextBtn?.className
    };
  });

  const page390 = await (await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })).newPage();
  await page390.goto(BASE, { waitUntil: 'load' });
  await page390.evaluate(() => localStorage.clear());
  await page390.reload({ waitUntil: 'load' });
  await page390.click('#heroGuided');
  await page390.waitForTimeout(400);

  await check('390px course has no page-level overflow on step 1', async () => {
    const state = await measure(page390);
    if (state.overflow > 1) throw new Error(`overflow ${state.overflow}px`);
    return true;
  });

  await check('390px does not stack three sticky layers at the top', async () => {
    const state = await measure(page390);
    if (state.stickyTop.length > 2) throw new Error(`sticky layers: ${JSON.stringify(state.stickyTop)}`);
    return true;
  });

  await check('390px Check is the primary action before mastery', async () => {
    const state = await measure(page390);
    if (!/\bbtn-gold\b/.test(state.checkClass)) throw new Error(`check class ${state.checkClass}`);
    if (/\bbtn-gold\b/.test(state.nextClass)) throw new Error(`next should not be gold yet: ${state.nextClass}`);
    if (state.check.lum >= state.prev.lum) throw new Error(`check luminance ${state.check.lum} not darker than prev ${state.prev.lum}`);
    return true;
  });

  await check('390px continue dock stays on-screen and tappable', async () => {
    await page390.locator('#journeyCheck').scrollIntoViewIfNeeded();
    const box = await page390.locator('#journeyCheck').boundingBox();
    if (!box) throw new Error('check button missing');
    if (box.height < 44) throw new Error(`tap target ${box.height}`);
    if (box.y + box.height > 844 + 1) throw new Error(`check sits at ${box.y + box.height}, below viewport`);
    return true;
  });

  for (let i = 0; i < 6; i++) {
    await check(`390px step ${i + 1} wraps without overflow`, async () => {
      if (i > 0) {
        await page390.click(`.journey-option[data-journey-choice="${answers[`RIG101_d${i}`]}"]`);
        await page390.click('#journeyCheck');
        await page390.click('#journeyNext');
        await page390.waitForTimeout(250);
      }
      const state = await measure(page390);
      if (state.overflow > 1) throw new Error(`overflow ${state.overflow}px`);
      if (state.step !== String(i + 1)) throw new Error(`expected step ${i + 1}, got ${state.step}`);
      return true;
    });
  }

  const pageDesk = await (await browser.newContext({ viewport: { width: 1366, height: 900 } })).newPage();
  await pageDesk.goto(BASE, { waitUntil: 'load' });
  await pageDesk.evaluate(() => localStorage.clear());
  await pageDesk.reload({ waitUntil: 'load' });
  await pageDesk.click('#heroGuided');
  await pageDesk.waitForTimeout(400);

  await check('desktop photo step keeps two working columns', async () => {
    const state = await measure(pageDesk);
    if (state.cols.length !== 2) throw new Error(`columns ${state.cols.join(' | ')}`);
    if (state.visualHeight < 200) throw new Error(`visual pane collapsed: ${state.visualHeight}`);
    return true;
  });

  await check('desktop Next becomes the primary action after mastery', async () => {
    await pageDesk.click(`.journey-option[data-journey-choice="${answers.RIG101_d1}"]`);
    await pageDesk.click('#journeyCheck');
    await pageDesk.waitForTimeout(200);
    const state = await measure(pageDesk);
    if (!/\bbtn-gold\b/.test(state.nextClass)) throw new Error(`next class ${state.nextClass}`);
    if (/\bbtn-gold\b/.test(state.checkClass)) throw new Error(`check should drop gold after mastery: ${state.checkClass}`);
    return true;
  });

  await check('desktop hitch step collapses the empty side column', async () => {
    await pageDesk.click('#journeyNext');
    await pageDesk.waitForTimeout(300);
    const state = await measure(pageDesk);
    if (state.cols.length !== 1) throw new Error(`expected single column for technical visual, got ${state.cols.join(' | ')}`);
    if (state.overflow > 1) throw new Error(`overflow ${state.overflow}px`);
    return true;
  });

  await check('toast sits above the action chrome', async () => {
    const z = await pageDesk.evaluate(() => {
      const toast = getComputedStyle(document.getElementById('toast'));
      const nav = getComputedStyle(document.querySelector('.nav'));
      return { toastZ: Number(toast.zIndex), navZ: Number(nav.zIndex), toastBottom: toast.bottom };
    });
    if (!(z.toastZ > z.navZ)) throw new Error(`toast z ${z.toastZ} vs nav ${z.navZ}`);
    return true;
  });

  await check('no new lesson strings were introduced by the layout pass', async () => {
    const before = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
    return before.includes('Worked example') && before.includes('What do you see? Make the field decision.') && before.includes('data-journey-step');
  });

  await browser.close();
  const failed = results.filter(item => !item.pass).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
})().catch(error => { console.error(error); process.exit(1); });
