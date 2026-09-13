const { chromium } = require('playwright');

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:8321/index.html';
const CHROMIUM_PATH = process.env.CHROMIUM_PATH;
const assert = (condition, message) => { if (!condition) throw new Error(message); };

(async () => {
  const browser = await chromium.launch({ headless: true, ...(CHROMIUM_PATH ? { executablePath: CHROMIUM_PATH } : {}) });
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });

  await page.click('[data-journey-choice="1"]');
  await page.click('#journeyConfidence [data-confidence="high"]');
  await page.click('#journeyCheck');
  await page.click('#journeyNext');
  assert((await page.locator('#journeyTitle').textContent()) === 'Select the hitch', 'Stage 2 did not open');
  assert((await page.locator('#journeyImage').getAttribute('src')).includes('hitch-types-controlled-loads.jpg'), 'approved technical diagram is not used');
  assert((await page.locator('#journeyImage').getAttribute('alt')).startsWith('Technical comparison'), 'technical alt text is missing');
  assert(await page.locator('.journey-visual').evaluate(node => node.classList.contains('technical-visual')), 'stable technical-visual layout is not active');
  assert(await page.locator('#journeyReveal').isVisible(), 'teaching is hidden before the decision');
  const beforeHeight = await page.locator('.journey-visual').evaluate(node => node.getBoundingClientRect().height);

  await page.click('[data-journey-choice="0"]');
  await page.click('#journeyConfidence [data-confidence="high"]');
  await page.click('#journeyCheck');
  assert(await page.locator('#journeyReveal').isVisible(), 'teaching hid after a miss');
  assert(!(await page.locator('#journeyFeedback').innerText()).toLowerCase().includes('correct'), 'Stage 2 answer letter was disclosed after a miss');
  assert((await page.locator('#journeyFeedback').innerText()).includes('coached attempt remains recorded'), 'honest coached-retry message is missing');
  const afterHeight = await page.locator('.journey-visual').evaluate(node => node.getBoundingClientRect().height);
  assert(Math.abs(beforeHeight - afterHeight) < 2, `technical diagram changed height after feedback (${beforeHeight} to ${afterHeight})`);

  await page.click('#journeyFeedback [data-related-learning="RIG101_d2"]');
  assert(await page.locator('#hitchPrimerDialog').isVisible(), 'hitch comparison did not open');
  assert(await page.locator('#hitchPrimerDialog img').count() === 2, 'hitch comparison should contain two approved diagrams');
  await page.click('#hitchPrimerClose');
  await page.click('#journeyRetry');
  assert((await page.locator('#journeyConfidence [data-confidence="high"]').getAttribute('aria-pressed')) === 'true', 'guided retry did not preserve confidence');
  await page.click('[data-journey-choice="2"]');
  await page.click('#journeyCheck');
  assert((await page.locator('#journeyProgressText').textContent()) === '2 / 6', 'Stage 2 mastery was not recorded once');
  assert(await page.locator('#journeyReveal').isVisible(), 'reasoning did not reveal after mastery');
  assert((await page.locator('#journeyWhy').innerText()).includes('D/d'), 'bearing and D/d teaching is missing');
  await page.click('#journeyNext');
  assert((await page.locator('#journeyTitle').textContent()) === 'Size at the working angle', 'Step 3 did not open after Stage 2');
  assert(await page.locator('#journeyWorked').isVisible(), 'Step 3 worked example is hidden');
  assert((await page.locator('#journeyWorkedBody').innerText()).includes('7,071'), 'Step 3 worked example is missing the 45° numbers');

  await page.locator('[data-open-tool="mastery"]').first().click();
  await page.click('.quiz-option[data-qchoice="0"]');
  await page.click('#checkAnswer');
  await page.click('#nextQuestion');
  assert((await page.locator('.quiz-question').innerText()).includes('bundle of smooth pipe'), 'final Stage 2 item is not a transfer scenario');
  await page.click('#quizConfidence [data-confidence="high"]');
  await page.click('.quiz-option[data-qchoice="0"]');
  await page.click('#checkAnswer');
  await page.click('#quizFeedback [data-related-learning="RIG101_q2"]');
  await page.click('#hitchPrimerClose');
  await page.click('#checkAnswer');
  assert((await page.locator('#quizConfidence [data-confidence="high"]').getAttribute('aria-pressed')) === 'true', 'assessment retry did not preserve confidence');
  await page.click('.quiz-option[data-qchoice="1"]');
  await page.click('#checkAnswer');
  assert((await page.locator('#quizFeedback').innerText()).startsWith('Correct.'), 'transfer answer did not score correctly');
  const record = await page.evaluate(() => JSON.parse(localStorage.getItem('cq.rig101.recordEnvelope')));
  const stage2Events = record.data.confidenceEvents.filter(event => event.skill === 'RIG101_d2');
  assert(stage2Events.length === 4, `expected four Stage 2 evidence events, found ${stage2Events.length}`);
  assert(stage2Events.filter(event => !event.correct).length === 2, 'Stage 2 misses were not preserved');
  assert(errors.length === 0, errors.join('\n'));

  await browser.close();
  console.log('PASS  Stage 2 content, visuals, remediation, scoring, transfer, and evidence history');
})().catch(error => { console.error(`FAIL  ${error.message}`); process.exit(1); });
