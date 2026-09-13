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

check("capacity bands honor the 80, 95, and 100 percent boundaries", () => {
  const baseline = core.solveTwoPoint({ ...readyInput, capacities: {} });
  const demand = baseline.legs.left.tension;
  const statusAt = ratio => core.solveTwoPoint({
    ...readyInput,
    capacities: { ...readyInput.capacities, leftSlingWll: demand / ratio }
  }).checks.find(item => item.key === "leftSlingWll").status;
  assert.strictEqual(statusAt(0.799), "within_wll");
  assert.strictEqual(statusAt(0.80), "elevated");
  assert.strictEqual(statusAt(0.95), "critical");
  assert.strictEqual(statusAt(1.00), "critical");
  assert.strictEqual(statusAt(1.001), "overloaded");
});

check("employer thresholds are configurable and validated", () => {
  const baseline = core.solveTwoPoint({ ...readyInput, capacities: {} });
  const demand = baseline.legs.left.tension;
  const value = core.solveTwoPoint({
    ...readyInput,
    thresholds: { elevated: 0.70, critical: 0.90 },
    capacities: { ...readyInput.capacities, leftSlingWll: demand / 0.72 }
  });
  assert.strictEqual(value.checks.find(item => item.key === "leftSlingWll").status, "elevated");
  assert.throws(() => core.solveTwoPoint({ ...readyInput, thresholds: { elevated: 0.95, critical: 0.90 } }));
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

check("unmeasured geometry cannot reach the qualified review state", () => {
  const result = core.solveTwoPoint({...readyInput, evidence:{...readyInput.evidence,geometry:"training"}});
  assert.strictEqual(result.status,"geometry_required");
});

check("drawn leg angles agree with the physical model across unequal loads and spans", () => {
  for(const span of [24,120,360]) for(const fraction of [.1,.5,.9]) for(const height of [6,90,600]) {
    const r=core.solveTwoPoint({...readyInput,span,cgFromLeft:span*fraction,hookHeight:height});
    const d=core.twoPointDrawing(r);
    const left=Math.atan2(d.pickY-d.hookY,d.cgX-d.leftX)*180/Math.PI;
    const right=Math.atan2(d.pickY-d.hookY,d.rightX-d.cgX)*180/Math.PI;
    assert(Math.abs(left-r.geometry.leftAngle)<1e-8);
    assert(Math.abs(right-r.geometry.rightAngle)<1e-8);
  }
});

check("spreader example distinguishes lower demand, upper weight and axial compression", () => {
  const r=core.solveSpreader({payload:10000,beamWeight:1000,span:10,angle:60});
  assert.strictEqual(r.lowerTension,5000);
  assert.strictEqual(r.supportedLoad,11000);
  assert(Math.abs(r.upperTension-6350.85296)<.001);
  assert(Math.abs(r.compression-3175.42648)<.001);
  assert(Math.abs(r.rise-8.660254)<.001);
  assert(Math.abs(r.upperLength-10)<.001);
  const low=core.solveSpreader({payload:10000,beamWeight:1000,span:10,angle:45});
  assert(low.upperTension>r.upperTension && low.compression>r.compression && low.rise<r.rise);
  assert.throws(()=>core.solveSpreader({payload:10000,beamWeight:-1,span:10,angle:60}));
  assert.throws(()=>core.solveSpreader({payload:10000,beamWeight:1000,span:10,angle:90}));
});

check("combined CG uses component weights and a common datum",()=>{
  assert.strictEqual(core.combinedCg([{weight:3000,position:5},{weight:7000,position:8}]).cg,7.1);
  assert.throws(()=>core.combinedCg([]));
});

check("numeric grading rejects empty or nonfinite answers and respects rounding tolerances",()=>{
  assert(!core.numericAnswer("",0));
  assert(!core.numericAnswer("Infinity",100));
  assert(core.numericAnswer("6351",6350.85296,3));
  assert(!core.numericAnswer("6350",6350.85296,.1));
});
process.stdout.write(`\n${checks} total calculation and geometry checks passed.\n`);
