# Rigging 101 — final local QA

Date: September 13, 2026. Initial baseline: `d12a87667a50677af113afda47240c8e18710b07`. Integrated current main: `16b03b83a05d9bd2efb5b52e11b2776c58d049bc`. Implementation branch: `codex/rigging101-complete-learning`. Content: `2026.09.13.1`; record schema: `3.0`.

**Local software verification: PASS, 10/10 suites on the combined branch.** The owner explicitly requested merge, commit and deployment on September 13. This report records software QA; it does not certify human technical or bilingual review. Remote deployment status is recorded by the GitHub/Vercel checks for the release commit.

## Delivered

- Seven required stations and 22 bilingual evidence checks, with separate worked-example values, intermediate numeric steps, diagnostic feedback, retained drafts and attempt/coaching history.
- Six inspection records with varied dispositions, fictional tag documents, six complete application packets, and a spreader lesson covering upper/lower forces, beam self-weight, compression, headroom and configuration selection.
- Shared force and geometry core, editable span/rise, scale-correct two-point and 45° lesson diagrams, accurate D/d contact, live basket geometry and computed governing capacity.
- Evidence invalidation on model changes, capacity checks based on applied inputs, complete reset behavior, and no readiness from default unmeasured geometry.
- Completion requires six guided decisions, all current practice checks and final mastery. Canonical and legacy events share a versioned payload. Previous-version quiz/practice evidence is archived without carrying obsolete credit forward.
- Equipment-specific source guidance, independent final math, separated course content/runtime, pinned test tooling, local server, CI and an offline cache containing 88 unique URLs, including the 60 inherited assets and ten Blender spreader images.
- Integrated main's mobile clipping fix, compact tool tabs, expanded capacity rubric and 3D/force-view switching. Consolidated the overlapping practice implementations into one required workbench. Previous `skillStationsV1` records are archived without granting revised-task credit.

The complete audit-to-fix map is in [CHANGELOG_QA_FIXES.md](CHANGELOG_QA_FIXES.md). Sources and authority limits are recorded in [SOURCE-REGISTER-2026-09-13.md](docs/SOURCE-REGISTER-2026-09-13.md).

## Verification evidence

| Suite | Latest result |
| --- | --- |
| Rigging core | 17/17 passed |
| Required-skills unit checks | 10/10 passed, including 81 scale/angle combinations |
| Required-practice browser flow | 12/12 passed; all 22 independent records submitted through actual controls |
| Blender spreader views | Passed; ten geometries, images, EN/ES, mobile, offline and unavailable-image fallback/retry |
| Existing button and workflow regression | 139/139 passed |
| Spanish mode | 31/31 passed |
| Responsive layout | 18/18 passed |
| Competency UX | 8/8 passed |
| Remediation, storage and instructor checks | 21/21 passed |
| Stage 2 hitch transfer integration | Passed |

There are 251 individually counted checks across the eight counted suites, plus the Stage 2 integration suite. Assertions include completion withholding, successful completion events, edited-answer invalidation, saved-history migration, offline reload of new scripts and an unopened inspection image, clear/delete behavior, and no accumulated JavaScript errors in the checked flows.

The broad run is recorded in `audit-output/release-regression.log`. Its single remaining legacy threshold assertion was corrected to supply verified weight, CG and measured geometry before expecting a capacity-review state. Final affected suites passed in `audit-output/final-focused-checks.log`: required practice, layout, remediation and visual capture, 4/4 suites. Final caption/contrast screenshots and the evidence-caption assertion passed in `audit-output/final-capture.log`. Earlier exploratory logs document failures that were fixed and are not the final result.

`npm install --package-lock-only --ignore-scripts` resolved the pinned Playwright lockfile and reported zero known vulnerabilities in the resolved test dependency set. No dependency lifecycle scripts were run. `git diff --check` passed. This is not a general malware or supply-chain certification.

## Visual review

Reviewed actual Chromium captures at desktop width 1365 and phone width 390, plus required-practice layouts at width 768, in English and Spanish. Reviewed course completion, required-practice navigation, spreader instruction, load-share inputs/geometry, D/d, tag documents and inspection study. The desktop analysis tabs no longer shrink behind their panel; the final diagram caption describes entered CG rather than claiming verification. Force-card values remain available in text alongside diagrams.

Evidence folders:

- `audit-output/required-practice/`: browser results JSON, phone/tablet EN/ES spreader views and desktop completion.
- `audit-output/review/`: desktop and phone load-share, geometry, bend, tags, inspection and required-practice captures.

Checks exercised Chromium device emulation, not physical iOS/Android hardware or every screen reader. External source PDFs are linked references; their availability is not part of the offline package.

## Human review and integration boundaries

These are review boundaries, not unfinished software fixes:

1. Technical SME and bilingual SME approval of the new classroom records and Spanish wording has not been established by automated checks. The owner's deployment instruction is separate from those reviews.
2. The inherited IPT illustration edition and reproduction rights still require source-owner confirmation. The diagrams remain unscored study material. Blender assets were recovered from the current public main branch during integration, not recreated or newly photographed.
3. The device-local record and facilitator passcode gate are unauthenticated. Host identity, LMS receipt, trusted record storage and embedding require a separate integration with specified hosts. Existing standalone frame restrictions remain.
4. Classroom completion does not establish field qualification, authorize a lift, certify equipment, or validate spreader structural capacity. Actual manufacturer instructions and the authorized plan govern equipment-specific decisions.

Merged-branch evidence: `audit-output/merged-release-tests.log` (10/10 suites), plus the Blender and required-practice screenshots. Production payload verification is a separate release step.
