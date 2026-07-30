# Rigging 101 Field Learning Lab — Repo Review & Knowledge-Sourcing Map

Review of `index.html` (single-file interactive lab, 10 rigging configurations, 30
component lessons, 6 gated field decisions, 8-question knowledge check) plus the
`assets/configurations/` tiles. Findings are grouped by how much they matter, with a
final section mapping each improvement to the knowledge source that should feed it.

---

## 1. Gate-architecture findings (highest priority)

The lab reuses parts of the locked CraneQualified gate architecture (FNV-1a hashed
answers with `Math.imul`, salt `CQ1:RIG101_FieldLab`, no plaintext keys, correct
answers never revealed on a miss, 100% mastery reset on the knowledge check). Running
the module-kit audit against it reports 5 gaps; two are real, the rest are expected
deviations because this is a scrolling lab page rather than a slide module.

**Real gaps:**

1. **Completion handshake name mismatch.** The lab dispatches
   `cq-lab-complete` with `{next:"S4_M01"}` (`index.html:391`). The locked
   architecture and the LMS listener contract use `cq-module-complete`. If the
   Prolevari LMS only listens for `cq-module-complete`, completion of this lab is
   never registered. Either rename the event or confirm the LMS has a dedicated
   `cq-lab-complete` listener — this should be verified before the lab is linked
   into a course sequence.
2. **No `window.CQ` server-authoritative hook.** The lab is purely local: mastery
   state lives in `localStorage` (`cq.rig101.decisions`, `cq.rig101.kcMastered`) and
   is trusted on load without validation. Anyone can mark the lab complete from
   devtools in one line. The locked architecture calls `window.CQ` when present and
   falls back to the local FNV shim only for standalone preview. Adding the same
   two-line delegation here would make completion server-verifiable when embedded.

**Expected deviations (no action needed, but document them):** no slides /
`data-cq-total`, no KC Gate Engine block, no `cq-slide-audio-flow` overlay, and no
score chip in the module-kit sense. `verify_module.cjs` cannot drive this page; if
behavioural verification is wanted, it needs a small lab-specific harness.

3. **No answer manifest in version control.** The module-builder convention keeps a
   small `manifests/*.json` (salt, gate ids, answer key) as the source of truth for
   rebuilds. This repo has only the hashes. If the source answer key isn't stored
   anywhere else, nobody can regenerate or re-verify the hashes without brute-forcing
   the 4 options per question. Add `manifests/RIG101.json` (private repo) or store the
   key in the Rigging SME project in Notion.

## 2. Functional and UX improvements

1. **Mobile scroll trap on the stage (iPad/iPhone Safari — the primary target).**
   `.stage-shell` sets `touch-action:none` unconditionally (`index.html:46`). On
   mobile the stage is sticky and up to 62vh tall, so swipes that begin on it can't
   scroll the page at all — even at 100% zoom where dragging does nothing. Set
   `touch-action` dynamically: `pan-y` (or `manipulation`) at zoom 1, `none` only
   while zoomed in.
2. **Tile strip re-renders on every interaction.** `renderAll()` calls
   `renderTiles()`, so all 10 `<img>` tiles are torn down and rebuilt on every
   hotspot click, tab change, weight edit, and layer toggle. Render tiles once and
   only update `aria-selected` on config change; also add `loading="lazy"` to tile
   images.
3. **Weight input quirk.** Entering `0` silently becomes 10,000 lb because `0` is
   falsy in `Number(...)||10000` (`index.html:306`). Use `Number.isFinite` and clamp
   instead, and consider accepting tons/kg for field realism.
4. **Keyboard support for tab patterns.** The config tiles use `role="tablist"` /
   `role="tab"` and the detail tabs likewise, but neither implements arrow-key
   navigation, so the ARIA pattern promises behaviour that isn't there. Add
   roving-tabindex arrow keys or downgrade the roles to plain buttons.
5. **Dead hotspot entries.** `hotspotPositions()` includes `shacklepin` and
   `loadweight`, which exist in no configuration's component list — either wire them
   up as components or remove them.
6. **Decision gate is trivially brute-forceable.** A wrong decision answer resets
   after 800 ms and can be retried immediately; with 4 options mastery is at most 4
   clicks. If decisions are meant to gate anything real, add attempt tracking or a
   shuffle-and-cool-down like the KC's full reset. If they're deliberately formative,
   leave as is.

## 3. Content-accuracy flags for SME review

1. **Single-leg choker gets a load angle factor.** For the choker configuration
   (1 leg), `tensionData()` still applies `1/sin(angle)` because the vertical-hitch
   exemption only covers `legs===1 && hitch==="vertical"` (`index.html:295`). A
   single choker leg hanging from the hook is vertical — showing 11,547 lb of leg
   demand on a 10,000 lb load at "60°" is misleading. Either force the angle readout
   to N/A for single-leg choker (mirroring vertical) or model the sling-to-load angle
   explicitly as a choke-efficiency note, which is the concept B30.9 actually varies.
2. **Beam leg demand ignores beam self-weight.** `weight/2` is shown while the
   efficiency note says to include beam weight. Fine as orientation, but consider a
   beam-weight input so the number and the caveat agree.
3. **Symmetric-CG-only math.** Every tension figure assumes a centered CG (the hard
   caveat says so). Decision 1 teaches off-center CG, but the calculator can't show
   it. An asymmetric-CG mode (slider for CG offset, per-leg share `W·d₂/(d₁+d₂)`)
   would close the gap between what the lab teaches and what it can demonstrate —
   and worked solutions for exactly this already exist in the second brain (below).

## 4. Repo hygiene

- No `README.md` (purpose, how the lab embeds in the LMS, the completion event
  contract, how to regenerate hashes), no `LICENSE`, no favicon, no OG/social meta,
  and no CI. A tiny README plus a favicon are the cheapest wins.
- Single commit history; fine for now, but once a manifest exists it should be the
  reviewed artifact for any answer/gate change.

## 5. Knowledge-sourcing map from the Second Brain

The **Rigging SME** project (Second Brain → Claude Knowledge Archive) is the
designated source for this material and holds 8 docs. How each maps to this repo:

| Source | Feeds |
| --- | --- |
| **Drifting With Chain Hoist.docx** — CG & sling-tension workshop with worked solutions (asymmetric pick points, minimum wire-rope diameters) | The asymmetric-CG calculator mode (§3.3) and one or two new KC scenarios with real numbers instead of the current symmetric-only examples |
| **ITI - Rigging.docx** (154 KB) | SME check of the choker/basket angle treatment (§3.1) and D/d content in the `bearing` lesson |
| **Tucker Advanced Rigging.pdf** | Advanced scenarios for a possible "Rigging 201" follow-on (drifting, turning loads) |
| **B30.5 Mobile word.docx** | Crane-side context if lessons ever reference the hoist above the hook |
| **EM 385-1-1 (Mar 2024)** | Add USACE citations alongside ASME volumes in lesson `volume` tags for federal-contract audiences |
| **BC Crane and Rigging Safety.pdf** / **SWIPE-Rigging.docx** | Inspection-lens cross-checks for the rejection-criteria text |

From **Government Crane Programs** (CraneQualified HQ, updated 2026-07-30):

- **DOE-STD-1090-2020** requires classifying every lift (ordinary / critical /
  pre-engineered) before planning. Decision 1 ("Establish the load") is the natural
  place to introduce lift classification — structure only, no standards text lifted,
  per the standing caution on that page.
- **USBR RSHS §3.02** cites exactly the volumes this lab uses (B30.9/.10/.20/.26)
  plus 29 CFR 1926.251 and 1910.184. Adding the CFR citations next to the ASME tags
  would strengthen the "Authority" tab for government-facing use.
- **USBR FIST 4-1A §6** (inspection/testing tables) can inform periodic-inspection
  content — noting its internal-use restriction before anything client-facing.

From the **RMS Cranes 500-ton lift plan** page: the "rigging substitutions allowed
only within 85% of SWL, verified at the JSA" rule is a strong candidate for a new
field-decision scenario — it is a real-world judgment call the current six decisions
don't cover.

---

*Orientation-level review. Code references are to `index.html` at commit `efe2b1a`.*
