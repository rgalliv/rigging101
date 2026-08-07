# Rigging 101 — full button/UI regression test

`button-test.js` drives a real Chromium browser (Playwright) through **every
button on every tab/page** of `index.html` and asserts the expected state
change for each one — 137 checks covering:

- Nav & hero (Start course, Instructor mode, Open reference tools, Back-to-course bar)
- Rigging library — all 10 configuration tiles (visible only in explorer mode, by design)
- 6-step course — stepper, options, Check decision / Try again, Previous / Next,
  full mastery flow for all six decisions
- Explorer reference tool — catalog filters, sling-angle buttons, all 7 technical
  layer toggles, weight input recalculation, kg unit toggle, print, search,
  Unviewed only, Inspection criteria shortcut, component list, 5 detail tabs,
  Previous/Next part, zoom in/out/reset, the 6 review-decision steps
- Scenario lab — all 6 evidence hotspots + list buttons, unlock, all 4 decisions
- Load-share lab — weight Apply, CG slider, 3 hook-height buttons, all 6 presets,
  play/pause animation, 3 answer buttons, Check decision, Reset model
- Final knowledge check — miss/restart cycle, full 8-question 100% mastery,
  completion card, Copy progress summary (clipboard + toast)
- Resource cards — all 6 open the right tool/dialog
- Instructor dialog — 5 tabs, 8 agenda checkboxes + reset, 6 reveal-lens toggles,
  6 launch-stage buttons, rubric fields + Clear rubric, Print guide, Close
- Glossary dialog open/close
- Clear progress (run last), and zero JS console/page errors across the whole run

Answer keys are **not** stored in the repo — the script derives correct choices
at runtime by brute-forcing the FNV-1a hashes already embedded in `index.html`.

## Run it

```bash
# 1. Serve the repo root
npx http-server -p 8321

# 2. In another shell (needs playwright + a chromium build)
node tests/button-test.js
```

Optional environment variables:

| Var | Default | Purpose |
| --- | --- | --- |
| `BASE_URL` | `http://127.0.0.1:8321/index.html` | Page under test |
| `CHROMIUM_PATH` | Playwright's own resolution | Explicit browser executable |

Exit code is `0` only when every check passes. Each check prints `PASS`/`FAIL`
with a reason on failure.

## Visibility scan (`visibility-scan.js`)

The button test proves handlers fire; this scan proves the response is
**visible to the user**. For every button in every context (course, explorer,
scenario lab, load-share lab, mastery, glossary dialog, and each instructor
tab) it scrolls the button into view, screenshots the viewport, clicks, waits
for toasts/scrolls to settle, screenshots again, and flags any button whose
click changed nothing the user could see. Re-clicking an already-selected tab
is reported as a designed no-op, not a failure.

```bash
node tests/visibility-scan.js              # mobile 390x844 (default)
W=1400 H=950 node tests/visibility-scan.js # desktop
```

Exit code `0` = every clicked button produced a visible response; `2` = at
least one button was flagged. This is the scan that caught the technical-layer
buttons (effect rendered ~1,300px off-screen on phones) and the zoom controls
(clickable no-ops at 100% zoom, now disabled instead).

## Spanish-mode suite (`spanish-mode-test.js`)

Guards the bilingual (English / Latin American Spanish) experience — 30 checks:

- Language toggle, `<html lang>`, document title, and persistence across reload
- Interactive flows while the UI is in Spanish: course decision, scenario
  unlock + decision, quiz answer, layer toggles (toast + count label),
  kg toggle, progress-summary export — answer keys derived from the embedded
  FNV hashes, same as `button-test.js`
- **Leak scans**: with the UI in Spanish, every tool view (course, explorer,
  component lesson, scenario, share lab, mastery, glossary) is swept for
  English marker phrases *and* common English function words; back in English,
  the same views are swept for Spanish markers. Any UI string added in only
  one language fails the sweep with a context snippet showing where it leaked.
- **Round-trip integrity**: EN→ES→EN and ES→EN→ES restore each view byte-for-byte,
  and stateful feedback (an answered quiz question, a missed course answer)
  re-renders in the newly selected language instead of keeping the old one.
- The instructor dialog is intentionally English-only and is excluded.

```bash
node tests/spanish-mode-test.js
```

Exit code `0` only when all checks pass. On its first run this suite caught a
missing translation on the rigging-library strip ("Change the assembly") and a
stale tool-mode-bar title that kept its previous language after a toggle —
both fixed.
