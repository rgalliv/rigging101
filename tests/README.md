# Rigging 101 — full button/UI regression test

`button-test.js` drives a real Chromium browser (Playwright) through **every
button on every tab/page** of `index.html` and asserts the expected state
change for each one — 143 checks covering:

- Nav & hero (Start course, Instructor mode, Open reference tools, Back-to-course bar)
- Rigging library — all 10 configuration tiles (visible only in explorer mode, by design)
- 6-step course — sequential stepper, teach-then-decide reveal, options, Check
  decision / Clear answer, Previous / Next, full mastery flow for all six decisions
- Upper tool tabs — direct Visual Labs, Components, Scenario, Load Share, and Assessment navigation
- Field recognition lab — five focused topic tabs for inspection, hitch recognition,
  bend protection, load-path tracing, and tag reading, plus the Load Share handoff
- Explorer reference tool — catalog filters, a guard confirming the retired
  technical-layer controls and photograph overlays stay absent, print, search,
  Unviewed only, Inspection criteria shortcut, component list, 5 detail tabs,
  Previous/Next part, zoom in/out/reset, the 6 review-decision steps
- Scenario lab — all 6 evidence hotspots + list buttons, unlock, all 4 decisions
- Load-share lab — elevation/plan views; Model, Capacity, Evidence, and Explain tabs;
  entered-WLL overload checks; calculation freshness; assumptions ledger; copied analysis;
  weight Apply, kg unit toggle, CG slider, 5 hook-height buttons, all 7 presets,
  play/pause animation, 3 answer buttons, Check decision, Reset model
- Final knowledge check — miss/restart cycle, full 8-question 100% mastery,
  completion card, Copy progress summary (clipboard + toast)
- Resource cards — all 6 learner tools open the right tool/dialog
- Controlled Instructor route — footer instructor-workspace entry, passcode gate, 5 tabs,
  8 agenda checkboxes + reset, 6 reveal-lens toggles, 6 launch-stage buttons,
  rubric fields + Clear rubric, Print guide, Close
- Glossary dialog open/close
- Verified CCOS/CraneQualified contact footer, exact controlling-employer language,
  and the versioned, retention-controlled local learner record
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
least one button was flagged. This scan also verifies that zoom controls at
100% are disabled instead of remaining clickable no-ops.

## Spanish-mode suite (`spanish-mode-test.js`)

Guards the bilingual (English / Latin American Spanish) experience — 31 checks:

- Language toggle, `<html lang>`, document title, and device-record persistence across reload
- Interactive flows while the UI is in Spanish: course decision, scenario
  unlock + decision, quiz answer, the absence of retired technical layers,
  kg toggle, visual-lab controls, progress-summary export — answer keys derived from the embedded
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

## Remediation and visual suites

`remediation-test.js` checks the August 2026 fix list: one-H1 structure,
four-card readiness, complete image alternatives in both languages, Spanish
mobile overflow, required-learning retry gates, the near-30-degree case,
configurable WLL thresholds, inline glossary help, label contrast, and browser
errors. `visual-capture.js` captures the course, assessment, and load-share lab
at 1366×768, 1024×768, 768×1024, and 375×667 for a human visual pass.

```bash
node tests/remediation-test.js
node tests/visual-capture.js
```

## Competency UX suite (`competency-ux-test.js`)

Guards the v2 learner model at a 390×844 phone viewport: the three-area learner
navigation, sticky-header clearance, photograph-first progressive disclosure,
confidence persistence, high-confidence error remediation, the readiness map,
and the boundary between application knowledge and observed field performance.

```bash
node tests/competency-ux-test.js
```

## Stage 2 hitch suite (`stage2-test.js`)

Guards the Stage 2 correction: approved technical diagrams, stable responsive image treatment, no answer disclosure after a miss, the hitch-comparison remediation, confidence preservation, rating/contact/control teaching, a distinct final transfer scenario, and complete attempt-history scoring.

```bash
node tests/stage2-test.js
```

`stage2-visual-capture.js` also writes desktop/mobile English and Spanish review images plus the remediation dialog to `audit-output/stage2-correction/` for the manual visual pass.
