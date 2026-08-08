/* Spanish-mode (Español) regression test for Rigging 101 (index.html).

   Guards the bilingual experience two ways:
   1. Functional checks — the language toggle, persistence, and the main
      interactive flows (course decision, scenario, quiz, layers, kg toggle)
      all work while the UI is in Latin American Spanish.
   2. Leak scans — with the UI in Spanish, every tool view is swept for
      English marker phrases and common English function words; with the UI
      back in English, the same views are swept for Spanish markers. A new
      UI string added in only one language fails the scan, so English-only
      strings can't ship unnoticed.

   The instructor dialog is intentionally English-only and is never opened
   during the scans.

   Usage:
     1. Serve the repo root:  npx http-server -p 8321
     2. Run:                  node tests/spanish-mode-test.js
   Requires Playwright with a Chromium build available.
   Optional env: BASE_URL (default http://127.0.0.1:8321/index.html),
                 CHROMIUM_PATH (explicit browser executable). */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const BASE = process.env.BASE_URL || 'http://127.0.0.1:8321/index.html';

// Derive the answer key at runtime from the FNV-1a hashes embedded in index.html.
const src = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const SALT = (src.match(/const SALT="([^"]+)"/) || [])[1];
const fnv = s => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16).padStart(8, '0'); };
const ANSWERS = {};
for (const line of src.split('\n')) {
  const m = line.match(/id:"(RIG101_[dsq]\d)".*?hash:"([a-f0-9]{8})"/);
  if (m) for (let i = 0; i < 10; i++) if (fnv(`${SALT}:${m[1]}:${i}`) === m[2]) { ANSWERS[m[1]] = i; break; }
}

/* English phrases that must never render while the UI is in Spanish.
   Chosen to be unambiguous UI strings — none occur in the Spanish corpus
   (standard names like ASME/B30.9/Kito Crosby/WLL/LAF stay untranslated by
   design and are not in this list). */
const EN_MARKERS = [
  'check decision', 'next step', 'next decision', 'try again', 'load path',
  'technical layers', 'supported load', 'show kg', 'showing kg', 'start course',
  'start the 6-step', 'review the six', 'evidence board', 'left leg', 'right leg',
  'practice scenarios', 'lens on', 'lens off', 'knowledge check', 'print reference',
  'clear progress', 'unviewed only', 'decisions mastered', 'field decision',
  'components explored', 'hook connection', 'sling system', 'load interface',
  'what carries the load', 'training reference only', 'evidence points found',
  // generic English function words (padded) — catch brand-new English strings
  ' the ', ' and ', ' with ', ' from ', ' your ', ' every ', ' each ',
];
/* Spanish phrases that must never render while the UI is in English. */
const ES_MARKERS = [
  'eslinga', 'izaje', 'ramal', 'aparejo', 'capas técnicas', 'decisión de campo',
  'verificar decisión', 'carga soportada', 'mostrar kg', 'evaluación final',
  'tablero de evidencia', 'referencia de capacitación',
  ' según ', ' cada uno', 'ángulo de la eslinga',
];

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
  const page = await ctx.newPage();
  const consoleErrors = [];
  page.on('pageerror', e => consoleErrors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push('console: ' + m.text()); });

  await page.goto(BASE, { waitUntil: 'load' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(400);

  const txt = async s => (await page.textContent(s) || '').trim();
  const visibleText = () => page.evaluate(() => document.body.innerText);
  const openTool = async name => { await page.click(`.resource-card[data-open-tool="${name}"]`); await page.waitForTimeout(400); };
  const closeTool = async () => { await page.click('#closeTool'); await page.waitForTimeout(250); };
  const scan = async (label, markers) => {
    const text = (await visibleText()).toLowerCase();
    const hits = markers.filter(m => text.includes(m.toLowerCase()));
    if (hits.length) {
      const ctx = hits.map(m => { const i = text.indexOf(m.toLowerCase()); return JSON.stringify(m) + ' in "…' + text.slice(Math.max(0, i - 30), i + m.length + 30).replace(/\n/g, ' ') + '…"'; });
      throw new Error(`${label}: leaked ${ctx.join(' | ')}`);
    }
    return true;
  };

  // ---------- 1. Toggle into Spanish ----------
  await check('language toggle present and reads "Español"', async () => (await txt('#langToggle')) === 'Español');
  await check('toggle switches to Spanish (lang, title, toggle label)', async () => {
    await page.click('#langToggle');
    await page.waitForTimeout(500);
    const lang = await page.evaluate(() => document.documentElement.lang);
    const title = await page.title();
    const navigationLabels = await page.evaluate(() => [
      document.querySelector('.nav').getAttribute('aria-label'),
      document.querySelector('.learner-nav').getAttribute('aria-label'),
      document.querySelector('#journeyStepper').getAttribute('aria-label'),
      document.querySelector('.brand').getAttribute('aria-label')
    ]);
    return lang === 'es' && title.includes('Laboratorio') && (await txt('#langToggle')) === 'English' &&
      navigationLabels.join('|') === 'Navegación principal|Áreas del participante|Seis pasos del curso|Visitar Crane Qualified';
  });
  await check('hero and course render in Spanish', async () =>
    (await txt('.hero-inner h1')).toUpperCase().includes('RUTA DE LA CARGA') &&
    (await txt('#journeyHeading')).includes('Seis decisiones'));

  // ---------- 2. English-leak scans across every tool view ----------
  await check('ES leak scan · course view', () => scan('course', EN_MARKERS));
  await openTool('explorer');
  await check('ES leak scan · explorer', () => scan('explorer', EN_MARKERS));
  await check('ES leak scan · explorer with component lesson open', async () => {
    await page.click('#componentList .part');
    await page.waitForTimeout(250);
    await page.click('.detail-tabs button[data-tab="inspection"]');
    await page.waitForTimeout(250);
    return scan('explorer/lesson', EN_MARKERS);
  });
  await closeTool();
  await openTool('scenario');
  await check('ES leak scan · scenario', () => scan('scenario', EN_MARKERS));
  await closeTool();
  await openTool('share');
  await check('ES leak scan · share lab', () => scan('share', EN_MARKERS));
  await closeTool();
  await openTool('mastery');
  await check('ES leak scan · mastery/quiz', () => scan('mastery', EN_MARKERS));
  await closeTool();
  await check('ES leak scan · glossary dialog', async () => {
    await page.click('.resource-card[data-open-tool="glossary"]');
    await page.waitForTimeout(300);
    const text = (await page.textContent('#glossaryDialog')).toLowerCase();
    const hits = EN_MARKERS.filter(m => text.includes(m.toLowerCase()));
    await page.click('#glossaryClose');
    if (hits.length) throw new Error('glossary leaked ' + hits.join(', '));
    return (await page.evaluate(() => !document.querySelector('#glossaryDialog').open));
  });

  // ---------- 3. Interactive flows in Spanish ----------
  await check('course decision answers + masters in Spanish', async () => {
    await page.click(`#journeyOptions button[data-journey-choice="${ANSWERS.RIG101_d1}"]`);
    await page.click('#journeyCheck');
    await page.waitForTimeout(400);
    const step = await txt('#journeyStepper button');
    const toast = await txt('#toast');
    return step.toUpperCase().includes('DOMINADO') && toast.includes('dominada');
  });
  await check('explorer stays focused on catalog and inspection in Spanish', async () => {
    await openTool('explorer');
    const band = await page.innerHTML('#layerScene');
    const tabs = (await txt('#toolTabs')).toUpperCase();
    const removed = await page.evaluate(() => !document.querySelector('#angleControls, #lafTable, #readout, #layerControls [data-layer="tension"], #layerControls [data-layer="geometry"]'));
    return removed && band.includes('LENTE TÉCNICO') && tabs.includes('COMPONENTES') && tabs.includes('ESCENARIO') && tabs.includes('REPARTO DE CARGA') && tabs.includes('EVALUACIÓN');
  });
  await check('layer toggle: Spanish toast + Spanish count label', async () => {
    await page.click('#layerControls button[data-layer="inspection"]');
    await page.waitForTimeout(300);
    const toastOn = await txt('#toast');
    const label = await txt('#layerLabel');
    await page.click('#layerControls button[data-layer="inspection"]');
    await page.waitForTimeout(300);
    const toastOff = await txt('#toast');
    return toastOn.includes('activado') && label.toUpperCase().includes('CAPAS TÉCNICAS') && toastOff.includes('desactivado');
  });
  await check('kg toggle labeled and working in Spanish', async () => {
    await openTool('share');
    const before = await txt('#unitToggle');
    await page.click('#unitToggle');
    await page.waitForTimeout(300);
    const demand = await txt('#shareMetrics');
    await page.click('#unitToggle');
    await page.waitForTimeout(300);
    return before === 'Mostrar kg' && demand.includes('kg');
  });
  await check('scenario unlocks and answers in Spanish', async () => {
    await closeTool();
    await openTool('scenario');
    for (const id of ['load', 'points', 'tag', 'hardware', 'protection', 'path']) {
      await page.click(`.evidence-hotspot[data-evidence="${id}"]`);
      await page.waitForTimeout(120);
    }
    await page.waitForTimeout(250);
    await page.click(`[data-scenario-choice="${ANSWERS.RIG101_s1}"]`);
    await page.click('#checkScenarioCall');
    await page.waitForTimeout(300);
    return (await txt('#scenarioFeedback')).startsWith('Correcto');
  });
  await check('quiz question answers correctly in Spanish', async () => {
    await closeTool();
    await openTool('mastery');
    await page.click(`.quiz-option[data-qchoice="${ANSWERS.RIG101_q1}"]`);
    await page.click('#checkAnswer');
    await page.waitForTimeout(300);
    return (await txt('#quizFeedback')).startsWith('Correcto');
  });
  await check('progress summary copies in Spanish', async () => {
    await page.click('#exportProgress');
    await page.waitForTimeout(300);
    return (await txt('#toast')).includes('Resumen de progreso copiado');
  });

  // ---------- 4. Persistence + clean return to English ----------
  await check('Spanish persists across reload', async () => {
    await page.reload({ waitUntil: 'load' });
    await page.waitForTimeout(500);
    return (await page.evaluate(() => document.documentElement.lang)) === 'es' &&
      (await txt('.hero-inner h1')).toUpperCase().includes('RUTA DE LA CARGA');
  });
  await check('toggle restores English exactly', async () => {
    await page.click('#langToggle');
    await page.waitForTimeout(500);
    return (await page.evaluate(() => document.documentElement.lang)) === 'en' &&
      (await txt('.hero-inner h1')).toUpperCase().includes('LOAD PATH') &&
      (await txt('#langToggle')) === 'Español';
  });

  // ---------- 5. Spanish-leak scans in English mode ----------
  await check('EN leak scan · course view', () => scan('course/en', ES_MARKERS));
  await openTool('explorer');
  await check('EN leak scan · explorer', () => scan('explorer/en', ES_MARKERS));
  await closeTool();
  await openTool('scenario');
  await check('EN leak scan · scenario', () => scan('scenario/en', ES_MARKERS));
  await closeTool();
  await openTool('share');
  await check('EN leak scan · share lab', () => scan('share/en', ES_MARKERS));
  await closeTool();
  await openTool('mastery');
  await check('EN leak scan · mastery/quiz', () => scan('mastery/en', ES_MARKERS));
  await closeTool();

  // ---------- 6. Round-trip integrity (EN→ES→EN and ES→EN→ES) ----------
  const snap = () => page.evaluate(() => { const t = document.querySelector('#toast'); if (t) t.textContent = ''; return document.body.innerText; });
  const flip = async () => { await page.click('#langToggle'); await page.waitForTimeout(450); };
  await check('round trip EN→ES→EN restores the course view byte-for-byte', async () => {
    const en1 = await snap();
    await flip();
    const es1 = await snap();
    await flip();
    const en2 = await snap();
    if (en1 !== en2) throw new Error('EN text changed after ES round trip');
    return es1 !== en1;
  });
  await check('round trip ES→EN→ES restores Spanish byte-for-byte', async () => {
    await flip();
    const es1 = await snap();
    await flip(); await flip();
    const es2 = await snap();
    await flip(); // leave in English
    if (es1 !== es2) throw new Error('ES text changed after EN round trip');
    return true;
  });
  await check('explorer round trip EN→ES→EN byte-for-byte', async () => {
    await openTool('explorer');
    const en1 = await snap();
    await flip(); await flip();
    const en2 = await snap();
    await closeTool();
    if (en1 !== en2) throw new Error('explorer EN text changed after round trip');
    return true;
  });
  await check('answered-quiz feedback follows the language both ways', async () => {
    await openTool('mastery');
    await page.click(`.quiz-option[data-qchoice="${ANSWERS.RIG101_q1}"]`);
    await page.click('#checkAnswer');
    await page.waitForTimeout(250);
    const en = await txt('#quizFeedback');
    await flip();
    const es = await txt('#quizFeedback');
    await flip();
    const enBack = await txt('#quizFeedback');
    await closeTool();
    return en.startsWith('Correct.') && es.startsWith('Correcto.') && enBack.startsWith('Correct.');
  });
  await check('missed-course-answer feedback follows the language both ways', async () => {
    const step = await page.evaluate(() => Number(document.querySelector('#journeyStepper .current').dataset.journeyIndex));
    const id = 'RIG101_d' + (step + 1);
    const wrong = (ANSWERS[id] + 1) % 4;
    await page.click(`#journeyOptions button[data-journey-choice="${wrong}"]`);
    await page.click('#journeyCheck');
    await page.waitForTimeout(250);
    const en = await txt('#journeyFeedback');
    await flip();
    const es = await txt('#journeyFeedback');
    await flip();
    const enBack = await txt('#journeyFeedback');
    await page.click('#journeyCheck'); // "Try again" resets the miss state
    return en.includes('does not control') && es.includes('no controla') && enBack.includes('does not control');
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
