# Rigging 101 visual learner photography manifest

Status: commissioned photography required. These filenames are the binding contract for the visual-lab slots. Only evaluator-approved real photographs may replace the placeholders. Do not use generated damage, tags, component close-ups, or jobsite scenes.

## Capture standard

- Capture serviceable and rejectable pairs at matched camera angle, component identity, scale, focal length, lighting, and background.
- Include a neutral scale reference outside the load-bearing surface when dimension is relevant.
- Photograph the full component, then a diagnostic close-up. Preserve enough surrounding material to show where the condition occurs.
- Do not mark the diagnostic feature in the base photograph. Annotation coordinates are added as a separate data layer.
- Record manufacturer, model or construction, size, material or grade, condition disposition, evaluator, source, date, and approved alt text.
- Do not stage a component as serviceable when its condition is uncertain.
- Marginal-condition photographs require a documented evaluator call before they can enter Tier 2.

## Inspection and rejection pairs

Each row requires `serviceable.webp`, `rejectable.webp`, and a 2× close-up for each condition under `assets/inspection/<family>/<mode>/`.

### Wire rope slings

- `broken-wires-distributed`
- `broken-wires-localized`
- `birdcaging`
- `kinking`
- `crushing-flattening`
- `core-protrusion`
- `corrosion`
- `heat-damage`
- `end-fitting-damage`
- `tag-missing-illegible`

### Synthetic web and round slings

- `cuts`
- `snags`
- `abrasion`
- `melting-charring`
- `chemical-attack`
- `knots`
- `stitching-failure`
- `exposed-core-yarn`
- `uv-degradation`
- `tag-illegible`

Capture web and round sling variants separately when the diagnostic feature presents differently.

### Alloy chain slings

- `stretch-elongation`
- `gouges`
- `nicks`
- `cracks`
- `twisted-bent-links`
- `bearing-point-wear`
- `heat-damage`

### Hooks, shackles, master links, and related hardware

- `hook-throat-bent-opened`
- `hook-latch-damage`
- `hook-twisted`
- `shackle-pin-stretched-bent`
- `shackle-bow-worn`
- `shackle-pin-mismatched`
- `master-link-deformed`
- `thread-damage`
- `markings-missing-illegible`

## Tier 2 marginal-condition set

Capture at least three evaluator-confirmed marginal examples per equipment family. The disposition for these images is `escalate for designated-person evaluation`. Store them under `assets/inspection/<family>/marginal-<sequence>/`. Do not publish a Tier 2 image until its evaluator record is complete.

## Sling tag and hardware marking reader

Use `assets/tags/<family>/<variant>.webp`.

Families:

- `wire-rope-sling`
- `synthetic-web-sling`
- `synthetic-roundsling`
- `alloy-chain-sling`
- `shackle-marking`
- `hook-marking`
- `master-link-marking`

Required variants for each applicable family:

- `clean-legible`
- `faded`
- `torn`
- `painted-over`
- `wrong-tag-for-component`
- `missing`

Tag photographs must support mapped fields for manufacturer, rated capacities by hitch, length, material or grade, serial or identification, and applicable markings. Hardware photographs map the manufacturer and rated-capacity markings that are actually present.

## Hitch comparison set

Capture the same identified sling and the same load at matched scale under `assets/hitches/`:

- `vertical.webp`
- `choker.webp`
- `basket-90.webp`
- `basket-60.webp`
- `basket-45.webp`
- `basket-30.webp`

Record the sling tag used for the set. The application must read actual ratings from the approved metadata rather than infer a universal hitch multiplier.

## Internal technical hitch diagrams

These are technical training diagrams, not photographs and not capacity tables. They may be used to teach configuration concepts while the commissioned hitch photography set above remains pending.

- `assets/reference/hitch-types-basic.jpg`
  - Owning organization: MSC Safety Solutions internal training library
  - Source: Crane and Rigging Brain / `Rigging Scenerios/Rigger Cards/Hitch Types.JPG`
  - Use: comparison of vertical and choker hitch forms
  - English alt: Technical diagram comparing vertical and choker hitch arrangements
  - Spanish alt: Diagrama técnico que compara arreglos de enganche vertical y ahorcado
- `assets/reference/hitch-types-controlled-loads.jpg`
  - Owning organization: MSC Safety Solutions internal training library
  - Source: Crane and Rigging Brain / `Rigging Scenerios/Rigger Cards/Hitch Types2.JPG`
  - Use: comparison of double-wrap choker, basket, and double-wrap basket concepts around pipe
  - English alt: Technical diagram comparing double-wrap choker, basket, and double-wrap basket arrangements around pipe
  - Spanish alt: Diagrama técnico que compara arreglos de ahorcado de doble vuelta, canasta y canasta de doble vuelta alrededor de tubos

Content basis: the Crane and Rigging Brain copies of ASME B30.9 (configuration-specific ratings; basket support, balance, and control), IPT Section 1 Rigging (basket and double-wrap basket concepts, including pipe/tubing), and the NCCCO rigger reference (balanced basket loading and slippage control). Actual selection remains governed by the identified sling, manufacturer data, the load-specific plan, and qualified-person direction where required.

## Evidence board scene library

Each scene requires one wide photograph, one text-equivalent evidence list, marker coordinates, verified-fact sources, assumptions, decision prompts, FNV-1a answer hashes, evaluator approval, and bilingual alt text.

- `assets/scenarios/evidence-shop-floor.webp` — shop floor, existing pump-skid interaction can be reshot to this contract.
- `assets/scenarios/evidence-congested-site.webp` — congested work area with validated access, path, rigging, and personnel-position evidence.
- `assets/scenarios/evidence-outdoor-yard.webp` — outdoor yard with weather and ground or landing-condition evidence.
- `assets/scenarios/evidence-clear-lift.webp` — compliant scene where the correct call is to proceed after verification.

The photograph establishes visible location and condition only. Controlled information must establish weight, center of gravity, capacity, and approved lift points.

## Source and approval record required for every photograph

- Asset filename
- Photographer or owning organization
- Capture date and location
- Equipment identity and configuration
- Factual source used for the condition call
- Evaluator name and role
- Approved disposition
- English alt text
- Spanish alt text
- Annotation coordinates and labels
- Release or usage permission
