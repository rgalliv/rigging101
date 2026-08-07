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
