const { chromium } = require('playwright');

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:8321/index.html';
const CHROMIUM_PATH = process.env.CHROMIUM_PATH;
const checks = [];
const check = async (name, fn) => {
  try { await fn(); checks.push([true, name]); console.log(`PASS  ${name}`); }
  catch (error) { checks.push([false, name]); console.error(`FAIL  ${name}\n      ${error.message}`); }
};
const assert = (condition, message) => { if (!condition) throw new Error(message); };

(async () => {
  const browser = await chromium.launch({ headless: true, ...(CHROMIUM_PATH ? { executablePath: CHROMIUM_PATH } : {}) });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });

  await check('learner navigation exposes only Learn, Practice, and Tools', async () => {
    const labels = await page.locator('.learner-nav button').allTextContents();
    assert(labels.join('|') === 'Learn|Practice|Tools', `unexpected learner nav: ${labels.join('|')}`);
  });

  await check('Practice opens the visual decision scenario below sticky chrome', async () => {
    await page.click('#navPractice'); await page.waitForTimeout(450);
    const state = await page.evaluate(() => ({ tool: document.body.dataset.tool, nav: document.querySelector('.nav').getBoundingClientRect().bottom, top: document.querySelector('#scenarioLab').getBoundingClientRect().top }));
    assert(state.tool === 'scenario', `expected scenario, got ${state.tool}`);
    assert(state.top >= state.nav, `scenario starts at ${state.top}, behind nav at ${state.nav}`);
  });

  await check('Tools returns to the focused tool hub', async () => {
    await page.click('#navTools'); await page.waitForTimeout(450);
    assert(await page.locator('#resources').isVisible(), 'tool hub is not visible');
    assert(await page.locator('.resource-card').count() === 6, 'expected six focused tools');
  });

  await check('Learn returns to the photograph-first decision', async () => {
    await page.click('#navLearn'); await page.waitForTimeout(450);
    assert(await page.locator('#learnerJourney').isVisible(), 'course is not visible');
    assert(await page.locator('#journeyReveal').isHidden(), 'reasoning should remain hidden before a decision');
  });

  await check('confidence is captured and a miss reveals the reasoning', async () => {
    await page.click('[data-journey-choice="0"]');
    await page.click('#journeyConfidence [data-confidence="high"]');
    await page.click('#journeyCheck'); await page.waitForTimeout(150);
    assert(await page.locator('#journeyReveal').isVisible(), 'reasoning did not reveal after the decision');
    const events = await page.evaluate(() => JSON.parse(localStorage.getItem('cq.rig101.confidenceEvents') || '[]'));
    assert(events.length === 1 && events[0].confidence === 'high', 'high-confidence attempt was not recorded');
  });

  await check('high-confidence errors become a readiness signal', async () => {
    const count = await page.locator('#confidenceErrorStatus').textContent();
    const needsPractice = await page.locator('.competency-row.needs-practice').count();
    assert(count === '1', `expected one high-confidence error, got ${count}`);
    assert(needsPractice === 1, `expected one needs-practice skill, got ${needsPractice}`);
  });

  await check('knowledge and observed performance remain separate records', async () => {
    await page.locator('[data-open-tool="mastery"]').first().click(); await page.waitForTimeout(300);
    assert((await page.locator('.evidence-state.knowledge').innerText()).includes('In progress'), 'knowledge state missing');
    assert((await page.locator('.evidence-state.performance').innerText()).includes('Not yet observed'), 'field-performance boundary missing');
  });

  await check('no JavaScript errors occur in the competency flow', async () => assert(errors.length === 0, errors.join('\n')));
  await browser.close();
  const failed = checks.filter(([ok]) => !ok).length;
  console.log(`\n${checks.length - failed}/${checks.length} passed`);
  process.exit(failed ? 1 : 0);
})().catch(error => { console.error(error); process.exit(1); });
