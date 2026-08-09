(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.RiggingTrainingCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const REQUIRED_CAPACITY_KEYS = [
    "leftSlingWll",
    "rightSlingWll",
    "leftHardwareWll",
    "rightHardwareWll",
    "topHardwareWll"
  ];

  function positive(value, name) {
    const number = Number(value);
    if (!Number.isFinite(number) || number <= 0) {
      throw new TypeError(`${name} must be a finite number greater than zero`);
    }
    return number;
  }

  function optionalPositive(value) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : null;
  }

  function capacityCheck(key, label, demand, wll) {
    const rated = optionalPositive(wll);
    if (rated === null) {
      return { key, label, demand, wll: null, utilization: null, status: "missing" };
    }
    const utilization = demand / rated;
    return {
      key,
      label,
      demand,
      wll: rated,
      utilization,
      status: utilization > 1 ? "overloaded" : "within_wll"
    };
  }

  function slingAngleFromDimensions(slingLength, verticalHeight) {
    const length = positive(slingLength, "slingLength");
    const height = positive(verticalHeight, "verticalHeight");
    if (height > length) throw new RangeError("verticalHeight cannot exceed slingLength");
    const ratio = height / length;
    return {
      angleFromHorizontalDeg: Math.asin(ratio) * 180 / Math.PI,
      horizontalReach: Math.sqrt(Math.max(0, length * length - height * height)),
      loadAngleFactor: length / height
    };
  }

  function solveTwoPoint(input) {
    const totalLoad = positive(input.totalLoad, "totalLoad");
    const span = positive(input.span, "span");
    const cgFromLeft = positive(input.cgFromLeft, "cgFromLeft");
    const hookHeight = positive(input.hookHeight, "hookHeight");
    if (cgFromLeft >= span) throw new RangeError("cgFromLeft must remain inside the pick span");

    const leftReach = cgFromLeft;
    const rightReach = span - cgFromLeft;
    const leftVerticalShare = totalLoad * rightReach / span;
    const rightVerticalShare = totalLoad * leftReach / span;
    const leftLength = Math.hypot(hookHeight, leftReach);
    const rightLength = Math.hypot(hookHeight, rightReach);
    const leftFactor = leftLength / hookHeight;
    const rightFactor = rightLength / hookHeight;
    const leftAngle = Math.atan2(hookHeight, leftReach) * 180 / Math.PI;
    const rightAngle = Math.atan2(hookHeight, rightReach) * 180 / Math.PI;
    const leftTension = leftVerticalShare * leftFactor;
    const rightTension = rightVerticalShare * rightFactor;
    const leftHorizontal = leftVerticalShare * leftReach / hookHeight;
    const rightHorizontal = rightVerticalShare * rightReach / hookHeight;
    const equilibriumResidual = Math.abs(leftHorizontal - rightHorizontal);

    const capacities = input.capacities || {};
    const checks = [
      capacityCheck("leftSlingWll", "Left sling", leftTension, capacities.leftSlingWll),
      capacityCheck("rightSlingWll", "Right sling", rightTension, capacities.rightSlingWll),
      capacityCheck("leftHardwareWll", "Left lower hardware", leftTension, capacities.leftHardwareWll),
      capacityCheck("rightHardwareWll", "Right lower hardware", rightTension, capacities.rightHardwareWll),
      capacityCheck("topHardwareWll", "Top hardware", totalLoad, capacities.topHardwareWll)
    ];
    const ratedChecks = checks.filter(check => check.utilization !== null);
    const governingComponent = ratedChecks.length
      ? ratedChecks.reduce((current, check) => check.utilization > current.utilization ? check : current)
      : null;
    const governingLeg = Math.abs(leftTension - rightTension) <= Math.max(leftTension, rightTension) * 0.005
      ? "equal"
      : leftTension > rightTension ? "left" : "right";
    const evidence = input.evidence || {};
    const warnings = [];
    if (leftAngle < 30 || rightAngle < 30) warnings.push("low_angle");
    if (evidence.weight !== "verified") warnings.push("weight_unverified");
    if (evidence.cg !== "verified") warnings.push("cg_unverified");
    if (evidence.geometry !== "measured") warnings.push("geometry_training_default");
    if (!evidence.inspectionComplete) warnings.push("inspection_incomplete");
    if (checks.some(check => check.status === "missing")) warnings.push("capacity_missing");
    if (checks.some(check => check.status === "overloaded")) warnings.push("component_overloaded");

    let status = "ready_for_review";
    if (checks.some(check => check.status === "overloaded")) status = "blocked";
    else if (leftAngle < 30 || rightAngle < 30) status = "qualified_analysis_required";
    else if (evidence.weight !== "verified" || evidence.cg !== "verified") status = "verified_information_required";
    else if (checks.some(check => check.status === "missing")) status = "capacity_required";
    else if (!evidence.inspectionComplete) status = "inspection_required";

    return {
      totalLoad,
      span,
      cgFromLeft,
      hookHeight,
      geometry: {
        leftReach,
        rightReach,
        leftLength,
        rightLength,
        leftAngle,
        rightAngle,
        leftFactor,
        rightFactor
      },
      legs: {
        left: {
          verticalShare: leftVerticalShare,
          tension: leftTension,
          horizontalForce: leftHorizontal
        },
        right: {
          verticalShare: rightVerticalShare,
          tension: rightTension,
          horizontalForce: rightHorizontal
        }
      },
      equilibriumResidual,
      governingLeg,
      checks,
      governingComponent,
      status,
      warnings,
      explanation: [
        { key: "supported_load", values: { totalLoad } },
        { key: "opposite_distance", values: { totalLoad, span, leftReach, rightReach, leftVerticalShare, rightVerticalShare } },
        { key: "measured_geometry", values: { hookHeight, leftLength, rightLength, leftAngle, rightAngle, leftFactor, rightFactor } },
        { key: "leg_demand", values: { leftVerticalShare, rightVerticalShare, leftFactor, rightFactor, leftTension, rightTension } },
        { key: "equilibrium", values: { leftHorizontal, rightHorizontal, equilibriumResidual } }
      ]
    };
  }

  function calculationFingerprint(input) {
    const capacities = input.capacities || {};
    const evidence = input.evidence || {};
    return JSON.stringify({
      totalLoad: Number(input.totalLoad),
      span: Number(input.span),
      cgFromLeft: Number(input.cgFromLeft),
      hookHeight: Number(input.hookHeight),
      capacities: REQUIRED_CAPACITY_KEYS.map(key => Number(capacities[key]) || 0),
      evidence: [evidence.weight || "", evidence.cg || "", evidence.geometry || "", Boolean(evidence.inspectionComplete)]
    });
  }

  function buildAssumptions(input, result) {
    const capacities = input.capacities || {};
    const evidence = input.evidence || {};
    const entries = [
      { key: "weight", category: "evidence", source: evidence.weight === "verified" ? "verified" : "estimated", value: result.totalLoad },
      { key: "cg", category: "evidence", source: evidence.cg === "verified" ? "verified" : "estimated", value: result.cgFromLeft },
      { key: "geometry", category: "evidence", source: evidence.geometry === "measured" ? "measured" : "training_default", value: result.hookHeight },
      { key: "rigid_load", category: "model", source: "training_assumption", value: true },
      { key: "equal_pick_elevation", category: "model", source: "training_assumption", value: true },
      { key: "hook_over_cg", category: "model", source: "training_assumption", value: true },
      { key: "inspection", category: "evidence", source: evidence.inspectionComplete ? "verified" : "missing", value: Boolean(evidence.inspectionComplete) }
    ];
    REQUIRED_CAPACITY_KEYS.forEach(key => entries.push({
      key,
      category: "capacity",
      source: optionalPositive(capacities[key]) === null ? "missing" : "tag_entered",
      value: optionalPositive(capacities[key])
    }));
    entries.push(
      { key: "left_share", category: "calculated", source: "calculated", value: result.legs.left.verticalShare },
      { key: "right_share", category: "calculated", source: "calculated", value: result.legs.right.verticalShare },
      { key: "governing_demand", category: "calculated", source: "calculated", value: Math.max(result.legs.left.tension, result.legs.right.tension) }
    );
    return entries;
  }

  return {
    REQUIRED_CAPACITY_KEYS,
    buildAssumptions,
    calculationFingerprint,
    slingAngleFromDimensions,
    solveTwoPoint
  };
});
