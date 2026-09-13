# Rigging 101

Bilingual introductory rigging course with six guided decisions, seven required practice stations (22 evidence checks), eight final questions, reference tools and an instructor workspace. Browser completion records classroom knowledge only; employer verification of field performance remains separate.

## Run and verify

Requires Node.js 22 or later. Serve over HTTP; a `file:` URL does not support the service worker.

```sh
npm ci --ignore-scripts
npx playwright install chromium
npm start
```

Open `http://127.0.0.1:8321/`. Set `PORT` to use another local port. `npm test` starts its own server on an available port and runs the unit and Chromium regression suites. `npm run test:unit` runs calculations and grading without a browser. Set `CHROMIUM_PATH` to use an existing Chromium executable. On Linux CI, install browser system dependencies with `npx playwright install --with-deps chromium`.

```sh
npm test
node tests/run.cjs required-practice-test.cjs
```

Reports and screenshots are written to ignored `audit-output/`. The test lockfile pins Playwright; the production app has no package dependencies or build step. GitHub Actions verifies pull requests and pushes and uploads QA evidence.

## Files and responsibilities

| File | Responsibility |
| --- | --- |
| `index.html` | Course shell, instructor forms and existing base styles |
| `course-data.js` | Consolidated bilingual lessons, decisions, final questions and coaching |
| `course-runtime.js` | Guided journey, navigation, storage, quiz and course completion |
| `rigging-core.js` | Shared two-point statics, scale geometry, CG, spreader forces and capacity evidence |
| `rigging-tools.js` | Applied-model capacity/evidence panels, warnings and analysis summaries |
| `skill-data.js` | Bilingual classroom packets, independent targets and grading rules |
| `skill-workbench.js` | Drafts, worked examples, intermediate-step feedback and recorded attempts |
| `visual-labs.js` | Unscored reference studies, D/d, basket, load-path and document views |
| `sw.js` | Versioned offline course shell and asset cache |

The seven practice stations cover weight/units/combined CG, asymmetric support shares, angles/utilization, identification/selection, six inspection records, spreader forces/configuration, and six application packets. Worked examples use different values from independent checks. Numeric tolerances are explicit in the data; edits invalidate the corresponding submitted evidence until checked again. Failed and coached attempts remain in history.

## Records and completion

Content version: `2026.09.13.1`. Record schema: `3.0`. Storage key: `cq.rig101.recordEnvelope`.

Completion requires all six guided decisions, all 22 current-version practice checks and 100% final-question mastery. Reading a document or viewing a photograph earns no decision credit. The course emits `cq-module-complete` and the backward-compatible `cq-lab-complete` on `window`, once per transition into completion within the page session. Each event carries:

```json
{
  "moduleId": "RIG101",
  "contentVersion": "2026.09.13.1",
  "next": "S4_M01",
  "knowledgeDemonstrated": true,
  "fieldPerformance": "not_observed",
  "guidedDecisions": 6,
  "skillChecks": 22,
  "finalKnowledgeCheckMastered": true
}
```

These browser events do not authenticate a learner, verify a host LMS, or authorize field work. Editing a demonstrated answer removes completion until the revised work is submitted successfully. Old content-version quiz and practice credit is archived, not carried into current mastery. Previous evidence remains in JSON export. Unchanged guided decisions remain available. Optional identity, configurable retention, device deletion and existing instructor observation forms are retained.

Records and the instructor passcode gate are client-side and unauthenticated. The gate is a presentation convenience, not access control. Do not place confidential material behind it. A trusted host would need its own identity, persistence and validation integration. The existing standalone `frame-ancestors 'none'` / frame-denial configuration remains in place; embedding requires a separate allowlisted host configuration and real host testing.

## Technical and release boundaries

The two-point model assumes a rigid load, level pick points, static equilibrium and the hook above CG. Both drawing axes use one physical scale. Spreader arithmetic additionally assumes a level symmetric beam, centered beam weight, vertical lower legs and negligible sling weight in the stated exercise. Beam compression is a force calculation, not a bending, buckling, fabrication or structural-rating check.

All newly supplied tags, capacities, inspection measurements, job-plan limits and configuration tables are visibly fictional classroom data. Existing imagery and the ten Blender spreader views from the current main branch are retained. D/d supplies geometric contact only, without an invented acceptance threshold. Use applicable regulations, the exact equipment manufacturer instructions and the authorized lift plan for real work. See [source boundaries](docs/SOURCE-REGISTER-2026-09-13.md).

Local automated verification does not constitute technical SME approval, Spanish SME approval, publication clearance for inherited imagery, or a production deployment. See [QA report](FINAL_QA_REPORT.md) for the actual checked scope and release status.
