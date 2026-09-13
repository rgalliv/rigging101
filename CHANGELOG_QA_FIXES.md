# Rigging 101 fixes — September 13, 2026

Based on main `d12a876`; implementation branch `codex/rigging101-complete-learning`.

| Audit issue | Result |
| --- | --- |
| Load-share picture contradicted calculated angles | Core-generated geometry uses equal physical scale on both axes; lesson’s 45° overlay corrected at the pick points. |
| Duplicate two-point arithmetic | Course model and analysis panels use `RiggingTrainingCore.solveTwoPoint`. |
| Default dimensions could reach ready-for-review | Default weight/CG are estimated; geometry must be measured, capacities entered and inspection confirmed. Actual model changes invalidate evidence. |
| Draft inputs could leak into capacity results | Capacity and explanations read the applied course model, not raw input fields. Span and rise are editable with explicit validation. |
| Reset and animation retained stale evidence | Geometry changes and animation invalidate verification; reset clears dimensions, capacities, thresholds and evidence. |
| D/d sling floated above bearing and implied unsupported acceptance | Exact drawn diameter ratio, tangential contact and fixed sling thickness; no invented pass bands; lowercase d preserved. |
| Basket slider did not change geometry | Dimensioned live supporting parts, height, angle and force respond to the slider. |
| Governing component was manually selected | Two fictional capacity sets calculate governing utilization; side-loaded shackle introduces a missing-rating hold. |
| Inspection answers always “remove”; visual labels gave away answers | Historical diagrams become unscored study. Six independent records have documented satisfactory, hold and removal dispositions, including a measured section-loss calculation. |
| Tag and scenario screens were pending placeholders | Labeled fictional tag and six complete application packets replace learner placeholders; credit is recorded through required practice. |
| Progress counted viewed evidence as resolved scenes | Inspection and application counts use successfully submitted current-version records. |
| Missing required practice stations | Seven bilingual stations and 22 checks, intermediate numeric steps, different worked-example values, diagnostic feedback, draft preservation and attempt/coaching history. |
| Final math repeated the lesson example | Independent final item uses 9,000 lb and 50°; coaching matches the new geometry. |
| Completion only required decisions and quiz | Six decisions + 22 evidence checks + final mastery. Canonical and legacy events share an explicit versioned payload. |
| Old saved mastery stayed valid after content changes | Schema 3.0 archives prior-version quiz and practice history; new checks must be demonstrated. |
| Broad equipment percentages and inspection intervals | Equipment-specific verification replaces unsupported blanket numeric shortcuts; public source trails and authority boundaries added. |
| Unreproducible tests and large inline runtime | Content/runtime separated, pinned Playwright lockfile, local server, test runner, CI and maintainer documentation. |
| Clipping test falsely failed behind open instructor dialog | Scan the active dialog, exclude intentionally clipped accessibility text, and close dialogs in `finally`. Real clipped visible text still fails. |
| Offline shell omitted new scripts and unseen images | Updated cache includes the course scripts, styles and all 60 existing assets; deduplicated URLs and non-HTML failure responses for missing resources. |

No external publication, merge, host integration, field approval or source-owner approval is represented by this change. Actual verification results are recorded in `FINAL_QA_REPORT.md`.
