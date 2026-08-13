(function () {
  "use strict";

  const core = window.RiggingTrainingCore;
  const lab = document.getElementById("shareLab");
  if (!core || !lab) return;

  const capacityKeys = core.REQUIRED_CAPACITY_KEYS;
  const capacities = Object.fromEntries(capacityKeys.map(key => [key, 0]));
  const evidence = { weight: "verified", cg: "verified", geometry: "training", inspectionComplete: false };
  let activePanel = "model";
  let activeView = "elevation";
  let elevationMarkup = "";
  let appliedFingerprint = "";
  let draftStale = false;
  let elevatedThreshold = 80;
  let criticalThreshold = 95;

  const text = (en, es) => document.documentElement.lang === "es" ? es : en;
  const number = value => Math.round(value).toLocaleString(document.documentElement.lang === "es" ? "es-MX" : "en-US");
  const isKg = () => document.getElementById("unitToggle")?.getAttribute("aria-pressed") === "true";
  const toDisplay = pounds => isKg() ? pounds * 0.45359237 : pounds;
  const fromDisplay = value => isKg() ? value / 0.45359237 : value;
  const force = pounds => `${number(toDisplay(pounds))} ${isKg() ? "kg" : "lb"}`;
  const preciseForce = (pounds, comparison) => {
    const converted = toDisplay(pounds);
    const nearBoundary = Number.isFinite(comparison) && Math.abs(pounds - comparison) < 1;
    const value = nearBoundary
      ? converted.toLocaleString(document.documentElement.lang === "es" ? "es-MX" : "en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 })
      : number(converted);
    return `${value} ${isKg() ? "kg" : "lb"}`;
  };
  const unit = () => isKg() ? "kg" : "lb";

  function currentHeight() {
    return Number(lab.querySelector("#shareHeight [aria-pressed='true']")?.dataset.shareHeight) || 90;
  }

  function input() {
    const totalLoad = Math.max(1, Number(lab.querySelector("#shareWeight")?.value) || 12000);
    const cgPercent = Math.max(1, Math.min(99, Number(lab.querySelector("#shareCg")?.value) || 50));
    return {
      totalLoad,
      span: 120,
      cgFromLeft: 120 * cgPercent / 100,
      hookHeight: currentHeight(),
      capacities: { ...capacities },
      thresholds: { elevated: elevatedThreshold / 100, critical: criticalThreshold / 100 },
      evidence: { ...evidence }
    };
  }

  function result() {
    return core.solveTwoPoint(input());
  }

  function setup() {
    const stage = lab.querySelector(".share-stage");
    if (stage && !lab.querySelector(".share-viewbar")) {
      stage.insertAdjacentHTML("beforebegin", `<div class="share-viewbar"><div class="share-viewtabs" role="tablist" aria-label="${text("Diagram view","Vista del diagrama")}"></div><span class="share-freshness" id="shareFreshness" role="status"></span></div>`);
    }

    const analysis = lab.querySelector(".share-analysis");
    if (analysis && !lab.querySelector(".share-analysis-tabs")) {
      const children = [...analysis.children];
      const model = document.createElement("div");
      model.className = "share-tool-panel";
      model.id = "sharePanelModel";
      model.setAttribute("role", "tabpanel");
      children.forEach(child => model.appendChild(child));
      analysis.appendChild(model);
      analysis.insertAdjacentHTML("afterbegin", `<div class="share-analysis-tabs" role="tablist" aria-label="${text("Load-share analysis","Análisis del reparto de carga")}"></div><div class="share-tool-panel" id="sharePanelCapacity" role="tabpanel" hidden></div><div class="share-tool-panel" id="sharePanelAssumptions" role="tabpanel" hidden></div><div class="share-tool-panel" id="sharePanelExplain" role="tabpanel" hidden></div>`);
    }
  }

  function renderNavigation() {
    const modelTitle = lab.querySelector("#shareAnalysisTitle");
    const modelIntro = lab.querySelector("#sharePanelModel > p");
    if (modelTitle) modelTitle.textContent = text("Read the demand", "Lea la demanda");
    if (modelIntro) modelIntro.textContent = text(
      "First find each leg’s share of the weight. Then apply that leg’s angle to get its tension. Share and tension are related — but they are not the same number.",
      "Primero obtenga la porción del peso de cada ramal. Después aplique el ángulo de ese ramal para obtener su tensión. La porción y la tensión se relacionan — pero no son el mismo número."
    );
    const viewTabs = lab.querySelector(".share-viewtabs");
    if (viewTabs) viewTabs.innerHTML = [["elevation",text("Elevation","Elevación")],["plan",text("Plan view","Vista en planta")]].map(([key,label]) => `<button type="button" role="tab" data-share-view="${key}" aria-selected="${activeView === key}">${label}</button>`).join("");
    const tabs = lab.querySelector(".share-analysis-tabs");
    if (tabs) tabs.innerHTML = [["model",text("Model","Modelo")],["capacity",text("Capacity","Capacidad")],["assumptions",text("Evidence","Evidencia")],["explain",text("Explain","Explicar")]].map(([key,label]) => `<button type="button" role="tab" data-share-panel="${key}" aria-selected="${activePanel === key}">${label}</button>`).join("");
    ["model","capacity","assumptions","explain"].forEach(key => {
      const panel = lab.querySelector(`#sharePanel${key[0].toUpperCase()}${key.slice(1)}`);
      if (panel) panel.hidden = activePanel !== key;
    });
  }

  function renderFreshness() {
    const badge = lab.querySelector("#shareFreshness");
    if (!badge) return;
    const fingerprint = core.calculationFingerprint(input());
    const stale = draftStale || (appliedFingerprint && fingerprint !== appliedFingerprint);
    badge.className = `share-freshness${stale ? " stale" : ""}`;
    badge.textContent = stale ? text("Changes not applied","Cambios sin aplicar") : text("Analysis current","Análisis actualizado");
    if (!appliedFingerprint) appliedFingerprint = fingerprint;
  }

  function renderPlan(data) {
    if (activeView !== "plan") return;
    const svg = lab.querySelector("#shareSvg");
    if (!svg) return;
    const cgX = 105 + 515 * data.cgFromLeft / data.span;
    const leftWidth = Math.max(8, 210 * data.legs.left.verticalShare / data.totalLoad);
    const rightWidth = Math.max(8, 210 * data.legs.right.verticalShare / data.totalLoad);
    svg.innerHTML = `<title>${text("Plan view of two-point load share","Vista en planta del reparto de carga en dos puntos")}</title><desc>${text("The center of gravity position determines the vertical share carried at each pick point.","La posición del centro de gravedad determina la porción vertical soportada en cada punto de izaje.")}</desc>
      <rect class="share-plan-bg" width="700" height="500"/><rect class="share-plan-load" x="82" y="105" width="556" height="260" rx="18"/>
      <line class="share-plan-line" x1="105" y1="80" x2="105" y2="405"/><line class="share-plan-line" x1="620" y1="80" x2="620" y2="405"/><circle class="share-plan-pick" cx="105" cy="235" r="14"/><circle class="share-plan-pick" cx="620" cy="235" r="14"/>
      <line class="cg-line" x1="${cgX}" y1="75" x2="${cgX}" y2="395"/><circle class="share-plan-cg" cx="${cgX}" cy="235" r="17"/><text class="share-plan-text" text-anchor="middle" x="${cgX}" y="278">CG · ${Math.round(data.cgFromLeft / data.span * 100)}%</text>
      <text class="share-plan-text" x="35" y="35">${text("LEFT PICK","PUNTO IZQ.")} · ${force(data.legs.left.verticalShare)}</text><text class="share-plan-text" text-anchor="end" x="665" y="35">${text("RIGHT PICK","PUNTO DER.")} · ${force(data.legs.right.verticalShare)}</text>
      <rect class="share-plan-bar ${data.governingLeg === "left" ? "governing" : ""}" x="105" y="420" width="${leftWidth}" height="22" rx="6"/><rect class="share-plan-bar ${data.governingLeg === "right" ? "governing" : ""}" x="${620-rightWidth}" y="420" width="${rightWidth}" height="22" rx="6"/>
      <text class="share-plan-small" x="105" y="472">${number(data.geometry.leftReach)} ${text("in from left pick","pulg desde el punto izq.")}</text><text class="share-plan-small" text-anchor="end" x="620" y="472">${number(data.geometry.rightReach)} ${text("in from right pick","pulg desde el punto der.")}</text>`;
  }

  const capacityLabels = () => ({
    leftSlingWll: text("Left sling — tagged WLL","Eslinga izquierda — WLL de etiqueta"),
    rightSlingWll: text("Right sling — tagged WLL","Eslinga derecha — WLL de etiqueta"),
    leftHardwareWll: text("Left lower hardware — marked WLL","Herraje inferior izquierdo — WLL marcado"),
    rightHardwareWll: text("Right lower hardware — marked WLL","Herraje inferior derecho — WLL marcado"),
    topHardwareWll: text("Top hardware — marked WLL","Herraje superior — WLL marcado")
  });

  function statusCopy(status) {
    return ({
      blocked: [text("STOP — entered WLL exceeded","ALTO — se excede el WLL ingresado"), text("At least one entered component rating is below calculated demand.","Al menos una capacidad ingresada está por debajo de la demanda calculada.")],
      critical_capacity: [text("CRITICAL — escalate","CRÍTICO — escale"), text("At least one component is at 95% or more of its entered WLL. Little margin remains; do not proceed on this comparison.","Al menos un componente está al 95% o más de su WLL ingresado. Queda poco margen; no proceda con esta comparación.")],
      qualified_analysis_required: [text("Qualified analysis required","Se requiere análisis de una persona calificada"), text("A sling angle is below 30°. Do not use this training model as field approval.","Un ángulo de eslinga es menor de 30°. No use este modelo de práctica como aprobación de campo.")],
      verified_information_required: [text("Verify load information","Verifique la información de la carga"), text("Weight or center of gravity is still estimated.","El peso o el centro de gravedad todavía es estimado.")],
      capacity_required: [text("Enter identified capacities","Ingrese las capacidades identificadas"), text("Use the sling tag and marked hardware WLL for this exact configuration.","Use la etiqueta de la eslinga y el WLL marcado del herraje para esta configuración exacta.")],
      inspection_required: [text("Inspection evidence required","Se requiere evidencia de inspección"), text("The numbers fit, but component condition has not been confirmed.","Los números cumplen, pero no se ha confirmado la condición de los componentes.")],
      ready_for_review: [text("Inputs ready for qualified review","Entradas listas para revisión calificada"), text("No entered WLL is exceeded. This remains training support, not lift authorization.","No se excede ningún WLL ingresado. Esto sigue siendo apoyo de capacitación, no autorización de izaje.")]
    })[status];
  }

  function renderCapacity(data) {
    const panel = lab.querySelector("#sharePanelCapacity");
    if (!panel) return;
    const labels = capacityLabels();
    const [title, detail] = statusCopy(data.status);
    const rowStatus = check => {
      const pct = (check.utilization * 100).toFixed(1).replace(/\.0$/, "");
      if (check.status === "missing") return [text("WLL needed","Falta WLL"), ""];
      if (check.status === "overloaded") return [text("EXCEEDED · STOP","EXCEDIDO · ALTO"), text("Entered WLL is below calculated demand.","El WLL ingresado es menor que la demanda calculada.")];
      if (check.status === "critical") return [text(`CRITICAL · ${pct}% of tag — escalate`,`CRÍTICO · ${pct}% de la etiqueta — escale`), text("Little margin remains for shock load, weight error, or condition. Do not proceed on this comparison.","Queda poco margen para carga de choque, error de peso o condición. No proceda con esta comparación.")];
      if (check.status === "elevated") return [text(`ELEVATED · ${pct}% of tag`,`ELEVADO · ${pct}% de la etiqueta`), text("Confirm the load weight is verified, not estimated.","Confirme que el peso de la carga esté verificado, no estimado.")];
      return [text(`WITHIN · ${pct}% of tag`,`DENTRO · ${pct}% de la etiqueta`), ""];
    };
    panel.innerHTML = `<h3>${text("Check the whole load path","Verifique toda la ruta de carga")}</h3><p class="share-tool-intro">${text("Enter only WLL values read from the sling identification and marked hardware. This lab does not supply product ratings.","Ingrese únicamente los valores de WLL leídos en la identificación de la eslinga y en los herrajes marcados. Este laboratorio no proporciona capacidades de productos.")}</p>
      <div class="share-system-status ${data.status === "blocked" || data.status === "critical_capacity" ? "blocked" : data.status === "ready_for_review" ? "ready" : ""}" aria-live="polite"><b>${title}</b><span>${detail}</span></div>
      <fieldset class="share-thresholds"><legend>${text("Employer escalation thresholds","Umbrales de escalamiento del empleador")}</legend><label>${text("Elevated","Elevado")}<input type="number" min="1" max="94" step="1" data-threshold="elevated" value="${elevatedThreshold}"><span>%</span></label><label>${text("Critical","Crítico")}<input type="number" min="${elevatedThreshold+1}" max="100" step="1" data-threshold="critical" value="${criticalThreshold}"><span>%</span></label></fieldset>
      <div class="share-capacity-grid">${capacityKeys.map(key => `<div class="share-capacity-field"><label for="cap-${key}">${labels[key]}</label><div><input id="cap-${key}" data-capacity-key="${key}" type="number" min="0" step="100" inputmode="numeric" value="${capacities[key] ? Math.round(toDisplay(capacities[key])) : ""}" placeholder="${text("Enter WLL","Ingrese WLL")}"><span>${unit()}</span></div></div>`).join("")}</div>
      <div class="share-tool-actions"><button class="btn btn-dark" type="button" data-apply-capacity>${text("Apply tagged capacities","Aplicar capacidades de etiqueta")}</button><button class="btn utility" type="button" data-clear-capacity>${text("Clear","Borrar")}</button></div>
      <div class="share-check-list">${data.checks.map(check => { const [label,note]=rowStatus(check); return `<div class="share-capacity-check ${check.status}" aria-live="polite"><b>${labels[check.key]}</b><strong>${label}</strong><span>${text("Demand","Demanda")}: ${preciseForce(check.demand,check.wll)}${check.wll ? ` · WLL: ${preciseForce(check.wll,check.demand)} · ${text("Use","Uso")}: ${(check.utilization*100).toFixed(1).replace(/\.0$/,"")}%` : ""}${note?`<em>${note}</em>`:""}</span></div>`}).join("")}</div>`;
  }

  const assumptionLabels = () => ({
    weight:text("Load weight","Peso de la carga"),cg:text("Center of gravity","Centro de gravedad"),geometry:text("Sling geometry","Geometría de la eslinga"),rigid_load:text("Rigid load model","Modelo de carga rígida"),equal_pick_elevation:text("Pick points at equal elevation","Puntos de izaje a la misma elevación"),hook_over_cg:text("Hook directly over CG","Gancho directamente sobre el CG"),inspection:text("Condition inspection","Inspección de condición"),leftSlingWll:text("Left sling WLL","WLL de eslinga izquierda"),rightSlingWll:text("Right sling WLL","WLL de eslinga derecha"),leftHardwareWll:text("Left hardware WLL","WLL de herraje izquierdo"),rightHardwareWll:text("Right hardware WLL","WLL de herraje derecho"),topHardwareWll:text("Top hardware WLL","WLL de herraje superior"),left_share:text("Left calculated share","Porción izquierda calculada"),right_share:text("Right calculated share","Porción derecha calculada"),governing_demand:text("Governing calculated demand","Demanda calculada gobernante")
  });

  function sourceLabel(source) {
    return ({verified:text("Verified","Verificado"),estimated:text("Estimated","Estimado"),measured:text("Measured","Medido"),training_default:text("Training default","Valor de práctica"),training_assumption:text("Model assumption","Suposición del modelo"),missing:text("Missing","Faltante"),tag_entered:text("Tag entered","Etiqueta ingresada"),calculated:text("Calculated","Calculado")})[source] || source;
  }

  function renderAssumptions(data) {
    const panel = lab.querySelector("#sharePanelAssumptions");
    if (!panel) return;
    const labels = assumptionLabels();
    const ledger = core.buildAssumptions(input(), data);
    panel.innerHTML = `<h3>${text("Separate evidence from assumptions","Separe la evidencia de las suposiciones")}</h3><p class="share-tool-intro">${text("Name the source of each important input. Estimated information is a stop signal, not permission to keep calculating toward a lift.","Nombre la fuente de cada dato importante. La información estimada es una señal para detenerse, no permiso para seguir calculando hacia un izaje.")}</p>
      <div class="share-evidence-controls"><div class="share-evidence-row"><label for="evidence-weight">${text("Load weight source","Fuente del peso de la carga")}</label><select id="evidence-weight" data-evidence="weight"><option value="verified" ${evidence.weight === "verified" ? "selected" : ""}>${text("Verified document","Documento verificado")}</option><option value="estimated" ${evidence.weight === "estimated" ? "selected" : ""}>${text("Estimated only","Solo estimado")}</option></select></div>
      <div class="share-evidence-row"><label for="evidence-cg">${text("CG source","Fuente del CG")}</label><select id="evidence-cg" data-evidence="cg"><option value="verified" ${evidence.cg === "verified" ? "selected" : ""}>${text("Verified document","Documento verificado")}</option><option value="estimated" ${evidence.cg === "estimated" ? "selected" : ""}>${text("Estimated only","Solo estimado")}</option></select></div>
      <div class="share-evidence-row"><label for="evidence-geometry">${text("Geometry source","Fuente de la geometría")}</label><select id="evidence-geometry" data-evidence="geometry"><option value="measured" ${evidence.geometry === "measured" ? "selected" : ""}>${text("Measured in field","Medida en campo")}</option><option value="training" ${evidence.geometry === "training" ? "selected" : ""}>${text("Training default","Valor de práctica")}</option></select></div>
      <label class="share-evidence-check"><input type="checkbox" data-evidence-inspection ${evidence.inspectionComplete ? "checked" : ""}>${text("Component condition inspected and acceptable","Condición de los componentes inspeccionada y aceptable")}</label></div>
      <div class="share-ledger">${ledger.map(item => `<div class="share-ledger-row"><span>${labels[item.key] || item.key}</span><b class="share-source-pill ${item.source}">${sourceLabel(item.source)}</b></div>`).join("")}</div>`;
  }

  function warningText(key) {
    return ({low_angle:text("A sling angle is below 30°. Stop and obtain qualified analysis.","Un ángulo de eslinga es menor de 30°. Deténgase y obtenga análisis calificado."),weight_unverified:text("The load weight is estimated, not verified.","El peso de la carga es estimado, no verificado."),cg_unverified:text("The center of gravity is estimated, not verified.","El centro de gravedad es estimado, no verificado."),geometry_training_default:text("The displayed geometry is a training default, not a field measurement.","La geometría mostrada es un valor de práctica, no una medición de campo."),inspection_incomplete:text("Component condition has not been documented.","No se ha documentado la condición de los componentes."),capacity_missing:text("One or more sling or hardware WLL values are missing.","Falta uno o más valores WLL de eslingas o herrajes."),component_overloaded:text("At least one entered WLL is below calculated demand. Stop.","Al menos un WLL ingresado está por debajo de la demanda calculada. Deténgase.")})[key];
  }

  function renderExplain(data) {
    const panel = lab.querySelector("#sharePanelExplain");
    if (!panel) return;
    const steps = [
      text(`Start with the supported load: ${force(data.totalLoad)}.`,`Comience con la carga soportada: ${force(data.totalLoad)}.`),
      text(`Use opposite distance. Left share = ${force(data.totalLoad)} × ${number(data.geometry.rightReach)} ÷ ${number(data.span)} = ${force(data.legs.left.verticalShare)}. Right share = ${force(data.totalLoad)} × ${number(data.geometry.leftReach)} ÷ ${number(data.span)} = ${force(data.legs.right.verticalShare)}.`,`Use la distancia opuesta. Porción izquierda = ${force(data.totalLoad)} × ${number(data.geometry.rightReach)} ÷ ${number(data.span)} = ${force(data.legs.left.verticalShare)}. Porción derecha = ${force(data.totalLoad)} × ${number(data.geometry.leftReach)} ÷ ${number(data.span)} = ${force(data.legs.right.verticalShare)}.`),
      text(`Apply each leg’s measured geometry. Left: ${data.geometry.leftAngle.toFixed(1)}°, L/H ${data.geometry.leftFactor.toFixed(3)}. Right: ${data.geometry.rightAngle.toFixed(1)}°, L/H ${data.geometry.rightFactor.toFixed(3)}.`,`Aplique la geometría medida de cada ramal. Izquierdo: ${data.geometry.leftAngle.toFixed(1)}°, L/H ${data.geometry.leftFactor.toFixed(3)}. Derecho: ${data.geometry.rightAngle.toFixed(1)}°, L/H ${data.geometry.rightFactor.toFixed(3)}.`),
      text(`Calculated tension is ${force(data.legs.left.tension)} left and ${force(data.legs.right.tension)} right. Compare each demand—not an average—to identified capacity.`,`La tensión calculada es ${force(data.legs.left.tension)} a la izquierda y ${force(data.legs.right.tension)} a la derecha. Compare cada demanda —no un promedio— con la capacidad identificada.`),
      text(`Horizontal force equilibrium residual: ${force(data.equilibriumResidual)} (rounding may be visible).`,`Residual de equilibrio de fuerza horizontal: ${force(data.equilibriumResidual)} (puede verse redondeo).`)
    ];
    panel.innerHTML = `<h3>${text("Defend the decision","Defienda la decisión")}</h3><p class="share-tool-intro">${text("Follow the calculation in field order, then state what still prevents authorization.","Siga el cálculo en el orden de campo y luego indique qué impide todavía la autorización.")}</p><div class="share-explain-list">${steps.map(step => `<div class="share-explain-step">${step}</div>`).join("")}</div><div class="share-warning-list">${data.warnings.map(key => `<div class="share-warning">⚠ ${warningText(key)}</div>`).join("")}</div><div class="share-tool-actions"><button class="btn btn-dark" type="button" data-copy-analysis>${text("Copy analysis summary","Copiar resumen del análisis")}</button></div>`;
  }

  function summary(data) {
    const [status] = statusCopy(data.status);
    return [text("RIGGING 101 — LOAD SHARE ANALYSIS","RIGGING 101 — ANÁLISIS DE REPARTO DE CARGA"),`${text("Status","Estado")}: ${status}`,`${text("Load","Carga")}: ${force(data.totalLoad)}`,`CG: ${Math.round(data.cgFromLeft/data.span*100)}%`,`${text("Left demand","Demanda izquierda")}: ${force(data.legs.left.tension)} · ${data.geometry.leftAngle.toFixed(1)}°`,`${text("Right demand","Demanda derecha")}: ${force(data.legs.right.tension)} · ${data.geometry.rightAngle.toFixed(1)}°`,`${text("Governing leg","Ramal gobernante")}: ${data.governingLeg}`,`${text("Warnings","Advertencias")}: ${data.warnings.map(warningText).join(" | ") || text("None from entered inputs","Ninguna según los datos ingresados")}`,text("Training support only — not lift authorization.","Solo apoyo de capacitación — no es autorización de izaje.")].join("\n");
  }

  function render() {
    setup();
    const data = result();
    const svg = lab.querySelector("#shareSvg");
    if (svg && !svg.querySelector(".share-plan-load")) elevationMarkup = svg.innerHTML;
    if (svg && activeView === "elevation" && svg.querySelector(".share-plan-load") && elevationMarkup) svg.innerHTML = elevationMarkup;
    renderNavigation();
    renderFreshness();
    renderPlan(data);
    renderCapacity(data);
    renderAssumptions(data);
    renderExplain(data);
  }

  lab.addEventListener("input", event => {
    if (event.target.matches("#shareWeight,[data-capacity-key]")) {
      draftStale = true;
      renderFreshness();
    }
  });

  lab.addEventListener("change", event => {
    if (event.target.matches("[data-evidence]")) evidence[event.target.dataset.evidence] = event.target.value;
    if (event.target.matches("[data-evidence-inspection]")) evidence.inspectionComplete = event.target.checked;
    if (event.target.matches("[data-evidence],[data-evidence-inspection]")) {
      draftStale = false;
      appliedFingerprint = core.calculationFingerprint(input());
      render();
    }
    if (event.target.matches("[data-threshold]")) {
      const value = Number(event.target.value);
      if (event.target.dataset.threshold === "elevated") {
        elevatedThreshold = Math.max(1, Math.min(94, value || 80));
        if (criticalThreshold <= elevatedThreshold) criticalThreshold = Math.min(100, elevatedThreshold + 1);
      } else {
        criticalThreshold = Math.max(elevatedThreshold + 1, Math.min(100, value || 95));
      }
      render();
    }
  });

  lab.addEventListener("click", event => {
    const view = event.target.closest("[data-share-view]");
    const panel = event.target.closest("[data-share-panel]");
    if (view) { activeView = view.dataset.shareView; render(); return; }
    if (panel) { activePanel = panel.dataset.sharePanel; render(); return; }
    if (event.target.closest("[data-apply-capacity]")) {
      capacityKeys.forEach(key => { const value = Number(lab.querySelector(`[data-capacity-key='${key}']`)?.value); capacities[key] = value > 0 ? fromDisplay(value) : 0; });
      draftStale = false; appliedFingerprint = core.calculationFingerprint(input()); render(); return;
    }
    if (event.target.closest("[data-clear-capacity]")) {
      capacityKeys.forEach(key => capacities[key] = 0); draftStale = false; appliedFingerprint = core.calculationFingerprint(input()); render(); return;
    }
    if (event.target.closest("[data-copy-analysis]")) {
      navigator.clipboard?.writeText(summary(result()));
      const button = event.target.closest("button");
      button.textContent = text("Copied","Copiado");
      return;
    }
    if (event.target.closest("#playShareAnimation") && activeView === "plan") activeView = "elevation";
    if (event.target.closest("#applyShareWeight,[data-share-height],[data-share-preset],#resetShare")) {
      setTimeout(() => { draftStale = false; appliedFingerprint = core.calculationFingerprint(input()); render(); }, 0);
    }
  });

  lab.addEventListener("input", event => {
    if (event.target.matches("#shareCg")) setTimeout(() => { draftStale = false; appliedFingerprint = core.calculationFingerprint(input()); render(); }, 0);
  });

  document.getElementById("langToggle")?.addEventListener("click", () => setTimeout(render, 0));
  document.getElementById("unitToggle")?.addEventListener("click", () => setTimeout(render, 0));

  render();
})();
