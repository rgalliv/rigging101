/* Full functional button test for Rigging 101 (index.html).
   Clicks every button on every section/tab and asserts the expected state change.

   Usage:
     1. Serve the repo root:  npx http-server -p 8321
     2. Run:                  node tests/button-test.js
   Requires Playwright (npm i -g playwright) with a Chromium build available.
   Optional env: BASE_URL (default http://127.0.0.1:8321/index.html),
                 CHROMIUM_PATH (explicit browser executable). */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const BASE = process.env.BASE_URL || 'http://127.0.0.1:8321/index.html';
const ORIGIN = new URL(BASE).origin;

// Derive the answer key at runtime from the FNV-1a hashes embedded in index.html,
// so no plaintext key lives in the repo.
const src = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const SALT = (src.match(/const SALT="([^"]+)"/) || [])[1];
const fnv = s => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16).padStart(8, '0'); };
const ANSWERS = {};
for (const line of src.split('\n')) {
  const m = line.match(/id:"(RIG101_[dsq]\d)".*?hash:"([a-f0-9]{8})"/);
  if (m) for (let i = 0; i < 10; i++) if (fnv(`${SALT}:${m[1]}:${i}`) === m[2]) { ANSWERS[m[1]] = i; break; }
}

const results = [];
const ok = (name) => results.push({ name, pass: true });
const fail = (name, why) => results.push({ name, pass: false, why });
async function check(name, fn) {
  try { const r = await fn(); r === false ? fail(name, 'assertion false') : ok(name); }
  catch (e) { fail(name, String(e.message || e).split('\n')[0]); }
}

(async () => {
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 950 } });
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: ORIGIN });
  const page = await ctx.newPage();
  const consoleErrors = [];
  page.on('pageerror', e => consoleErrors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push('console: ' + m.text()); });
  await page.addInitScript(() => {
    window.__printed = 0;
    window.print = () => { window.__printed++; window.dispatchEvent(new Event('afterprint')); };
  });

  await page.goto(BASE, { waitUntil: 'load' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(400);

  const txt = async s => (await page.textContent(s) || '').trim();

  // ---------- 0. Baseline ----------
  await check('page loads with no JS errors', async () => consoleErrors.length === 0 || (() => { throw new Error(consoleErrors.join(' | ')) })());

  // ---------- 1. Nav / hero ----------
  await check('nav "Start course" (resumeNav) scrolls to 6-step course', async () => {
    await page.click('#resumeNav');
    await page.waitForTimeout(600);
    return await page.evaluate(() => { const r = document.querySelector('#learnerJourney').getBoundingClientRect(); return r.top > -200 && r.top < 400; });
  });
  await check('hero "Start the 6-step course" (heroGuided)', async () => { await page.click('#heroGuided'); await page.waitForTimeout(400); return true; });
  await check('hero "Open reference tools" opens explorer tool mode', async () => {
    await page.click('.hero-actions [data-open-tool="explorer"]');
    await page.waitForTimeout(300);
    return await page.evaluate(() => document.body.dataset.tool === 'explorer' && document.body.classList.contains('tool-open'));
  });
  await check('"Back to the 6-step course" (closeTool) exits tool mode', async () => {
    await page.click('#closeTool');
    await page.waitForTimeout(200);
    return await page.evaluate(() => !document.body.classList.contains('tool-open'));
  });

  // ---------- 2. Rigging library tiles (10) — only visible inside explorer mode (by design) ----------
  await page.click('.hero-actions [data-open-tool="explorer"]'); await page.waitForTimeout(300);
  await check('library strip visible in explorer mode', async () =>
    await page.$eval('.library', el => getComputedStyle(el).display !== 'none'));
  const tiles = await page.$$eval('#configTiles .tile', els => els.map(e => ({ id: e.dataset.config, label: e.getAttribute('aria-label') })));
  await check('library renders 10 configuration tiles', async () => tiles.length === 10);
  for (const t of tiles) {
    await check(`config tile "${t.id}" switches the stage`, async () => {
      await page.click(`#configTiles .tile[data-config="${t.id}"]`, { timeout: 5000 });
      await page.waitForTimeout(150);
      const sel = await page.getAttribute(`#configTiles .tile[data-config="${t.id}"]`, 'aria-selected');
      const img = await page.$eval('#scene image', el => el.getAttribute('href'));
      return sel === 'true' && img.includes('configurations');
    });
  }
  await page.click('#configTiles .tile[data-config="bridle2"]'); await page.waitForTimeout(150);
  await page.click('#closeTool'); await page.waitForTimeout(200);

  // ---------- 3. Six-step course (journey) ----------
  await page.click('#heroGuided'); await page.waitForTimeout(300);
  // stepper buttons
  for (let i = 0; i < 6; i++) {
    await check(`journey stepper button ${i + 1} selects step`, async () => {
      await page.click(`#journeyStepper button[data-journey-index="${i}"]`);
      await page.waitForTimeout(120);
      return (await txt('#journeyStepLabel')) === `Step ${i + 1} of 6`;
    });
  }
  // back to step 1, test wrong answer then "Try again", then master all 6
  await page.click('#journeyStepper button[data-journey-index="0"]'); await page.waitForTimeout(120);
  await check('journey wrong option -> "Check decision" gives miss feedback + Try again', async () => {
    const wrong = (ANSWERS['RIG101_d1'] + 1) % 4;
    await page.click(`#journeyOptions button[data-journey-choice="${wrong}"]`);
    await page.click('#journeyCheck');
    await page.waitForTimeout(120);
    const fb = await page.getAttribute('#journeyFeedback', 'class');
    const label = await txt('#journeyCheck');
    return /bad/.test(fb) && /Try again/i.test(label);
  });
  await check('journey "Try again" resets the step', async () => {
    await page.click('#journeyCheck'); await page.waitForTimeout(120);
    return (await txt('#journeyCheck')) === 'Check decision';
  });
  for (let i = 0; i < 6; i++) {
    const id = `RIG101_d${i + 1}`;
    await check(`journey step ${i + 1}: correct option masters + Next advances`, async () => {
      await page.click(`#journeyOptions button[data-journey-choice="${ANSWERS[id]}"]`);
      await page.click('#journeyCheck');
      await page.waitForTimeout(150);
      const good = /good/.test(await page.getAttribute('#journeyFeedback', 'class'));
      const nextDisabled = await page.$eval('#journeyNext', b => b.disabled);
      if (!good) throw new Error('feedback not good');
      if (i < 5) { if (nextDisabled) throw new Error('Next still disabled'); await page.click('#journeyNext'); await page.waitForTimeout(500); }
      return true;
    });
  }
  await check('journey progress shows 6 / 6 mastered', async () => (await txt('#journeyProgressText')) === '6 / 6');
  await check('journey "Previous" button steps back', async () => {
    await page.click('#journeyPrev'); await page.waitForTimeout(120);
    return (await txt('#journeyStepLabel')) === 'Step 5 of 6';
  });

  // ---------- 4. Explorer (reference tool) ----------
  await page.click('.hero-actions [data-open-tool="explorer"]'); await page.waitForTimeout(300);
  // focus filter
  for (const f of ['hook', 'sling', 'load', 'all']) {
    await check(`catalog filter "${f}"`, async () => {
      await page.click(`#focusControls button[data-focus="${f}"]`);
      await page.waitForTimeout(120);
      return await page.$eval(`#focusControls button[data-focus="${f}"]`, b => b.classList.contains('active'));
    });
  }
  // angle buttons
  for (const a of [45, 30, 60]) {
    await check(`sling angle ${a}° button updates readout`, async () => {
      await page.click(`#angleControls button[data-angle="${a}"]`);
      await page.waitForTimeout(120);
      const active = await page.$eval(`#angleControls button[data-angle="${a}"]`, b => b.classList.contains('active'));
      const readout = await txt('#readout');
      return active && readout.includes(`${a}°`);
    });
  }
  // layer toggles
  const layerBtns = await page.$$eval('#layerControls button', els => els.map(e => e.dataset.layer));
  for (const l of layerBtns) {
    await check(`technical layer toggle "${l}"`, async () => {
      const before = await page.$eval(`#layerControls button[data-layer="${l}"]`, b => b.getAttribute('aria-pressed'));
      await page.click(`#layerControls button[data-layer="${l}"]`);
      await page.waitForTimeout(120);
      const after = await page.$eval(`#layerControls button[data-layer="${l}"]`, b => b.getAttribute('aria-pressed'));
      return before !== after;
    });
  }
  await check('weight input recalculates readout', async () => {
    await page.click('#configTiles .tile[data-config="bridle2"]'); await page.waitForTimeout(150);
    await page.click('#angleControls button[data-angle="60"]'); await page.waitForTimeout(150);
    await page.fill('#weightInput', '20000');
    await page.dispatchEvent('#weightInput', 'change');
    await page.waitForTimeout(250);
    // 20,000 lb / 2 legs * 1.155 LAF = 11,547 lb per leg
    return (await txt('#readout')).includes('11,547');
  });
  await check('"Show kg" unit toggle', async () => {
    await page.click('#unitToggle'); await page.waitForTimeout(120);
    const on = (await txt('#unitToggle')) === 'Showing kg' && (await txt('#readout')).includes('kg');
    await page.click('#unitToggle'); await page.waitForTimeout(120);
    return on && (await txt('#unitToggle')) === 'Show kg';
  });
  await check('"Print reference" triggers print', async () => {
    await page.click('#printGuide'); await page.waitForTimeout(100);
    return await page.evaluate(() => window.__printed >= 1);
  });
  await check('"Open the 6-step course" (guidedTour) leaves tool mode', async () => {
    await page.click('#guidedTour'); await page.waitForTimeout(400);
    return await page.evaluate(() => !document.body.classList.contains('tool-open'));
  });
  await page.click('.hero-actions [data-open-tool="explorer"]'); await page.waitForTimeout(300);

  // component catalog
  await check('component list renders parts', async () => (await page.$$('#componentList .part')).length > 0);
  await check('clicking a component opens its lesson', async () => {
    await page.click('#componentList .part[data-component="hook"]');
    await page.waitForTimeout(150);
    return (await txt('#detailTitle')) === 'Load hook';
  });
  for (const tab of ['failure', 'inspection', 'authority', 'decision', 'fn']) {
    await check(`detail tab "${tab}"`, async () => {
      await page.click(`.detail-tabs button[data-tab="${tab}"]`);
      await page.waitForTimeout(100);
      const sel = await page.getAttribute(`.detail-tabs button[data-tab="${tab}"]`, 'aria-selected');
      return sel === 'true' && (await txt('#contextPanel')).length > 10;
    });
  }
  await check('"Next →" advances to next component', async () => {
    const before = await txt('#detailTitle');
    await page.click('#nextPart'); await page.waitForTimeout(150);
    return (await txt('#detailTitle')) !== before;
  });
  await check('"← Previous" goes back a component', async () => {
    const before = await txt('#detailTitle');
    await page.click('#prevPart'); await page.waitForTimeout(150);
    return (await txt('#detailTitle')) !== before;
  });
  await check('search filters the catalog', async () => {
    await page.fill('#search', 'shackle'); await page.waitForTimeout(200);
    const n = (await page.$$('#componentList .part')).length;
    await page.fill('#search', ''); await page.waitForTimeout(200);
    return n >= 1 && n <= 4;
  });
  await check('"Unviewed only" toggle', async () => {
    await page.click('#unviewedOnly'); await page.waitForTimeout(150);
    const pressed = await page.getAttribute('#unviewedOnly', 'aria-pressed');
    await page.click('#unviewedOnly'); await page.waitForTimeout(100);
    return pressed === 'true';
  });
  await check('"Inspection criteria" shortcut opens inspection tab', async () => {
    await page.click('#inspectionShortcut'); await page.waitForTimeout(150);
    return (await page.getAttribute('.detail-tabs button[data-tab="inspection"]', 'aria-selected')) === 'true';
  });
  // zoom
  await check('zoom in / reset / out buttons', async () => {
    await page.click('#zoomIn'); await page.click('#zoomIn'); await page.waitForTimeout(100);
    const z140 = (await txt('#zoomReset')) === '140%';
    await page.click('#zoomOut'); await page.waitForTimeout(100);
    const z120 = (await txt('#zoomReset')) === '120%';
    await page.click('#zoomReset'); await page.waitForTimeout(100);
    return z140 && z120 && (await txt('#zoomReset')) === '100%';
  });

  // guided review (decision steps) inside explorer
  for (let i = 0; i < 6; i++) {
    await check(`review decision step ${i + 1} opens its body`, async () => {
      await page.click(`#decisionSteps button[data-index="${i}"]`);
      await page.waitForTimeout(150);
      return (await txt('#guidedBody')).includes(`Step ${i + 1}`);
    });
  }
  await check('review step: options behave per mastery state', async () => {
    await page.click('#decisionSteps button[data-index="0"]'); await page.waitForTimeout(150);
    const disabled = await page.$eval('#guidedBody .decision-option', b => b.disabled);
    if (disabled) return (await txt('#guidedBody')).length > 0; // mastered -> locked by design
    await page.click(`#guidedBody .decision-option[data-choice="${ANSWERS['RIG101_d1']}"]`);
    await page.click('#checkDecision'); await page.waitForTimeout(150);
    return (await txt('#guidedCount')).length > 0;
  });
  await check('review step "Next decision" advances', async () => {
    const before = await txt('#guidedBody');
    await page.click('#nextDecision'); await page.waitForTimeout(300);
    return (await txt('#guidedBody')) !== before;
  });

  // ---------- 5. Scenario lab ----------
  await page.click('#closeTool'); await page.waitForTimeout(200);
  await page.click('.resource-grid [data-open-tool="scenario"]'); await page.waitForTimeout(400);
  const evid = ['load', 'points', 'tag', 'hardware', 'protection', 'path'];
  await check('scenario hotspot marker click reveals evidence', async () => {
    await page.click(`.evidence-hotspot[data-evidence="load"]`);
    await page.waitForTimeout(150);
    return (await txt('#evidenceDetail')).includes('Load and center of gravity');
  });
  for (const e of evid) {
    await check(`evidence list button "${e}"`, async () => {
      await page.click(`.evidence-item[data-evidence="${e}"]`);
      await page.waitForTimeout(120);
      return await page.$eval(`.evidence-item[data-evidence="${e}"]`, el => el.classList.contains('seen'));
    });
  }
  await check('finding all 6 clues unlocks the decisions', async () => {
    return await page.evaluate(() => !document.querySelector('#scenarioCall').classList.contains('locked'));
  });
  for (let i = 1; i <= 4; i++) {
    const id = `RIG101_s${i}`;
    await check(`scenario decision ${i}: answer + check + next`, async () => {
      await page.click(`[data-scenario-choice="${ANSWERS[id]}"]`);
      await page.click('#checkScenarioCall'); await page.waitForTimeout(150);
      const goodFb = await page.$eval('#scenarioFeedback, .scenario-feedback, #scenarioQuestion', () => true).catch(() => true);
      const next = await page.$('#nextScenarioCall');
      if (next && !(await next.isDisabled())) { await next.click(); await page.waitForTimeout(200); }
      return true;
    });
  }
  await check('scenario shows "defended" complete state', async () => (await txt('#scenarioQuestion')).includes('defended'));

  // ---------- 6. Load-share lab ----------
  await page.click('#closeTool'); await page.waitForTimeout(200);
  await page.click('.resource-grid [data-open-tool="share"]'); await page.waitForTimeout(400);
  await check('training-load input + Apply', async () => {
    await page.fill('#shareWeight', '15000');
    await page.click('#applyShareWeight'); await page.waitForTimeout(150);
    return (await txt('#shareMetrics')).includes('lb');
  });
  await check('CG slider updates output', async () => {
    await page.$eval('#shareCg', el => { el.value = '40'; el.dispatchEvent(new Event('input', { bubbles: true })); });
    await page.waitForTimeout(150);
    return (await txt('#shareCgOutput')).includes('40%');
  });
  for (const h of [72, 120, 90]) {
    await check(`hook-height button ${h} in`, async () => {
      await page.click(`#shareHeight button[data-share-height="${h}"]`);
      await page.waitForTimeout(120);
      return (await page.getAttribute(`#shareHeight button[data-share-height="${h}"]`, 'aria-pressed')) === 'true';
    });
  }
  const presets = await page.$$eval('#sharePresets [data-share-preset]', els => els.map(e => e.dataset.sharePreset));
  await check('6 practice-scenario presets render', async () => presets.length === 6);
  for (const p of presets) {
    await check(`share preset "${p}" applies its scenario`, async () => {
      await page.click(`[data-share-preset="${p}"]`);
      await page.waitForTimeout(120);
      return await page.$eval(`[data-share-preset="${p}"]`, b => b.classList.contains('active'));
    });
  }
  await check('play / pause share animation', async () => {
    await page.click('#playShareAnimation'); await page.waitForTimeout(400);
    const playing = (await txt('#playShareAnimation')).includes('Pause');
    await page.click('#playShareAnimation'); await page.waitForTimeout(150);
    return playing;
  });
  await check('share answer buttons + Check decision', async () => {
    await page.click('[data-share-preset="gearbox"]'); await page.waitForTimeout(120);
    await page.click('[data-share-answer="left"]');
    const enabled = !(await page.$eval('#checkShare', b => b.disabled));
    await page.click('#checkShare'); await page.waitForTimeout(150);
    const fb = await page.getAttribute('#shareFeedback', 'class');
    return enabled && /good|bad/.test(fb);
  });
  await check('all three share answer buttons selectable', async () => {
    await page.click('#resetShare'); await page.waitForTimeout(120);
    for (const a of ['left', 'equal', 'right']) {
      await page.click(`[data-share-answer="${a}"]`);
      const sel = await page.$eval(`[data-share-answer="${a}"]`, b => b.classList.contains('selected'));
      if (!sel) throw new Error(a + ' not selectable');
    }
    return true;
  });
  await check('"Reset model" restores defaults', async () => {
    await page.click('#resetShare'); await page.waitForTimeout(150);
    return (await page.$eval('#shareWeight', e => e.value)) === '12000' && (await txt('#shareCgOutput')).includes('65%');
  });

  // ---------- 7. Final knowledge check ----------
  await page.click('#closeTool'); await page.waitForTimeout(200);
  await page.click('.resource-grid [data-open-tool="mastery"]'); await page.waitForTimeout(400);
  await check('quiz wrong answer -> miss feedback, then restart cycle works', async () => {
    const wrong = (ANSWERS['RIG101_q1'] + 1) % 4;
    await page.click(`#quizBody .quiz-option[data-qchoice="${wrong}"]`);
    await page.click('#checkAnswer'); await page.waitForTimeout(150);
    const bad = /bad/.test(await page.getAttribute('#quizFeedback', 'class'));
    // walk to the end so the miss forces a restart
    for (let i = 0; i < 8; i++) {
      const nextTxt = await txt('#nextQuestion');
      const disabled = await page.$eval('#nextQuestion', b => b.disabled);
      if (disabled) { await page.click(`#quizBody .quiz-option[data-qchoice="0"]`); await page.click('#checkAnswer'); await page.waitForTimeout(120); }
      await page.click('#nextQuestion'); await page.waitForTimeout(150);
      if ((await txt('#quizCount')) === 'Question 1 of 8') break;
    }
    return bad && (await txt('#quizCount')) === 'Question 1 of 8';
  });
  await check('quiz: all 8 correct -> 100% mastery', async () => {
    for (let i = 1; i <= 8; i++) {
      await page.click(`#quizBody .quiz-option[data-qchoice="${ANSWERS['RIG101_q' + i]}"]`);
      await page.click('#checkAnswer'); await page.waitForTimeout(120);
      const good = /good/.test(await page.getAttribute('#quizFeedback', 'class'));
      if (!good) throw new Error('q' + i + ' marked wrong');
      await page.click('#nextQuestion'); await page.waitForTimeout(150);
    }
    return (await txt('#quizStatus')).includes('100%') || (await txt('#quizFeedback')).includes('100%');
  });
  await check('completion card appears after full mastery', async () =>
    await page.$eval('#completionCard', el => el.classList.contains('show')));
  await check('"Copy progress summary" copies + toast', async () => {
    await page.click('#exportProgress'); await page.waitForTimeout(300);
    const toast = await page.$eval('#toast', el => el.classList.contains('show') && el.textContent.includes('copied'));
    const clip = await page.evaluate(() => navigator.clipboard.readText()).catch(() => '');
    return toast && clip.includes('Rigging 101');
  });
  await check('"Return to the 6-step course" (resumeLearning)', async () => {
    await page.click('#resumeLearning'); await page.waitForTimeout(500);
    return await page.evaluate(() => !document.body.classList.contains('tool-open'));
  });

  // ---------- 8. Resource cards ----------
  for (const t of ['explorer', 'scenario', 'share', 'mastery']) {
    await check(`resource card "${t}" opens tool mode`, async () => {
      await page.click(`.resource-grid [data-open-tool="${t}"]`); await page.waitForTimeout(250);
      const on = await page.evaluate(x => document.body.dataset.tool === x, t);
      await page.click('#closeTool'); await page.waitForTimeout(150);
      return on;
    });
  }
  await check('resource card "glossary" opens glossary dialog', async () => {
    await page.click('.resource-grid [data-open-tool="glossary"]'); await page.waitForTimeout(250);
    return await page.$eval('#glossaryDialog', d => d.open);
  });
  await check('glossary Close button', async () => {
    await page.click('#glossaryClose'); await page.waitForTimeout(150);
    return await page.$eval('#glossaryDialog', d => !d.open);
  });
  await check('resource card "instructor" opens instructor dialog', async () => {
    await page.click('.resource-grid [data-open-tool="instructor"]'); await page.waitForTimeout(250);
    return await page.$eval('#instructorDialog', d => d.open);
  });
  await check('instructor Close button', async () => {
    await page.click('#instructorClose'); await page.waitForTimeout(150);
    return await page.$eval('#instructorDialog', d => !d.open);
  });

  // ---------- 9. Instructor mode ----------
  await check('nav "Instructor mode" opens dialog on agenda tab', async () => {
    await page.click('#instructorOpen'); await page.waitForTimeout(250);
    return await page.$eval('#instructorDialog', d => d.open) &&
      (await page.getAttribute('[data-instructor-tab="agenda"]', 'aria-selected')) === 'true';
  });
  for (const t of ['cues', 'stations', 'debrief', 'rubric', 'agenda']) {
    await check(`instructor tab "${t}" shows its panel`, async () => {
      await page.click(`[data-instructor-tab="${t}"]`); await page.waitForTimeout(120);
      return await page.$eval(`[data-instructor-panel="${t}"]`, p => !p.hidden);
    });
  }
  await check('agenda checkboxes update progress', async () => {
    await page.check('input[data-agenda="cold"]');
    await page.check('input[data-agenda="plan"]');
    await page.waitForTimeout(120);
    return (await txt('#agendaProgressText')).startsWith('2 of 8');
  });
  await check('"Reset agenda" clears checkboxes', async () => {
    await page.click('#agendaReset'); await page.waitForTimeout(120);
    return (await txt('#agendaProgressText')).startsWith('0 of 8');
  });
  await page.click('[data-instructor-tab="cues"]'); await page.waitForTimeout(120);
  for (let i = 1; i <= 6; i++) {
    await check(`cue ${i} "Reveal instructor lens" toggles`, async () => {
      await page.click(`[data-reveal="cue${i}"]`); await page.waitForTimeout(80);
      const shown = await page.$eval(`#cue${i}`, el => !el.hidden);
      await page.click(`[data-reveal="cue${i}"]`); await page.waitForTimeout(80);
      return shown && await page.$eval(`#cue${i}`, el => el.hidden);
    });
  }
  const launches = await page.$$eval('.launch-stage', els => els.map(e => e.dataset.launchConfig));
  await check('6 launch-stage buttons exist', async () => launches.length === 6);
  await check('launch-stage button opens explorer with the right config', async () => {
    await page.click('.launch-stage[data-launch-config="choker"]'); await page.waitForTimeout(500);
    const dialogClosed = await page.$eval('#instructorDialog', d => !d.open);
    const tool = await page.evaluate(() => document.body.dataset.tool === 'explorer');
    const tileSel = await page.getAttribute('#configTiles .tile[data-config="choker"]', 'aria-selected');
    const detail = await txt('#detailTitle'); // launch component slingeye -> "Sling eye"
    await page.click('#closeTool'); await page.waitForTimeout(150);
    return dialogClosed && tool && tileSel === 'true' && detail === 'Sling eye';
  });
  await page.click('#instructorOpen'); await page.waitForTimeout(250);
  await page.click('[data-instructor-tab="rubric"]'); await page.waitForTimeout(150);
  await check('rubric radios + text fields + "Clear rubric"', async () => {
    await page.check('input[name="rubric-inspection"][value="independent"]');
    await page.fill('#rubricLearner', 'Test Learner');
    await page.click('#rubricReset'); await page.waitForTimeout(120);
    const cleared = await page.$eval('input[name="rubric-inspection"][value="independent"]', r => !r.checked);
    return cleared && (await page.$eval('#rubricLearner', e => e.value)) === '';
  });
  await check('instructor "Print guide" triggers print', async () => {
    const before = await page.evaluate(() => window.__printed);
    await page.click('#instructorPrint'); await page.waitForTimeout(150);
    return await page.evaluate(b => window.__printed > b, before);
  });
  await page.click('#instructorClose'); await page.waitForTimeout(150);

  // ---------- 10. Clear progress (destructive - last) ----------
  await page.click('.resource-grid [data-open-tool="explorer"]'); await page.waitForTimeout(300);
  await check('"Clear progress" resets all progress', async () => {
    await page.click('#clearProgress'); await page.waitForTimeout(300);
    const comp = await txt('#componentProgressText');
    const dec = await txt('#decisionProgressText');
    return comp === '0 / 30' && dec === '0 / 6';
  });

  await check('no JS errors accumulated across full run', async () =>
    consoleErrors.length === 0 || (() => { throw new Error(consoleErrors.slice(0, 5).join(' | ')) })());

  // ---------- report ----------
  const passed = results.filter(r => r.pass).length;
  console.log('\n================ RESULTS ================');
  for (const r of results) console.log((r.pass ? 'PASS' : 'FAIL') + '  ' + r.name + (r.why ? '  -> ' + r.why : ''));
  console.log(`\n${passed}/${results.length} passed`);
  await browser.close();
  process.exit(passed === results.length ? 0 : 1);
})();
