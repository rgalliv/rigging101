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

  function capacityCheck(key, label, demand, wll, thresholds) {
    const rated = optionalPositive(wll);
    if (rated === null) {
      return { key, label, demand, wll: null, utilization: null, status: "missing" };
    }
    const utilization = demand / rated;
    const elevatedAt = thresholds.elevated;
    const criticalAt = thresholds.critical;
    const status = utilization > 1
      ? "overloaded"
      : utilization >= criticalAt
        ? "critical"
        : utilization >= elevatedAt ? "elevated" : "within_wll";
    return {
      key,
      label,
      demand,
      wll: rated,
      utilization,
      status
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
    const thresholds = {
      elevated: Number.isFinite(Number(input.thresholds?.elevated)) ? Number(input.thresholds.elevated) : 0.80,
      critical: Number.isFinite(Number(input.thresholds?.critical)) ? Number(input.thresholds.critical) : 0.95
    };
    if (thresholds.elevated < 0 || thresholds.critical <= thresholds.elevated || thresholds.critical > 1) {
      throw new RangeError("capacity thresholds must satisfy 0 <= elevated < critical <= 1");
    }
    const checks = [
      capacityCheck("leftSlingWll", "Left sling", leftTension, capacities.leftSlingWll, thresholds),
      capacityCheck("rightSlingWll", "Right sling", rightTension, capacities.rightSlingWll, thresholds),
      capacityCheck("leftHardwareWll", "Left lower hardware", leftTension, capacities.leftHardwareWll, thresholds),
      capacityCheck("rightHardwareWll", "Right lower hardware", rightTension, capacities.rightHardwareWll, thresholds),
      capacityCheck("topHardwareWll", "Top hardware", totalLoad, capacities.topHardwareWll, thresholds)
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
    else if (evidence.geometry !== "measured") status = "geometry_required";
    else if (checks.some(check => check.status === "critical")) status = "critical_capacity";
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
      thresholds,
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
      thresholds: [Number(input.thresholds?.elevated) || 0.8, Number(input.thresholds?.critical) || 0.95],
      capacities: REQUIRED_CAPACITY_KEYS.map(key => Number(capacities[key]) || 0),
      evidence: [evidence.weight || "", evidence.cg || "", evidence.geometry || "", Boolean(evidence.inspectionComplete)]
    });
  }

  // One physical scale for both axes: the picture and its angle labels agree.
  function twoPointDrawing(result) {
    const scale = Math.min(510 / result.span, 260 / result.hookHeight);
    const leftX = (700 - result.span * scale) / 2;
    return { scale, leftX, rightX: leftX + result.span * scale,
      cgX: leftX + result.cgFromLeft * scale, pickY: 365,
      hookY: 365 - result.hookHeight * scale };
  }

  function solveSpreader(input) {
    const payload = positive(input.payload, "payload");
    const beamWeight = Number(input.beamWeight);
    if (!Number.isFinite(beamWeight) || beamWeight < 0) throw new RangeError("beamWeight must be nonnegative");
    const span = positive(input.span, "span");
    const angle = positive(input.angle, "angle");
    if (angle >= 90) throw new RangeError("spreader angle must be less than 90 degrees");
    const radians = angle * Math.PI / 180;
    const supportedLoad = payload + beamWeight;
    const vertical = supportedLoad / 2;
    return { payload, beamWeight, span, angle, supportedLoad, lowerTension: payload / 2,
      upperVertical: vertical, upperTension: vertical / Math.sin(radians),
      compression: vertical / Math.tan(radians), rise: span / 2 * Math.tan(radians),
      upperLength: span / 2 / Math.cos(radians) };
  }

  function combinedCg(items) {
    if (!Array.isArray(items) || !items.length) throw new TypeError("weight items required");
    let weight = 0, moment = 0;
    items.forEach(item => {
      const w = positive(item.weight, "weight"), position = Number(item.position);
      if (!Number.isFinite(position)) throw new TypeError("position must be finite");
      weight += w; moment += w * position;
    });
    return { weight, moment, cg: moment / weight };
  }

  function numericAnswer(value, expected, tolerance = 0.01) {
    if (typeof value === "string" && !value.trim()) return false;
    const n = Number(value);
    return Number.isFinite(n) && Math.abs(n - expected) <= tolerance + Number.EPSILON * Math.abs(expected);
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
    solveTwoPoint,
    twoPointDrawing,
    solveSpreader,
    combinedCg,
    numericAnswer
  };
});
