# Course verification

From the repository root:

```sh
npm ci --ignore-scripts
npx playwright install chromium
npm test
```

The runner serves the repository on an available local port, runs each suite in a separate process and returns a nonzero exit code if any suite fails. Reports and screenshots live in ignored `audit-output/`. Set `CHROMIUM_PATH` for an existing browser. Run one suite with `node tests/run.cjs required-practice-test.cjs`.

| Suite | Coverage |
| --- | --- |
| `rigging-core-test.js` | Static shares, tensions, thresholds, evidence and capacity holds |
| `required-skills-unit.cjs` | Scale geometry across 81 combinations, CG, spreader equilibrium, input rejection, grading and versioned progress |
| `required-practice-test.cjs` | All 22 submissions, coaching, EN/ES drafts, completion events, invalidation, models, responsive layouts, offline assets, migration and reset |
| `blender-visuals-test.js` | Ten rendered spreader geometries, image decoding, both views, Spanish, mobile, offline and unavailable-image fallback |
| `button-test.js` | 139 existing course, reference, scenario, calculator, quiz and instructor checks, updated for required practice and document views |
| `spanish-mode-test.js` | Language switching, leak scans, inputs and feedback |
| `layout-pass-test.js` | Learner and load-share responsive checks |
| `competency-ux-test.js` | Navigation, confidence evidence and classroom/field distinction |
| `remediation-test.js` | Accessibility, instructor layout, retry gates, retention, exports and deletion |
| `stage2-test.js` | Hitch teaching, diagrams, coached retry, transfer question and history |

Browser tests read the maintained content and runtime files. Final-question hashes and practice targets are visible in this client-side app; neither hashing nor tests provide assessment security. Independent unit assertions verify equilibrium and known numeric cases. Browser tests verify actual controls, feedback and record transitions.

The clipping check scans the active dialog and excludes deliberately clipped one-pixel accessibility text. It still rejects visible leaf text wider than its container. Dialog cleanup runs in `finally` so a failed assertion cannot conceal every later target.

Existing visual-capture and visibility-scan scripts remain optional diagnostics. Browser checks do not provide human technical approval, bilingual SME approval, certification, field-performance observation or production/LMS verification.
