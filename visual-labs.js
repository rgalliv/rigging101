(() => {
  "use strict";
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const es = () => document.documentElement.lang.startsWith("es");
  const t = (en, spanish) => es() ? spanish : en;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  const DAMAGE = {
    wire: [
      ["broken-distributed", "Broken wires · distributed", "Alambres rotos · distribuidos"],
      ["broken-localized", "Broken wires · localized", "Alambres rotos · localizados"],
      ["birdcaging", "Birdcaging", "Enjaulamiento"], ["kinking", "Kinking", "Torcedura"],
      ["crushing", "Crushing or flattening", "Aplastamiento"], ["core", "Core protrusion", "Protusión del alma"],
      ["corrosion", "Corrosion", "Corrosión"], ["heat", "Heat damage", "Daño por calor"],
      ["end-fitting", "End-fitting damage", "Daño del terminal"], ["tag", "Missing or illegible tag", "Etiqueta ausente o ilegible"]
    ],
    synthetic: [
      ["cuts", "Cuts", "Cortes"], ["snags", "Snags", "Enganches"], ["abrasion", "Abrasion", "Abrasión"],
      ["melting", "Melting or charring", "Fusión o carbonización"], ["chemical", "Chemical attack", "Ataque químico"],
      ["knots", "Knots", "Nudos"], ["stitching", "Stitching failure", "Falla de costura"],
      ["core-yarn", "Exposed core yarn", "Hilo del alma expuesto"], ["uv", "UV degradation", "Degradación UV"],
      ["tag", "Illegible tag", "Etiqueta ilegible"]
    ],
    chain: [
      ["stretch", "Stretch or elongation", "Estiramiento o elongación"], ["gouges", "Gouges", "Muescas profundas"],
      ["nicks", "Nicks", "Melladuras"], ["cracks", "Cracks", "Grietas"],
      ["twisted", "Twisted or bent links", "Eslabones torcidos o doblados"],
      ["bearing-wear", "Wear at bearing points", "Desgaste en puntos de apoyo"], ["heat", "Heat damage", "Daño por calor"]
    ],
    hardware: [
      ["hook-throat", "Bent or opened hook throat", "Garganta del gancho doblada o abierta"],
      ["hook-latch", "Hook latch damage", "Daño del pestillo"], ["hook-twist", "Twisted hook", "Gancho torcido"],
      ["shackle-pin", "Stretched or bent shackle pin", "Perno del grillete estirado o doblado"],
      ["shackle-bow", "Worn shackle bow", "Arco del grillete desgastado"], ["mismatch", "Mismatched pin", "Perno incompatible"],
      ["master-link", "Deformed master link", "Eslabón maestro deformado"], ["threads", "Thread damage", "Daño de roscas"],
      ["markings", "Missing or illegible markings", "Marcas ausentes o ilegibles"]
    ]
  };
  const CATEGORIES = [["wire", "Wire rope slings", "Eslingas de cable de acero"], ["synthetic", "Synthetic slings", "Eslingas sintéticas"], ["chain", "Chain slings", "Eslingas de cadena"], ["hardware", "Hardware", "Herrajes"]];
  const INSPECTION_CASES = [
    {id:"crushing",en:"Crushing or flattening",es:"Aplastamiento",image:"assets/inspection/wire-crushing.png",altEn:"Reference diagram showing wire rope flattened by layer-to-layer crushing",altEs:"Diagrama de referencia que muestra cable de acero aplanado por aplastamiento entre capas",cueEn:"Compare the rope diameter and strand shape. Flattening changes the rope geometry and redistributes load through the remaining wires.",cueEs:"Compare el diámetro del cable y la forma de los torones. El aplanamiento cambia la geometría y redistribuye la carga entre los alambres restantes.",whyEn:"Crushing or flattening is a removal condition because the strands can no longer share load as designed.",whyEs:"El aplastamiento es una condición de retiro porque los torones ya no pueden compartir la carga según el diseño."},
    {id:"kinking",en:"Kinking",es:"Torcedura",image:"assets/inspection/wire-kinking.png",altEn:"Reference diagram showing three forms of permanent wire rope kinking",altEs:"Diagrama de referencia que muestra tres formas de torcedura permanente del cable de acero",cueEn:"Look for a permanent bend, loop, or dogleg. Straightening the rope does not restore equal strand loading.",cueEs:"Busque una curva, lazo o desviación permanente. Enderezar el cable no restablece el reparto uniforme entre torones.",whyEn:"A kink permanently distorts the rope and is a removal condition.",whyEs:"Una torcedura deforma permanentemente el cable y es una condición de retiro."},
    {id:"birdcaging",en:"Birdcaging",es:"Enjaulamiento",image:"assets/inspection/wire-birdcaging.png",altEn:"Reference diagram showing wire rope strands opened into a birdcage shape",altEs:"Diagrama de referencia que muestra torones abiertos en forma de jaula",cueEn:"Look for strands displaced outward from the rope body after torsional imbalance or a sudden release of tension.",cueEs:"Busque torones desplazados hacia afuera del cuerpo después de un desequilibrio torsional o una liberación súbita de tensión.",whyEn:"Birdcaging prevents the strands from carrying load in their intended position and requires removal.",whyEs:"El enjaulamiento impide que los torones soporten la carga en su posición prevista y requiere retiro."},
    {id:"core",en:"Core protrusion",es:"Protrusión del alma",image:"assets/inspection/wire-core-protrusion.png",altEn:"Reference diagram showing the wire rope core protruding through displaced strands",altEs:"Diagrama de referencia que muestra el alma sobresaliendo entre torones desplazados",cueEn:"Inspect any area where the strands spread and the core becomes visible outside the rope body.",cueEs:"Inspeccione toda zona donde los torones se separen y el alma quede visible fuera del cuerpo del cable.",whyEn:"A protruding core shows internal displacement and requires removal from service.",whyEs:"Un alma sobresaliente indica desplazamiento interno y requiere retirar el cable de servicio."},
    {id:"localized-wear",en:"Localized wear",es:"Desgaste localizado",image:"assets/inspection/wire-localized-wear.png",altEn:"Reference diagram showing a concentrated worn area on wire rope",altEs:"Diagrama de referencia que muestra una zona de desgaste concentrado en cable de acero",cueEn:"Scan the full length for a short area with visibly reduced wire section, abrasion, or displaced surface wires.",cueEs:"Revise toda la longitud para detectar una zona corta con sección reducida, abrasión o alambres superficiales desplazados.",whyEn:"Localized wear concentrates demand into less sound metal. Remove the sling when the applicable wear or diameter limit is reached or the condition creates doubt.",whyEs:"El desgaste localizado concentra la demanda en menos metal sano. Retire la eslinga cuando se alcance el límite aplicable o la condición genere duda."},
    {id:"fatigue",en:"Bending-fatigue breaks",es:"Roturas por fatiga de flexión",image:"assets/inspection/wire-bending-fatigue.png",altEn:"Reference diagram showing crown and valley wire breaks caused by bending fatigue",altEs:"Diagrama de referencia que muestra roturas en coronas y valles por fatiga de flexión",cueEn:"Look at wire crowns and valleys for square-ended breaks associated with repeated bending over sheaves.",cueEs:"Observe coronas y valles para detectar roturas de extremo cuadrado asociadas con flexión repetida sobre poleas.",whyEn:"Broken wires are counted against the limit for the exact rope or sling construction; remove it when the applicable limit is reached or a valley break indicates an abnormal condition.",whyEs:"Los alambres rotos se comparan con el límite de la construcción exacta; retire el equipo cuando se alcance el límite aplicable o una rotura en el valle indique una condición anormal."}
  ];
  const TABS = [["inspection", "Inspect", "Inspección"], ["hitches", "Hitches", "Enganches"], ["bend", "Bend protection", "Protección de doblez"], ["path", "Load path", "Ruta de carga"], ["tags", "Tags", "Etiquetas"]];
  let activeTab = "inspection", damageMode = "crushing", basketAngle = 60, bendRatio = 6, bearing = "shackle", pathMode = "balanced", governing = "sling", scenarioScene = "shop";

  function boundary() {
    return `<div class="asset-status"><b aria-hidden="true">i</b><div><b>${t("Training boundary", "Límite de capacitación")}</b><br>${t("This visual supports training. The sling identification tag, manufacturer capacity data, applicable inspection criteria, the lift plan, and qualified direction govern the actual decision.", "Este recurso visual apoya la capacitación. La etiqueta de identificación de la eslinga, los datos de capacidad del fabricante, los criterios de inspección aplicables, el plan de izaje y la dirección calificada rigen la decisión real.")}</div></div>`;
  }
  function renderChrome() {
    $("#visualLabKicker").textContent = t("Visual practice · See, decide, explain", "Práctica visual · Observe, decida, explique");
    $("#visualLabTitle").textContent = t("Field recognition lab", "Laboratorio de reconocimiento en campo");
    $("#visualLabLead").textContent = t("Practice five distinct field observations. Make the decision first, then reveal the evidence and technical detail.", "Practique cinco observaciones de campo distintas. Tome primero la decisión y luego revele la evidencia y el detalle técnico.");
    $("#visualLabBoundary").innerHTML = `<b>${t("Training boundary", "Límite de capacitación")}</b>${t("This lab supports training. It does not replace the sling identification tag, manufacturer capacity data, applicable inspection criteria, the lift plan, or qualified direction.", "Este laboratorio apoya la capacitación. No reemplaza la etiqueta de identificación de la eslinga, los datos de capacidad del fabricante, los criterios de inspección aplicables, el plan de izaje ni la dirección calificada.")}`;
    $("#visualTabs").setAttribute("aria-label", t("Visual lab topics", "Temas del laboratorio visual"));
    $("#visualTabs").innerHTML = TABS.map(([id,en,sp]) => `<button type="button" role="tab" aria-selected="${id === activeTab}" aria-controls="visual-${id}" data-visual-tab="${id}">${t(en,sp)}</button>`).join("");
    $$('[data-visual-tab]').forEach(button => button.onclick = () => selectTab(button.dataset.visualTab));
    $("#visualHandoffTitle").textContent = t("Need to calculate sling demand?", "¿Necesita calcular la demanda de la eslinga?");
    $("#visualHandoffCopy").textContent = t("Use Load Share for sling angle, center of gravity, leg loading, and geometry.", "Use Reparto de carga para el ángulo de la eslinga, el centro de gravedad, la carga por ramal y la geometría.");
    $("#visualOpenShare").textContent = t("Open Load Share Lab →", "Abrir Reparto de carga →");
  }
  function selectTab(id) {
    activeTab = id;
    $$(".visual-panel").forEach(panel => panel.classList.toggle("active", panel.id === `visual-${id}`));
    $$('[data-visual-tab]').forEach(button => button.setAttribute("aria-selected", button.dataset.visualTab === id));
    renderPanel(id);
  }
  function panelHead(kicker, title, copy) {
    return `<header class="lab-card-head"><div><div class="lab-kicker">${kicker}</div><h3>${title}</h3></div><p>${copy}</p></header>`;
  }

  function renderInspection() {
    const selected = INSPECTION_CASES.find(item => item.id === damageMode) || INSPECTION_CASES[0];
    damageMode = selected.id;
    $("#visual-inspection").innerHTML = `<article class="lab-card">${panelHead(t("Photo + verified reference", "Foto + referencia verificada"), t("Wire rope inspection challenge", "Práctica de inspección de cable de acero"), t("Compare a serviceable rope photograph with a sourced defect diagram, identify the diagnostic feature, and make the field decision.", "Compare una fotografía de cable aceptable con un diagrama de defecto respaldado, identifique el rasgo diagnóstico y tome la decisión de campo."))}
      <div class="asset-status ready"><b aria-hidden="true">✓</b><div><b>${t("Inspection challenge active", "Práctica de inspección activa")}</b><br>${t("The serviceable photograph is paired with wire-rope inspection diagrams from the project’s approved rigging reference material.", "La fotografía aceptable se combina con diagramas de inspección de cable de acero del material de referencia aprobado del proyecto.")}</div></div>
      <div class="inspection-layout"><div class="damage-nav"><label>${t("Wire rope condition", "Condición del cable de acero")}</label><div class="damage-list">${INSPECTION_CASES.map(item => `<button type="button" data-damage="${item.id}" aria-current="${item.id===damageMode}">${t(item.en,item.es)}</button>`).join("")}</div></div>
      <div class="inspection-stage"><div class="compare-frame" id="compareFrame"><div class="compare-side service"><img class="inspection-photo service-photo" src="assets/components/slingbody.webp" alt="${t("Serviceable wire rope with consistent strand shape and diameter", "Cable de acero aceptable con forma y diámetro uniformes")}"></div><div class="compare-side reject"><img class="inspection-photo defect-diagram" src="${selected.image}" alt="${t(selected.altEn,selected.altEs)}"></div><span class="compare-label left">${t("Serviceable", "Aceptable")}</span><span class="compare-label right">${t("Defect", "Defecto")}</span><i class="compare-divider" aria-hidden="true"></i></div>
      <label class="lab-kicker" for="compareRange">${t("Drag to compare", "Arrastre para comparar")}</label><input class="compare-range" id="compareRange" type="range" min="12" max="88" value="50" aria-label="${t("Comparison divider", "Divisor de comparación")}">
      <div class="inspection-tools"><button class="utility" id="inspectionAnnotate" type="button" aria-pressed="false">${t("Show diagnostic features", "Mostrar rasgos diagnósticos")}</button><button class="utility" id="inspectionZoomOut" type="button">− ${t("Zoom", "Zoom")}</button><button class="utility" id="inspectionZoomIn" type="button">+ ${t("Zoom", "Zoom")}</button></div><div class="annotation-note" id="annotationNote">${t(selected.cueEn,selected.cueEs)}</div>
      <div class="drill-card inspection-decision"><strong>${t("You find this condition during the pre-use inspection. What do you do?", "Encuentra esta condición durante la inspección previa al uso. ¿Qué hace?")}</strong><p>${t("Make the equipment decision first, then read the reason.", "Tome primero la decisión sobre el equipo y luego lea la razón.")}</p><div class="drill-actions"><button type="button" data-inspection-decision="continue">${t("Continue", "Continuar")}</button><button type="button" data-inspection-decision="remove">${t("Remove", "Retirar")}</button><button type="button" data-inspection-decision="escalate">${t("Escalate", "Escalar")}</button></div><div class="drill-feedback" id="inspectionFeedback" role="status" aria-live="polite">${t("Choose the field decision.", "Elija la decisión de campo.")}</div></div>
      </div></div><div class="inspection-source"><b>${t("Reference basis", "Base de referencia")}</b>${t("IPT Rigging, Wire Rope Inspection; project-approved Crane and Rigging Brain. Apply the sling identification, manufacturer criteria, and the exact limits for the sling construction in service.", "IPT Rigging, Inspección de cable de acero; fuente aprobada del proyecto. Aplique la identificación de la eslinga, los criterios del fabricante y los límites exactos de la construcción en servicio.")}</div>${boundary()}</article>`;
    $$('[data-damage]').forEach(button => button.onclick = () => { damageMode = button.dataset.damage; renderInspection(); });
    $("#compareRange").oninput = event => $("#compareFrame").style.setProperty("--compare", `${event.target.value}%`);
    let zoom = 1;
    $("#inspectionAnnotate").onclick = event => { const show = event.currentTarget.getAttribute("aria-pressed") !== "true"; event.currentTarget.setAttribute("aria-pressed", show); $("#annotationNote").classList.toggle("show", show); };
    const applyZoom = delta => { zoom = clamp(zoom + delta, 1, 2); $$("#compareFrame .inspection-photo").forEach(image => image.style.transform = `scale(${zoom})`); };
    $("#inspectionZoomIn").onclick = () => applyZoom(.2); $("#inspectionZoomOut").onclick = () => applyZoom(-.2);
    $$('[data-inspection-decision]').forEach(button => button.onclick = () => {
      const decision = button.dataset.inspectionDecision, feedback = $("#inspectionFeedback");
      $$('[data-inspection-decision]').forEach(option => option.classList.toggle("selected", option === button));
      feedback.className = `drill-feedback ${decision === "remove" ? "good" : "bad"}`;
      feedback.textContent = decision === "remove" ? t(`Correct — remove from service. ${selected.whyEn}`, `Correcto — retire de servicio. ${selected.whyEs}`) : decision === "continue" ? t("Do not continue. The condition changes the rope geometry or sound metal available to carry load.", "No continúe. La condición cambia la geometría o el metal sano disponible para soportar la carga.") : t("Escalation may be required by the employer’s process, but it does not return this visibly rejectable rope to service. Remove and segregate it first.", "El proceso del empleador puede exigir escalar, pero eso no devuelve este cable visiblemente rechazable al servicio. Retírelo y sepárelo primero.");
    });
  }

  function renderHitches() {
    const basketScale = clamp(Math.sin(basketAngle*Math.PI/180), .25, 1);
    const panels = [
      ["vertical","Vertical","Vertical","assets/configurations/01-vertical.webp",74,t("One leg carries the load within the tag's vertical-hitch rating.","Un ramal soporta la carga dentro de la capacidad vertical indicada en la etiqueta.")],
      ["choker","Choker","Ahorcado","assets/configurations/04-choker.webp",58,t("The choke and bearing condition use the tag's choker rating.","El ahorcamiento y el apoyo usan la capacidad de enganche ahorcado indicada en la etiqueta.")],
      ["basket","Basket","Canasta","assets/configurations/05-basket.webp",Math.round(96*basketScale),t("Two sides can share the load, but flatter legs increase demand and the tag still governs.","Dos lados pueden compartir la carga, pero los ramales más tendidos aumentan la demanda y la etiqueta sigue rigiendo.")]
    ];
    $("#visual-hitches").innerHTML = `<article class="lab-card">${panelHead(t("Same load · different configuration", "Misma carga · configuración distinta"), t("Hitch comparison", "Comparación de enganches"), t("Compare the same load at matched scale. Bar height is qualitative because the identified sling tag supplies the actual rating for each hitch.", "Compare la misma carga a escala equivalente. La altura de la barra es cualitativa porque la etiqueta identificada proporciona la capacidad real para cada enganche."))}<div class="hitch-panels">${panels.map(([id,en,sp,image,bar,reason]) => `<article class="hitch-panel"><img src="${image}" alt="${t(`${en} hitch assembly view`, `Vista del enganche ${sp.toLowerCase()}`)}"><div class="hitch-copy"><h4>${t(en,sp)}</h4><p>${reason}</p><div class="capacity-track" role="img" aria-label="${t("Qualitative tag-rated capacity comparison", "Comparación cualitativa de capacidad según etiqueta")}"><i style="--bar:${bar}%"></i></div></div></article>`).join("")}</div><div class="hitch-angle"><label for="basketAngle"><b>${t("Apply angle to the basket view", "Aplicar ángulo a la vista de canasta")}</b> · <output>${basketAngle}°</output></label><input id="basketAngle" type="range" min="30" max="90" value="${basketAngle}"><p>${t("As the basket legs flatten, the visual advantage reduces. Use the sling tag's angle-rated basket capacity for the actual configuration.", "A medida que los ramales de canasta se tienden, la ventaja visual se reduce. Use la capacidad de canasta según ángulo indicada en la etiqueta para la configuración real.")}</p></div>${boundary()}</article>`;
    $("#basketAngle").oninput = event => { basketAngle = Number(event.target.value); renderHitches(); };
  }

  function renderBend() {
    const radius = 26 + bendRatio * 12, bar = clamp((bendRatio-1)/9*100,8,100), condition = bendRatio >= 7 ? t("Generous bearing", "Apoyo amplio") : bendRatio >= 4 ? t("Verify manufacturer data", "Verifique datos del fabricante") : t("Tight bend · stop and verify", "Doblez cerrado · deténgase y verifique");
    $("#visual-bend").innerHTML = `<article class="lab-card">${panelHead(t("See the bearing surface", "Observe la superficie de apoyo"), t("Bend diameter visual", "Visual de diámetro de doblez"), t("Change the bearing diameter and see how the D ÷ d relationship changes. This is a geometry visual, not a capacity table.", "Cambie el diámetro de apoyo y observe cómo cambia la relación D ÷ d. Este es un recurso geométrico, no una tabla de capacidad."))}<div class="bend-grid"><div class="bend-stage"><svg viewBox="0 0 700 500" role="img" aria-labelledby="bendSvgTitle bendSvgDesc"><title id="bendSvgTitle">${t("Sling bending around an adjustable bearing", "Eslinga doblándose sobre un apoyo ajustable")}</title><desc id="bendSvgDesc">${t(`A sling bends around a surface with an illustrative D to d ratio of ${bendRatio}.`, `Una eslinga se dobla sobre una superficie con una relación ilustrativa D a d de ${bendRatio}.`)}</desc><circle cx="350" cy="285" r="${radius}" fill="#536176" stroke="#aeb9c8" stroke-width="5"/><path d="M90 100 Q350 ${85+radius*.25} 610 100" fill="none" stroke="#e3c873" stroke-width="22" stroke-linecap="round"/><path d="M90 100 Q350 ${250-radius} 610 100" fill="none" stroke="#28a89b" stroke-width="10" stroke-linecap="round"/><line x1="${350-radius}" y1="285" x2="${350+radius}" y2="285" stroke="#fff" stroke-width="3"/><text x="330" y="276" fill="#fff" font-size="17" font-weight="900">D</text><line x1="115" y1="88" x2="115" y2="112" stroke="#fff" stroke-width="3"/><text x="125" y="106" fill="#fff" font-size="17" font-weight="900">d</text><text x="35" y="440" fill="#e3c873" font-size="23" font-weight="900">D ÷ d = ${bendRatio.toFixed(1)}</text></svg></div><div class="bend-controls"><label for="bendRange">${t("Illustrative bearing-to-sling diameter ratio", "Relación ilustrativa entre apoyo y eslinga")}</label><input id="bendRange" type="range" min="1" max="10" step=".5" value="${bendRatio}"><div class="metric-stack"><div class="metric"><span>D ÷ d</span><b>${bendRatio.toFixed(1)}</b></div><div class="metric"><span>${t("Field reading", "Lectura de campo")}</span><b>${condition}</b></div></div><div class="tension-gauge" role="img" aria-label="${t("Qualitative bend allowance", "Margen cualitativo de doblez")}"><i style="width:${bar}%"></i></div><div class="bend-snapshots"><div><b>${t("Generous", "Amplio")}</b><i style="width:100%"></i></div><div><b>${t("Marginal", "Marginal")}</b><i style="width:58%"></i></div><div><b>${t("Severe", "Severo")}</b><i style="width:22%;background:#b54f49"></i></div></div><div class="bearing-switch">${[["shackle","Shackle bow","Arco de grillete"],["edge","Bare edge","Borde sin protección"],["hook","Hook bowl","Cama del gancho"]].map(([id,en,sp]) => `<button type="button" data-bearing="${id}" class="${id===bearing?"active":""}">${t(en,sp)}</button>`).join("")}</div><p>${bearing==="edge"?t("A bare edge adds cutting and abrasion exposure. Edge protection must be compatible and remain in place.","Un borde sin protección añade exposición a corte y abrasión. La protección debe ser compatible y permanecer en su lugar."):t("Fit, seating, surface condition, and manufacturer data still govern.","El ajuste, el asentamiento, la condición de la superficie y los datos del fabricante siguen rigiendo.")}</p></div></div>${boundary()}</article>`;
    $("#bendRange").oninput = event => { bendRatio = Number(event.target.value); renderBend(); };
    $$('[data-bearing]').forEach(button => button.onclick = () => { bearing = button.dataset.bearing; renderBend(); });
  }

  function renderPath() {
    const bad = pathMode === "misapplied", components = ["HOOK","MASTER LINK","SLING LEGS","SHACKLES","LOAD INTERFACE"], activeIndex = {hook:0,link:1,sling:2,shackle:3,load:4}[governing] ?? 2;
    $("#visual-path").innerHTML = `<article class="lab-card">${panelHead(t("Trace the force", "Siga la fuerza"), t("Load path animation", "Animación de ruta de carga"), t("Force travels through every connection. Change the configuration and watch the governing point move.", "La fuerza atraviesa cada conexión. Cambie la configuración y observe cómo se mueve el punto gobernante."))}<div class="path-grid"><div class="path-stage"><svg viewBox="0 0 700 560" role="img" aria-labelledby="pathSvgTitle pathSvgDesc"><title id="pathSvgTitle">${t("Complete rigging load path", "Ruta completa de carga del aparejo")}</title><desc id="pathSvgDesc">${t(`Force flows from the hook to the load. The ${components[activeIndex].toLowerCase()} is highlighted as governing.`, `La fuerza fluye del gancho a la carga. ${components[activeIndex].toLowerCase()} aparece como elemento gobernante.`)}</desc><path class="force-flow" d="M350 55 L350 150 L190 275 L150 410 M350 150 L510 275 L550 410" fill="none" stroke="#e3c873" stroke-width="8"/><circle cx="350" cy="55" r="32" fill="${activeIndex===0?'#b54f49':'#326cad'}"/><rect x="305" y="125" width="90" height="48" rx="22" fill="${activeIndex===1?'#b54f49':'#536176'}"/><line x1="350" y1="173" x2="190" y2="275" stroke="${activeIndex===2?'#b54f49':'#28a89b'}" stroke-width="13"/><line x1="350" y1="173" x2="510" y2="275" stroke="${activeIndex===2?'#b54f49':'#28a89b'}" stroke-width="13"/><circle cx="190" cy="290" r="27" fill="${activeIndex===3?'#b54f49':'#718096'}"/><circle cx="510" cy="290" r="27" fill="${activeIndex===3?'#b54f49':'#718096'}"/><rect x="100" y="405" width="500" height="105" rx="12" fill="${activeIndex===4?'#b54f49':'#526176'}"/><text x="350" y="545" text-anchor="middle" fill="#e3c873" font-size="18" font-weight="900">${bad?t("MISAPPLIED CONFIGURATION","CONFIGURACIÓN MAL APLICADA"):t("BALANCED ASSEMBLY","CONJUNTO EQUILIBRADO")}</text></svg></div><div class="path-controls"><button type="button" id="pathMode" class="${bad?'active':''}">${bad?t("Show balanced assembly","Mostrar conjunto equilibrado"):t("Show misapplied assembly","Mostrar conjunto mal aplicado")}</button><label for="governingSelect" class="lab-kicker">${t("Change the governing component", "Cambie el componente gobernante")}</label><select id="governingSelect">${[["hook","Hook","Gancho"],["link","Master link","Eslabón maestro"],["sling","Sling legs","Ramales"],["shackle","Shackles","Grilletes"],["load","Load interface","Interfaz de carga"]].map(([id,en,sp])=>`<option value="${id}" ${id===governing?'selected':''}>${t(en,sp)}</option>`).join("")}</select><div class="path-status"><b>${t("Governing point", "Punto gobernante")}: ${t(components[activeIndex], ["GANCHO","ESLABÓN MAESTRO","RAMALES","GRILLETES","INTERFAZ DE CARGA"][activeIndex])}</b><br>${bad?t("Side loading, point loading, or unequal effective leg length moves force away from the intended bearing surfaces.","La carga lateral, la carga puntual o la longitud efectiva desigual desplazan la fuerza fuera de las superficies de apoyo previstas."):t("A balanced picture is not capacity approval. Verify every rating, fit, direction, and condition.","Una imagen equilibrada no es aprobación de capacidad. Verifique cada capacidad, ajuste, dirección y condición.")}</div></div></div>${boundary()}</article>`;
    $("#pathMode").onclick = () => { pathMode = bad ? "balanced" : "misapplied"; renderPath(); };
    $("#governingSelect").onchange = event => { governing = event.target.value; renderPath(); };
  }

  function renderTags() {
    const fields = [["manufacturer","Manufacturer","Fabricante"],["ratings","Rated capacities by hitch","Capacidades por enganche"],["length","Length","Longitud"],["material","Material","Material"],["id","Serial or identification","Serie o identificación"],["markings","Applicable markings","Marcas aplicables"]];
    $("#visual-tags").innerHTML = `<article class="lab-card">${panelHead(t("Read before you select", "Lea antes de seleccionar"), t("Sling tag reader", "Lector de etiqueta de eslinga"), t("Find every field required to identify the sling and its rating for the planned configuration.", "Encuentre cada campo necesario para identificar la eslinga y su capacidad para la configuración planificada."))}<div class="asset-status"><b aria-hidden="true">P</b><div><b>${t("Real tag photography pending", "Fotografía real de etiquetas pendiente")}</b><br>${t("The field map is ready for wire rope, web, round, and chain sling tags plus hardware markings. Degraded variants remain locked until the commissioned photographs are approved.", "El mapa de campos está listo para etiquetas de cable de acero, faja, eslinga redonda y cadena, además de marcas de herrajes. Las variantes degradadas permanecen bloqueadas hasta aprobar las fotografías comisionadas.")}</div></div><div class="tag-grid"><div class="tag-photo-slot"><div><b>${t("Commissioned tag photograph", "Fotografía comisionada de etiqueta")}</b><p>${t("Tappable field coordinates will bind to the approved image listed in the asset manifest.", "Las coordenadas táctiles de los campos se vincularán a la imagen aprobada indicada en el manifiesto de recursos.")}</p></div></div><div><div class="tag-fields">${fields.map(([id,en,sp])=>`<button type="button" data-tag-field="${id}">${t(en,sp)}</button>`).join("")}</div><div class="tag-call" id="tagCall">${t("No legible identification means no capacity decision. Stop and obtain the governing tag or manufacturer information.", "Sin identificación legible no hay decisión de capacidad. Deténgase y obtenga la etiqueta o la información del fabricante que rige.")}</div></div></div>${boundary()}</article>`;
    $$('[data-tag-field]').forEach(button => button.onclick = () => { button.classList.toggle("active"); const found = $$('[data-tag-field].active').length; $("#tagCall").textContent = t(`${found} of ${fields.length} identification fields located. The photograph and tag-specific content must still be verified.`, `${found} de ${fields.length} campos de identificación ubicados. La fotografía y el contenido específico de la etiqueta aún deben verificarse.`); });
  }

  function renderScenarioLibrary() {
    const shell = $("#scenarioLab .scenario-shell"), grid = $("#scenarioLab .scenario-grid"), call = $("#scenarioCall");
    if (!shell || !grid || !call) return;
    let nav = $("#scenarioLibraryNav");
    if (!nav) { nav = document.createElement("nav"); nav.id = "scenarioLibraryNav"; nav.className = "scenario-library-nav"; nav.setAttribute("role","tablist"); grid.insertAdjacentElement("beforebegin",nav); }
    let pending = $("#scenarioLibraryPending");
    if (!pending) { pending = document.createElement("div"); pending.id = "scenarioLibraryPending"; pending.className = "scenario-library-pending"; grid.insertAdjacentElement("beforebegin",pending); }
    const scenes = [["shop","Shop floor","Piso de taller"],["site","Congested site","Sitio congestionado"],["yard","Outdoor yard","Patio exterior"],["clear","Clear lift","Izaje sin problemas"]];
    nav.setAttribute("aria-label",t("Evidence board scenes","Escenas del tablero de evidencia"));
    nav.innerHTML = scenes.map(([id,en,sp])=>`<button type="button" role="tab" aria-selected="${id===scenarioScene}" data-scenario-scene="${id}">${t(en,sp)}</button>`).join("");
    const active = scenarioScene === "shop";
    grid.hidden = !active; call.hidden = !active; pending.classList.toggle("show",!active);
    pending.innerHTML = `<div><b>${t("Commissioned scene pending", "Escena comisionada pendiente")}</b><p>${t("The interaction slot is ready. A real field photograph, text-equivalent evidence list, controlled facts, marker coordinates, hashed decisions, and evaluator approval are required before this scene opens.", "El espacio de interacción está listo. Se requiere una fotografía de campo real, una lista de evidencia equivalente en texto, hechos controlados, coordenadas de marcadores, decisiones cifradas y aprobación del evaluador antes de abrir esta escena.")}</p></div>`;
    $$('[data-scenario-scene]').forEach(button=>button.onclick=()=>{scenarioScene=button.dataset.scenarioScene;renderScenarioLibrary();});
  }

  function renderPanel(id) {
    ({inspection:renderInspection,hitches:renderHitches,bend:renderBend,path:renderPath,tags:renderTags}[id] || renderInspection)();
  }
  function updateProgressMap() {
    let map = $("#progressMap");
    if (!map) {
      map = document.createElement("div"); map.id = "progressMap"; map.className = "progress-map";
      $("#readinessRecommendation")?.insertAdjacentElement("afterend", map);
    }
    const components = Number($("#componentProgress")?.getAttribute("aria-valuenow") || 0), decisions = Number($("#journeyTrack")?.getAttribute("aria-valuenow") || 0), evidence = Number(($("#evidenceCount")?.textContent || "0").split("/")[0]) || 0;
    const items = [[t("Components explored","Componentes explorados"),components,30],[t("Decisions mastered","Decisiones dominadas"),decisions,6],[t("Damage modes drilled","Modos de daño practicados"),0,6],[t("Scenes cleared","Escenas resueltas"),evidence===6?1:0,4]];
    map.innerHTML = items.map(([label,value,total]) => `<div class="progress-map-item"><span>${label}</span><div class="map-pips" aria-hidden="true">${Array.from({length:6},(_,i)=>`<i class="${i<Math.round(value/total*6)?'filled':''}"></i>`).join("")}</div><b>${value>=total?t("Complete","Completo"):value?t("In progress","En progreso"):t("Not started","Sin iniciar")}</b></div>`).join("");
  }
  function renderAll() { renderChrome(); renderPanel(activeTab); renderScenarioLibrary(); updateProgressMap(); }
  const gate = $("#instructorGate"), instructor = $("#instructorDialog"), gateFeedback = $("#instructorGateFeedback"), passcode = $("#instructorPasscode");
  let instructorUnlocked = false;
  const fnv = value => { let hash=0x811c9dc5; for(let i=0;i<value.length;i++){hash^=value.charCodeAt(i);hash=Math.imul(hash,0x01000193)>>>0;} return hash.toString(16).padStart(8,"0"); };
  const passcodeMatches = async value => globalThis.crypto?.subtle ? [...new Uint8Array(await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)))].map(byte => byte.toString(16).padStart(2,"0")).join("") === "6b15e3243f092a56b586442e2f3795a5ee5ce0512d40dc6c25897ca3fede7f27" : fnv(value) === "564931ce";
  globalThis.openRiggingInstructor = () => {
    if (instructorUnlocked) { globalThis.onRiggingInstructorOpen?.(); if (!instructor.open) instructor.showModal(); return; }
    if (!gate.open) gate.showModal();
    requestAnimationFrame(() => passcode.focus());
  };
  $("#instructorUnlock")?.addEventListener("click", async () => {
    const valid = await passcodeMatches(passcode.value);
    if (!valid) { gateFeedback.textContent = t("Passcode not accepted.", "Código de acceso no aceptado."); gateFeedback.classList.add("bad"); passcode.select(); return; }
    instructorUnlocked = true; gateFeedback.classList.remove("bad"); gate.close(); globalThis.onRiggingInstructorOpen?.(); instructor.showModal(); passcode.value = "";
  });
  $("#instructorGateClose")?.addEventListener("click", () => gate.close());
  passcode?.addEventListener("keydown", event => { if (event.key === "Enter") { event.preventDefault(); $("#instructorUnlock")?.click(); } });
  if (new URLSearchParams(location.search).get("instructor") === "1") requestAnimationFrame(globalThis.openRiggingInstructor);
  $("#visualOpenShare")?.addEventListener("click", () => $('[data-tool-tab="share"]')?.click());
  $("#langToggle")?.addEventListener("click", () => setTimeout(renderAll, 0));
  const observer = new MutationObserver(updateProgressMap); [$("#componentProgress"),$("#journeyTrack"),$("#evidenceCount")].filter(Boolean).forEach(node=>observer.observe(node,{attributes:true,childList:true,subtree:true}));
  renderAll();
})();
