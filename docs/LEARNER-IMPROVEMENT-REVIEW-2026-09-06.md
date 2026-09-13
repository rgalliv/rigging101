# Rigging 101 learner improvement review

Reviewed September 6, 2026. Primary repository: `rgalliv/rigging101`, local commit `a49df89`. The original review below describes the pre-change course. The authorized implementation is now in the working tree; it has not been deployed.

The course has a useful foundation: six decisions in field order, component references, bilingual lessons, an asymmetric two-point calculation model, explanations of load share versus sling tension, and a separate practical-performance record. The largest opportunity is to turn these references and demonstrations into guided practice followed by independent performance on unfamiliar problems.

## Implemented improvements

September 7 addition: Blender 5.2.1 now supplies ten lightweight 3D spreader illustrations synchronized with the 30–75 degree angle slider. Learners switch between the assembly and the existing force diagram. Colors distinguish upper/lower slings and inward compression; bilingual captions identify symbolic connections and perspective limitations. The editable `.blend`, reproduction script, and numerical geometry manifest are retained. These are conceptual assemblies, not inspection photographs or rated product models. The illustrations use the existing reviewed static classroom assumptions and are included in the offline cache.

The September 2026 revision adds seven required skill stations with 22 evidence checks: weight/units/CG, asymmetric support share, angles/utilization, tag selection, six inspection records, spreader forces/configuration selection, and six application packets. Walkthroughs and independent cases use different values. Numerical answers require intermediate work; targeted feedback identifies the failed step. Results retain attempts and explicit coaching use.

The course now links each guided decision to relevant practice, routes the end of the six-step course to unfinished skills, and requires every skill check plus the conceptual decisions and final quiz before completion. The Practice navigation opens the workbench directly. Mobile station navigation is compact and scrollable; English and Spanish forms preserve draft work.

The two-point drawing and calculations share one core and one physical scale. Span and rise are editable. Unmeasured geometry cannot reach the qualified-review state. Changing a model, including during animation, invalidates verification tied to the previous model. Reset restores geometry and the calculation-evidence defaults. The final math question now uses a different load and angle.

The basket slider now changes a dimensioned force illustration. The D/d illustration uses the stated ratio and has no invented acceptance threshold. The load-path tool computes the governing utilization from a selected fictional equipment set and draws hook-tip misapplication separately. Blanket shackle side-load percentages were removed from both language versions in favor of product-specific instructions.

Tags and additional scenarios no longer present pending-photo screens. They use readable, explicitly fictional classroom documents. Approved physical-equipment photography remains a future asset enhancement, not falsely supplied evidence. The existing sourced wire-rope illustrations remain an unscored teaching gallery; six separate inspection records assess varied dispositions and the evidence behind them.

The existing retention-controlled record now includes skill evidence and keeps field observation separate. Old final-quiz credit is invalidated when the content version changes. The service-worker cache includes the new source files and uses a new revision. Instructor capacity/geometry expectations and the photography/record documentation were updated.

The separate `rigging101-sites` calculator also withholds three- and four-leg equal-share results until the exercise's sharing model is explicitly justified. Changing the selected leg count resets that acknowledgement. Its obsolete starter-skeleton tests were replaced by checks for the actual course and calculator.

### Verification of the implementation

- 17 calculation-core checks, including angle agreement across 27 geometries and spreader reference values.
- All 22 required skill cases completed through browser forms; wrong work, coaching history, independent success, language persistence, reload, completion gating and deletion verified.
- 143/143 existing button checks passed with assertions updated for the new destinations and working exercises.
- 31/31 bilingual checks, 21/21 remediation checks, 8/8 competency-flow checks, and the Stage 2 hitch suite passed.
- Desktop and phone renderings reviewed; seven Spanish mobile station forms checked for page overflow.
- The Sites production build and both current server-rendering tests passed; the three-/four-leg gate and acknowledgement reset were exercised in a browser.

No production deployment, push or qualification approval was performed. The calculations and hypothetical rating tables remain classroom models with their assumptions shown beside them.

## Scope and verification

Reviewed the main course, component content, assessment questions, visual labs, calculation core, calculator interface, instructor material, and existing test coverage. Compared the separate `rigging101-sites` implementation at commit `9a9228f`. Also inventoried the older `rigging-101` folder; it was not the primary audit target. The production deployment and actual learner outcomes were not verified.

Ran the existing calculation-core suite: **12 checks passed**. Independently reproduced the geometry/status issues below using the source equations. This was a source and calculation review, not a complete browser, accessibility, or field-validation audit. Public OSHA and manufacturer material was checked for the recommendations; this is not a complete verification of every ASME statement or edition cited in the course.

## Prioritized findings

| Priority | Finding and evidence | Learner impact | Recommended change |
|---|---|---|---|
| First | The plotted sling angles disagree with the numerical angles. [Drawing coordinates](C:/Users/RussGallivan/Github/CraneQualified/rigging101/index.html:861) use different horizontal and vertical scales. At CG 65% and hook height 90 in, the left leg is labeled 49.09° but drawn at approximately 36.30°. At centered CG and 120 in height, it is labeled 63.43° but drawn at approximately 47.13°. These are angles calculated from the SVG coordinates, not screenshot estimates. | The picture teaches a different geometric relationship from the calculation. This directly undermines angle recognition. | Use one scale for both axes, derive every line and angle arc from the same physical coordinates, and make the dimensional diagram the primary math visual. Keep the photograph as a separate application reference. |
| First | `rigging-core.js:114–125` records a warning for unmeasured geometry, but does not prevent `ready_for_review`. Reproduced with all ratings present, verified weight/CG, completed inspection, and `geometry: "training"`. `rigging-tools.js:195` also calls geometry measured regardless of that evidence setting. | A learner can receive conflicting messages about what is verified. | Add an explicit geometry-evidence status; label supplied exercise dimensions separately from field measurements. Show unresolved evidence beside the result. Do not describe training dimensions as measured. |
| First | The tag lab is unfinished: `visual-labs.js:125–128` shows “Real tag photography pending.” Clicking field names increments a count without requiring the learner to read a tag. | The course asks learners to use identified ratings but does not fully teach or assess the essential reading task. | Supply approved, legible tags and a matching rating reference. Ask for material, configuration, angle basis, units, identification, and the applicable rating. Add unreadable/missing-information examples requiring a hold. |
| High | Guided math question `RIG101_d3` and final question `RIG101_q3` both use a 10,000 lb symmetrical load at 45° with a 7,071 lb answer (`index.html:524,563`). | The final check can reward remembering an answer rather than calculating a new case. | Use different values and configurations for assessment. Require entered intermediate values and a reasoned capacity decision, not only answer selection. |
| High | Spreader and lifting beams are described in component entries (`index.html:509–510`), and the final test asks a device-recognition question. The reviewed calculation core only solves direct two-point rigging. | Learners do not practice upper sling tension, spreader compression, self-weight accounting, headroom, or rating-table selection. | Add the dedicated spreader lesson specified below, with a comparison to a lifting beam and a separate advanced pathway. |
| High | All six active wire-rope inspection cases use one handler that marks only “Remove” correct (`visual-labs.js:41–47,94–99`). The defect is named before the decision. Localized-wear text mentions applicable limits, but no measurement exercise establishes those limits. | Learners can pass by repeating one response without identifying the defect, measuring it, or selecting the governing criterion. | Separate a labeled teaching gallery from an unlabeled assessment. Mix fully documented serviceable cases, clear removals, and insufficient-evidence cases that must be withheld pending evaluation. Require evidence and disposition. |
| High | The basket-angle slider changes a number while both hitch images remain static (`visual-labs.js:102–108`). The load-path lab lets the learner select the “governing” component; the misapplication toggle changes text without changing the assembly geometry (`118–122`). | Controls appear to demonstrate a physical relationship that they do not actually model. | Animate a correctly dimensioned basket diagram and its force values. Determine the governing component from demand and applicable capacity; show the actual changed contact or loading direction for misapplication examples. |
| High | The bend lab assigns “Generous bearing” at D/d ≥ 7 and uses an unsourced qualitative gauge (`visual-labs.js:111–113`), despite describing itself as a geometry-only illustration. Its displayed circle/slings are not a scale construction of the stated ratio. | Learners may infer a universal acceptable D/d threshold or capacity allowance from a generic graphic. | Draw the stated ratio accurately. Show geometry without acceptance colors until sling construction, contact arrangement, and the applicable manufacturer's criteria are supplied. Do not treat edge-cut protection and bend diameter as interchangeable checks. |
| Next | The model fixes the pick span at 120 in (`rigging-tools.js:40–49`; also `index.html:849–857`). Weight/CG evidence initially defaults to verified (`rigging-tools.js:10`). The separate implementation in `rigging101-sites/app/components.tsx` permits choosing 2, 3, or 4 effective legs and divides equally. | Learners need more practice selecting valid inputs and identifying when a model applies. The Sites version needs stronger justification for effective-leg count. | Add editable, unit-labeled dimensions and controlled scenario documents. For free exploration, mark user-entered values unverified until a source is identified. For supplied exercises, label the information as supplied. Require justification for effective load-sharing legs. |
| Next | The main UI has both `shareModel()` and the separate `solveTwoPoint()` calculation path. Several relevant inspection criteria are in long component paragraphs. | Separate implementations can drift; important measurement and reference tasks are easy to skip. | Use one tested calculation core for displayed geometry, results, explanations, and grading. Present inspection criteria as equipment-specific evidence cards with source, edition/date, measurement method, and disposition. |

Line numbers above refer to the reviewed revision. For local navigation, see the main [course source](C:/Users/RussGallivan/Github/CraneQualified/rigging101/index.html:521), [visual labs](C:/Users/RussGallivan/Github/CraneQualified/rigging101/visual-labs.js:77), [calculation core](C:/Users/RussGallivan/Github/CraneQualified/rigging101/rigging-core.js:64), and [calculator interface](C:/Users/RussGallivan/Github/CraneQualified/rigging101/rigging-tools.js:188).

## Teach the math as a repeatable process

Use this sequence for every calculation: **identify the information → predict the result → draw the load and forces → calculate one step → check whether it makes sense → select from the applicable rating data → explain the decision.**

Keep the existing six-decision course as the organizing structure. Add short required practice within the relevant steps rather than placing all meaningful practice behind optional reference tabs.

| Lesson | Learner does | Evidence of understanding |
|---|---|---|
| Weight and units | Builds an itemized weight worksheet from a supplied drawing: load, contents, attachments, below-hook equipment, and rigging at the relevant level. Practices inches/feet, pounds/short tons, and kg/metric tonnes. | Includes each item once; distinguishes mass and force labels; identifies the source and uncertainty. A volume × density exercise is labeled an estimate unless independently verified. |
| Center of gravity | Moves a known heavy component on a load diagram and predicts which support reaction increases. Then calculates a combined CG from supplied component weights and locations. | Explains why the heavier end is not necessarily the geometric center and identifies the datum for every distance. |
| Vertical share | Solves a rigid, two-point, equal-elevation example using opposite distances. | Confirms that the two vertical reactions sum to the supported weight and satisfy moment balance. |
| Sling angle | Identifies horizontal, vertical, and included angles. Uses a ratio example before trigonometry, then relates L/H to 1/sin θ. | Selects the correct reference angle, uses degree mode, and predicts greater tension as legs flatten. |
| Capacity and application | Reads the supplied sling tag and relevant manufacturer information, then checks the sling and each connector against its actual force. | Uses the rating for the actual hitch, angle and loading direction; avoids applying an angle reduction twice to an already angle-rated assembly. |
| Spreader selection | Separates lower sling forces, upper sling forces, compression, device weight, and available headroom. | Chooses a permitted device configuration using its rating table, or states precisely why selection is unresolved. |

Start with a fully worked example, then hide one intermediate step, then require the whole calculation on a new case. Give feedback on the actual error: wrong distance, omitted weight, angle measured from the wrong axis, premature rounding, unjustified equal sharing, or wrong rating column.

### Example: asymmetric two-point rigging

For a classroom model, assume a rigid load, two picks at equal elevation, a hook directly above the known CG, static equilibrium, and negligible rigging self-weight. Use W = 12,000 lb, pick span = 10 ft, CG = 6.5 ft from the left pick, and hook rise = 7.5 ft.

- Left vertical share = 12,000 × 3.5 / 10 = **4,200 lb**.
- Right vertical share = 12,000 × 6.5 / 10 = **7,800 lb**.
- Left sling length = √(7.5² + 6.5²) = **9.925 ft**.
- Right sling length = √(7.5² + 3.5²) = **8.276 ft**.
- Left tension = 4,200 × 9.925 / 7.5 ≈ **5,558 lb**.
- Right tension = 7,800 × 8.276 / 7.5 ≈ **8,608 lb**.

Ask the learner to predict the governing leg before revealing the answers. Then reduce headroom while keeping the load and CG fixed. Require an explanation of why the vertical shares remain unchanged while tensions increase. Finally supply candidate ratings and ask for the controlling component; the highest force and the highest utilization need not be the same component.

The existing core already supports much of this calculation. The missing teaching layer is learner-entered work, diagnostic feedback, and transfer to a new example. The load-share and angle-factor method is supported by [Crosby's rigging information](https://www.thecrosbygroup.com/wp-content/uploads/catalog/2016/en-US/473.pdf).

## A dedicated spreader-beam lesson

First contrast a conventional spreader with a conventional lifting beam: upper slings at spreader ends introduce compression; a lifting beam with a central upper connection carries bending. These are configuration-dependent concepts, not interchangeable names or a method of establishing a device rating. Manufacturer-authored [Modulift MOD 24 instructions](https://iandisling.com/wp-content/uploads/2022/11/US-MOD-24-UI-compressed.pdf), hosted by a distributor, explicitly describe the spreader as an axial-compression device and specify angle/span-dependent use.

### Worked classroom case

State the model before showing a formula: level, symmetric spreader; equal upper sling angles; lower lines vertical; centered load; ideal end-node force transfer; static loading. For this example only, disregard sling/connector self-weight and represent the centered beam weight as equal equivalent end loads. This is a force illustration, not structural verification of a real beam.

Use a **10,000 lb payload**, **1,000 lb spreader**, **10 ft upper attachment spacing**, and **60° upper sling angle from horizontal**.

1. Each lower sling supports 10,000 / 2 = **5,000 lb**.
2. The modeled total supported by the upper pair is 10,000 + 1,000 = **11,000 lb**.
3. Each upper end has vertical share V = 11,000 / 2 = **5,500 lb**.
4. Upper sling tension T = V / sin θ = **6,351 lb per upper leg**.
5. Axial compression C = T cos θ = V / tan θ = **3,175 lb**. The opposed end forces produce this compression; do not add them to call it twice as large.
6. Upper rigging rise H = (10 / 2) tan θ = **8.66 ft**. Upper sling length L = (10 / 2) / cos θ = **10 ft**. Physical hook, shackle, end-fitting and connection clearances must be accounted for separately.

| Upper angle from horizontal | Upper tension per leg | Ideal compression | Upper rigging rise |
|---|---:|---:|---:|
| 60° | 6,351 lb | 3,175 lb | 8.66 ft |
| 45° | 7,778 lb | 5,500 lb | 5.00 ft |
| 30° | 11,000 lb | 9,526 lb | 2.89 ft |

The 30° row is a mathematical comparison, not an allowed configuration for the referenced device. The referenced MOD 24 instructions specify a minimum 45° base-to-sling angle. Put this restriction next to the comparison so the learner must reject a mathematically solvable but prohibited arrangement.

Finish with a **real selection task**, using an approved manufacturer table for one identified device: select the exact assembled span, upper angle and sling length, permitted load, component set, connections, and assembly requirements. The calculated compression alone cannot establish WLL; structural capacity, buckling, connection strength and the marked configuration still require the device's controlling documentation. [Modulift's assembly guidance](https://www.modulift.com/2023/07/04/how-to-safely-assemble-a-spreader-beam/) directs users to its instructions for load-versus-span data and assembly details.

Include a separate off-center case only after the symmetric case is mastered. Calculate unequal reactions and actual upper geometry, account for the complete assembly CG, and require approval of that device arrangement. Do not reuse the equal-share formula. Multi-spreader systems and lifting-beam structural design belong in a clearly identified advanced lesson.

## Make inspection an evidence task

The online lesson should teach the learner to identify the equipment, select the applicable criteria, inspect the complete assembly, record the diagnostic evidence, and choose a disposition. Construction rigging must be inspected before use each shift and as necessary during use; defective equipment must be removed. Build that habit into each case. [OSHA 1926.251](https://www.osha.gov/laws-regs/regulations/standardnumber/1926/1926.251)

Provide separate practice for wire-rope slings, web slings, roundslings, alloy chain, shackles/hooks, and below-hook devices. Distinguish sling construction and application before presenting numerical rejection criteria; do not teach one broken-wire limit as universal across crane running rope and all sling types. OSHA's [wire-rope sling guidance](https://www.osha.gov/safe-sling-use/wire) and [sling guidance introduction](https://www.osha.gov/safe-sling-use) provide an appropriate starting structure.

For each assessed case require: **equipment ID → location of concern → measured or observed evidence → applicable criterion → remove/hold/continue decision → next action**. “Continue” requires a complete supplied inspection record and acceptable application, not a single good-looking photograph. “Hold for evaluation” means withhold use while resolving uncertainty.

Add measurement exercises using a marked original dimension and current dimension. For instance, original 1.00 in and measured 0.88 in means 12% loss; supply the actual product criterion and ask the learner to apply it. Teach where and how to measure, including the distinction between sling body, fitting, pin and hook dimensions. Do not assign a universal 10% rule to all equipment.

Keep the existing instructor practical rubric and expand its observable requirements: trace the full sling, inspect eyes/fittings, read identification, take the required measurement, identify the reason for disposition, segregate rejected gear, and record follow-up. Digital completion should continue to remain separate from observed field performance.

## Teach applications through complete job packets

Use a small set of different loads with drawings, tagged candidate gear, inspection evidence, headroom dimensions, travel/landing constraints, and an explicit list of unknowns.

| Scenario | Learning target | Change introduced after the first decision |
|---|---|---|
| Motor-heavy skid | Opposite-distance reactions and unequal leg demand | Motor replaced or headroom reduced; learner must update the calculation. |
| Pipe bundle | Support, containment, longitudinal sliding, and configuration-specific rating | A proposed double-wrap arrangement is absent from the supplied approved instructions. |
| Sharp-edged plate | Material choice, bearing and cut protection, seating | Protection shifts during taking slack; learner must identify the hold point and correction. |
| Long fabricated frame | Direct bridle versus spreader versus lifting beam | Available headroom changes; learner reevaluates permitted configurations. |
| Four-pick rigid assembly | Effective load sharing and limits of simplified models | One leg is short or a pick is at a different elevation; the equal-share assumption is challenged. |
| Load with contents | Weight verification, changing CG, and stability | Contents are unknown or can move; learner identifies the missing evidence before selection. |

Require a short final briefing: load and CG source; calculation and selected rating; inspection evidence; connection and protection plan; trial-lift hold; stop conditions; landing and release. Make at least one final scenario unfamiliar in both numbers and appearance.

## Reference and assessment improvements

The top-shackle lesson contains broad side-load percentage ranges (`index.html:494`). Replace memory-based shortcuts with selection from an identified product's current application sheet. A manufacturer chart can have different angle bands, size restrictions and pin-type exclusions; also distinguish percentage reduction from percentage capacity remaining. The reviewed [Crosby application sheet](https://www.thecrosbygroup.com/wp-content/uploads/catalog/2016/en-US/94.pdf) illustrates those distinctions. Because that sheet is a 2019 catalog page, verify the current instructions for the actual product before making it a course answer key.

Retain the existing employer escalation thresholds, but explain that they are course/employer policy thresholds, not universal product ratings. Add a short WLL-versus-design-factor lesson and explain why unused rated capacity does not authorize shock loading or an otherwise prohibited application.

Track competency separately for: input selection, unit handling, CG/share, angle/tension, capacity lookup, inspection, beam application, and field briefing. Record independent accuracy, help used, and correction of the misconception. A repeat-until-correct total should not erase the distinction between independent work and coached practice.

## Recommended delivery order and acceptance checks

1. **Correct misleading teaching feedback:** align plotted/calculated geometry; fix the geometry-evidence status and wording; remove unsupported D/d acceptance cues; make placeholder tag status clear until real exercises exist.
2. **Build guided math and tag practice:** dimensional input, worked-to-independent exercises, correct rating selection, and new assessment values. Reuse one calculation core.
3. **Add spreader and inspection stations:** the force lesson and permitted-configuration lookup, followed by inspection cases with varied evidence-based dispositions.
4. **Add integrated transfer and practical evidence:** complete job packets, unfamiliar assessment cases, bilingual review, and instructor-observed work.

Accept the improvement when plotted and calculated angles agree across presets; unresolved evidence is consistently identified; a fresh math case requires intermediate work; tags must actually be read; inspection cannot be passed by always selecting “Remove”; spreader problems require checking the permitted configuration; and learners can explain a changed job scenario without copying the example answer.

Keep the two repositories clearly identified. The simpler Sites implementation should not silently become the replacement course without carrying forward the main repository's asymmetric calculations, evidence handling, instructional feedback and competency records.
