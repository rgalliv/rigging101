/* Visibility scan: for every button in every app context, screenshot the visible
   viewport before/after clicking. If the pixels the user is looking at don't change,
   the button is flagged as "invisible response". Run at mobile and desktop sizes. */
const { chromium } = require('playwright');
const BASE = process.env.BASE_URL || 'http://127.0.0.1:8321/index.html';

const CONTEXTS = [
  { name: 'course (default)', setup: async p => { await p.evaluate(() => { window.__closeDialogs(); if (document.body.classList.contains('tool-open')) document.getElementById('closeTool').click(); const s1 = document.querySelector('#journeyStepper [data-journey-index="0"]'); if (s1 && !s1.classList.contains('current')) s1.click(); }); }, scope: ['.nav', '.learner-journey', '.intro', '.hero', '.resource-hub'] },
  { name: 'explorer', setup: async p => { await p.evaluate(() => { window.__openTool('explorer'); window.__normalizeExplorer(); }); }, scope: ['.library', '#explorer', '.tool-mode-bar'] },
  { name: 'scenario', setup: async p => { await p.evaluate(() => window.__openTool('scenario')); }, scope: ['#scenarioLab', '.tool-mode-bar'] },
  { name: 'share', setup: async p => { await p.evaluate(() => window.__openTool('share')); }, scope: ['#shareLab', '.tool-mode-bar'] },
  { name: 'mastery', setup: async p => { await p.evaluate(() => window.__openTool('mastery')); }, scope: ['#mastery', '.tool-mode-bar'] },
  { name: 'glossary dialog', setup: async p => { await p.evaluate(() => { window.__closeDialogs(); document.getElementById('glossaryDialog').showModal(); }); }, scope: ['#glossaryDialog'] },
  ...['agenda', 'cues', 'stations', 'debrief', 'rubric'].map(tab => ({
    name: `instructor:${tab}`,
    setup: async p => {
      await p.evaluate(t => {
        const d = document.getElementById('instructorDialog');
        if (!d.open) { window.__closeDialogs(); d.showModal(); }
        document.querySelector(`[data-instructor-tab="${t}"]`).click();
      }, tab);
    },
    scope: ['#instructorDialog'],
  })),
];

(async () => {
  const width = Number(process.env.W || 390), height = Number(process.env.H || 844);
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const ctx = await browser.newContext({ viewport: { width, height }, isMobile: width < 700, hasTouch: width < 700 });
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: new URL(BASE).origin });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    window.print = () => { window.__printed = (window.__printed || 0) + 1; window.dispatchEvent(new Event('afterprint')); };
    window.__closeDialogs = () => {
      const i = document.getElementById('instructorDialog'), g = document.getElementById('glossaryDialog'), gate = document.getElementById('instructorGate');
      i?.open && i.close(); g?.open && g.close(); gate?.open && gate.close();
    };
    window.__openTool = name => {
      window.__closeDialogs();
      const control = document.querySelector(`[data-tool-tab="${name}"]`) || document.querySelector(`[data-open-tool="${name}"]`);
      if (control) control.click();
    };
    window.__normalizeExplorer = () => {
      const tile = document.querySelector('#configTiles .tile[data-config="bridle2"]');
      if (tile && tile.getAttribute('aria-selected') !== 'true') tile.click();
      const all = document.querySelector('#focusControls [data-focus="all"]');
      if (all && !all.classList.contains('active')) all.click();
      const uv = document.getElementById('unviewedOnly');
      if (uv && uv.getAttribute('aria-pressed') === 'true') uv.click();
      const s = document.getElementById('search');
      if (s && s.value) { s.value = ''; s.dispatchEvent(new Event('input', { bubbles: true })); }
    };
  });
  page.on('pageerror', e => console.log('PAGEERROR: ' + e.message));
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.evaluate(() => {
    window.__closeDialogs = () => {
      const i = document.getElementById('instructorDialog'), g = document.getElementById('glossaryDialog'), gate = document.getElementById('instructorGate');
      i.open && i.close(); g.open && g.close(); gate.open && gate.close();
    };
    window.__openTool = name => {
      window.__closeDialogs();
      const card = document.querySelector(`[data-open-tool="${name}"]`);
      if (card) card.click();
    };
    // deterministic explorer state so snapshot indexes stay valid across clicks:
    // bridle2 config (angle controls visible), "Unviewed only" off, search empty
    window.__normalizeExplorer = () => {
      const tile = document.querySelector('#configTiles .tile[data-config="bridle2"]');
      if (tile && tile.getAttribute('aria-selected') !== 'true') tile.click();
      const all = document.querySelector('#focusControls [data-focus="all"]');
      if (all && !all.classList.contains('active')) all.click();
      const uv = document.getElementById('unviewedOnly');
      if (uv && uv.getAttribute('aria-pressed') === 'true') uv.click();
      const s = document.getElementById('search');
      if (s && s.value) { s.value = ''; s.dispatchEvent(new Event('input', { bubbles: true })); }
    };
  });

  const settle = async () => {
    await page.evaluate(() => document.getElementById('toast').classList.remove('show'));
    await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    await page.waitForTimeout(120);
  };

  const flagged = [], passed = [], noop = [], skipped = [];
  for (const c of CONTEXTS) {
    await c.setup(page);
    await page.waitForTimeout(500);
    // snapshot: for each scope part, index of each visible enabled button within that part
    const buttons = await page.evaluate(parts => {
      const out = [];
      for (const part of parts) {
        const root = document.querySelector(part);
        if (!root) continue;
        [...root.querySelectorAll('button')].forEach((b, idx) => {
          if (b.disabled) return;
          const st = getComputedStyle(b);
          if (st.display === 'none' || st.visibility === 'hidden' || (!b.offsetParent && st.position !== 'fixed')) return;
          out.push({ part, idx, label: (b.textContent || b.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 45) });
        });
      }
      return out;
    }, c.scope);

    for (const b of buttons) {
      await c.setup(page);
      await page.waitForTimeout(250);
      const handle = await page.evaluateHandle(({ part, idx }) => {
        const root = document.querySelector(part);
        return root ? [...root.querySelectorAll('button')][idx] || null : null;
      }, b);
      const el = handle.asElement();
      if (!el) { skipped.push(`${c.name} :: "${b.label}" (not found)`); continue; }
      const state = await el.evaluate(x => ({
        id: x.id,
        disabled: x.disabled,
        hidden: !x.offsetParent && getComputedStyle(x).position !== 'fixed',
        activeTab: x.getAttribute('role') === 'tab' && x.getAttribute('aria-selected') === 'true',
        label: (x.textContent || x.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 45),
      }));
      if (state.disabled || state.hidden) { skipped.push(`${c.name} :: "${b.label}" (${state.disabled ? 'disabled' : 'hidden'})`); continue; }
      if (state.label !== b.label) { skipped.push(`${c.name} :: "${b.label}" (relabeled to "${state.label}")`); continue; }
      if (state.id === 'applyShareWeight') { noop.push(`${c.name} :: "${b.label}" (unchanged input — designed no-op)`); continue; }
      if (state.activeTab) { noop.push(`${c.name} :: "${b.label}" (already-selected tab — designed no-op)`); continue; }
      await el.evaluate(x => x.scrollIntoView({ block: 'center', behavior: 'instant' }));
      await settle();
      const before = (await page.screenshot()).toString('base64');
      try { await el.click({ timeout: 3000 }); } catch (e) { skipped.push(`${c.name} :: "${b.label}" (unclickable: ${String(e.message).split('\n')[0].slice(0, 60)})`); continue; }
      await page.waitForTimeout(800);
      const after = (await page.screenshot()).toString('base64');
      const entry = `${c.name} :: "${b.label}"`;
      (before !== after ? passed : flagged).push(entry);
    }
  }

  console.log(`\n=== VISIBILITY SCAN @ ${width}x${height} ===`);
  console.log(`visible response: ${passed.length}   designed no-ops: ${noop.length}   flagged (no visible change): ${flagged.length}   skipped: ${skipped.length}`);
  if (flagged.length) { console.log('\n--- FLAGGED ---'); flagged.forEach(f => console.log('  ✗ ' + f)); }
  if (noop.length) { console.log('\n--- NO-OPS (by design) ---'); noop.forEach(s => console.log('  = ' + s)); }
  if (skipped.length) { console.log('\n--- SKIPPED ---'); skipped.forEach(s => console.log('  · ' + s)); }
  process.exit(flagged.length ? 2 : 0);
})();
