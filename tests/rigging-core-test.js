const assert = require("assert");
const core = require("../rigging-core.js");

let checks = 0;
function check(name, run) {
  run();
  checks += 1;
  process.stdout.write(`✓ ${name}\n`);
}

const readyInput = {
  totalLoad: 12000,
  span: 120,
  cgFromLeft: 60,
  hookHeight: 90,
  capacities: {
    leftSlingWll: 10000,
    rightSlingWll: 10000,
    leftHardwareWll: 10000,
    rightHardwareWll: 10000,
    topHardwareWll: 15000
  },
  evidence: { weight: "verified", cg: "verified", geometry: "measured", inspectionComplete: true }
};

check("dimension helper returns angle, reach, and L/H", () => {
  const value = core.slingAngleFromDimensions(10, 8);
  assert(Math.abs(value.angleFromHorizontalDeg - 53.1301) < 0.001);
  assert(Math.abs(value.horizontalReach - 6) < 0.001);
  assert.strictEqual(value.loadAngleFactor, 1.25);
});

check("centered load produces equal vertical shares", () => {
  const value = core.solveTwoPoint(readyInput);
  assert.strictEqual(value.legs.left.verticalShare, 6000);
  assert.strictEqual(value.legs.right.verticalShare, 6000);
  assert.strictEqual(value.governingLeg, "equal");
});

check("asymmetric load obeys opposite-distance share", () => {
  const value = core.solveTwoPoint({ ...readyInput, cgFromLeft: 78 });
  assert.strictEqual(value.legs.left.verticalShare, 4200);
  assert.strictEqual(value.legs.right.verticalShare, 7800);
  assert.strictEqual(value.governingLeg, "right");
  assert(value.equilibriumResidual < 0.000001);
});

check("missing ratings prevent capacity review", () => {
  const value = core.solveTwoPoint({ ...readyInput, capacities: {} });
  assert.strictEqual(value.status, "capacity_required");
  assert(value.checks.every(item => item.status === "missing"));
});

check("entered overload blocks the configuration", () => {
  const value = core.solveTwoPoint({ ...readyInput, capacities: { ...readyInput.capacities, leftSlingWll: 5000 } });
  assert.strictEqual(value.status, "blocked");
  assert.strictEqual(value.governingComponent.key, "leftSlingWll");
  assert(value.warnings.includes("component_overloaded"));
});

check("unverified evidence is a stop signal", () => {
  const value = core.solveTwoPoint({ ...readyInput, evidence: { ...readyInput.evidence, cg: "estimated" } });
  assert.strictEqual(value.status, "verified_information_required");
  assert(value.warnings.includes("cg_unverified"));
});

check("inspection remains separate from numeric capacity", () => {
  const value = core.solveTwoPoint({ ...readyInput, evidence: { ...readyInput.evidence, inspectionComplete: false } });
  assert.strictEqual(value.status, "inspection_required");
});

check("verified inputs and ratings reach review state", () => {
  assert.strictEqual(core.solveTwoPoint(readyInput).status, "ready_for_review");
});

check("fingerprint changes when a controlling input changes", () => {
  assert.notStrictEqual(core.calculationFingerprint(readyInput), core.calculationFingerprint({ ...readyInput, totalLoad: 12500 }));
});

check("assumptions ledger preserves source type", () => {
  const result = core.solveTwoPoint(readyInput);
  const ledger = core.buildAssumptions(readyInput, result);
  assert.strictEqual(ledger.find(item => item.key === "weight").source, "verified");
  assert.strictEqual(ledger.find(item => item.key === "leftSlingWll").source, "tag_entered");
  assert.strictEqual(ledger.find(item => item.key === "governing_demand").source, "calculated");
});

process.stdout.write(`\n${checks} rigging-core checks passed.\n`);
