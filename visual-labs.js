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
    $("#visual-inspection").innerHTML = `<article class="lab-card">${panelHead(t("Photo + verified reference", "Foto + referencia verificada"), t("Wire rope teaching gallery", "Galería didáctica de cable de acero"), t("Study these labeled examples, then complete the separate inspection cases with varied evidence and dispositions.", "Estudie estos ejemplos identificados y luego complete los casos separados con evidencia y disposiciones variadas."))}
      <div class="asset-status ready"><b aria-hidden="true">✓</b><div><b>${t("Inspection challenge active", "Práctica de inspección activa")}</b><br>${t("The serviceable photograph is paired with wire-rope inspection diagrams from the project’s approved rigging reference material.", "La fotografía aceptable se combina con diagramas de inspección de cable de acero del material de referencia aprobado del proyecto.")}</div></div>
      <div class="inspection-layout"><div class="damage-nav"><label>${t("Wire rope condition", "Condición del cable de acero")}</label><div class="damage-list">${INSPECTION_CASES.map(item => `<button type="button" data-damage="${item.id}" aria-current="${item.id===damageMode}">${t(item.en,item.es)}</button>`).join("")}</div></div>
      <div class="inspection-stage"><div class="compare-frame" id="compareFrame"><div class="compare-side service"><img class="inspection-photo service-photo" src="assets/components/slingbody.webp" alt="${t("Serviceable wire rope with consistent strand shape and diameter", "Cable de acero aceptable con forma y diámetro uniformes")}"></div><div class="compare-side reject"><img class="inspection-photo defect-diagram" src="${selected.image}" alt="${t(selected.altEn,selected.altEs)}"></div><span class="compare-label left">${t("Serviceable", "Aceptable")}</span><span class="compare-label right">${t("Defect", "Defecto")}</span><i class="compare-divider" aria-hidden="true"></i></div>
      <label class="lab-kicker" for="compareRange">${t("Drag to compare", "Arrastre para comparar")}</label><input class="compare-range" id="compareRange" type="range" min="12" max="88" value="50" aria-label="${t("Comparison divider", "Divisor de comparación")}">
      <div class="inspection-tools"><button class="utility" id="inspectionAnnotate" type="button" aria-pressed="false">${t("Show diagnostic features", "Mostrar rasgos diagnósticos")}</button><button class="utility" id="inspectionZoomOut" type="button">− ${t("Zoom", "Zoom")}</button><button class="utility" id="inspectionZoomIn" type="button">+ ${t("Zoom", "Zoom")}</button></div><div class="annotation-note" id="annotationNote">${t(selected.cueEn,selected.cueEs)}</div>
      <div class="drill-card inspection-decision"><strong>${t("You find this condition during the pre-use inspection. What do you do?", "Encuentra esta condición durante la inspección previa al uso. ¿Qué hace?")}</strong><p>${t("Unscored teaching example. Complete the required station to demonstrate independent inspection decisions.", "Ejemplo didáctico sin puntuación. Complete la estación obligatoria para demostrar decisiones independientes.")}</p><div class="drill-actions"><button type="button" data-inspection-decision="continue">${t("Continue", "Continuar")}</button><button type="button" data-inspection-decision="remove">${t("Remove", "Retirar")}</button><button type="button" data-inspection-decision="escalate">${t("Escalate", "Escalar")}</button></div><div class="drill-feedback" id="inspectionFeedback" role="status" aria-live="polite">${t("Choose the field decision.", "Elija la decisión de campo.")}</div></div>
      </div></div><div class="inspection-source"><b>${t("Reference basis", "Base de referencia")}</b>${t("IPT Rigging, Wire Rope Inspection; project-approved Crane and Rigging Brain. Apply the sling identification, manufacturer criteria, and the exact limits for the sling construction in service.", "IPT Rigging, Inspección de cable de acero; fuente aprobada del proyecto. Aplique la identificación de la eslinga, los criterios del fabricante y los límites exactos de la construcción en servicio.")}</div>${boundary()}</article>`;
    $$('[data-damage]').forEach(button => button.onclick = () => { damageMode = button.dataset.damage; renderInspection(); });
    $("#compareRange").oninput = event => $("#compareFrame").style.setProperty("--compare", `${event.target.value}%`);
    let zoom = 1;
    const practiceLink=document.createElement("button");practiceLink.type="button";practiceLink.className="utility";
    practiceLink.textContent=t("Apply the criteria: six inspection cases →","Aplique criterios: seis casos de inspección →");
    practiceLink.onclick=()=>window.RiggingPractice.open("inspection");$("#visual-inspection .lab-card").appendChild(practiceLink);
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
    const panels = [
      ["basic",t("Vertical and choker forms","Formas vertical y ahorcada"),"assets/reference/hitch-types-basic.jpg",t("A vertical hitch requires an approved lifting point. A choker cinches around the load and uses the identified choker rating; contact and choke angle still matter.","Un enganche vertical requiere un punto de izaje aprobado. Un ahorcado se ciñe alrededor de la carga y usa la capacidad de ahorcado identificada; el contacto y el ángulo de ahorcamiento siguen siendo importantes.")],
      ["controlled",t("Basket and double-wrap forms","Formas de canasta y doble vuelta"),"assets/reference/hitch-types-controlled-loads.jpg",t("Basket legs support from both sides. Double-wrap arrangements can increase contact and help contain pipe or tubing only when manufacturer data and the load-specific plan permit them.","Los ramales de canasta soportan desde ambos lados. Los arreglos de doble vuelta pueden aumentar el contacto y ayudar a contener tubos solo cuando los datos del fabricante y el plan específico de la carga lo permiten.")]
    ];
    $("#visual-hitches").innerHTML = `<article class="lab-card">${panelHead(t("Technical concept reference", "Referencia técnica conceptual"), t("Hitch comparison", "Comparación de enganches"), t("Compare the hitch forms, then make the separate control, contact, and capacity checks required for the actual load.", "Compare las formas de enganche y luego realice las verificaciones separadas de control, contacto y capacidad requeridas para la carga real."))}<div class="hitch-panels">${panels.map(([id,title,image,reason]) => `<article class="hitch-panel"><img src="${image}" alt="${id==="basic"?t("Technical diagram comparing vertical and choker hitch arrangements","Diagrama técnico que compara arreglos de enganche vertical y ahorcado"):t("Technical diagram comparing double-wrap choker, basket, and double-wrap basket arrangements around pipe","Diagrama técnico que compara arreglos de ahorcado de doble vuelta, canasta y canasta de doble vuelta alrededor de tubos")}"><div class="hitch-copy"><h4>${title}</h4><p>${reason}</p></div></article>`).join("")}</div><div class="hitch-angle"><label for="basketAngle"><b>${t("Planned basket-leg angle from horizontal", "Ángulo planificado del ramal de canasta desde la horizontal")}</b> · <output>${basketAngle}°</output></label><input id="basketAngle" type="range" min="30" max="90" value="${basketAngle}"><p>${t("The diagram does not supply capacity. As the legs flatten, tension rises. Use the identified sling rating for the exact basket configuration and angle.", "El diagrama no proporciona capacidad. A medida que los ramales se tienden, la tensión aumenta. Use la capacidad identificada de la eslinga para la configuración y el ángulo exactos de la canasta.")}</p></div>${boundary()}</article>`;
    const theta=basketAngle*Math.PI/180,rise=120,reach=rise/Math.tan(theta),tension=5000/Math.sin(theta);
    const visual=document.createElement("div");visual.className="hitch-math";
    visual.innerHTML=`<svg viewBox="0 0 700 330" role="img" aria-label="${t("Symmetric basket angle and tension, geometry to scale","Ángulo y tensión de canasta simétrica, a escala")}"><rect x="${350-reach-10}" y="250" width="${Math.max(20,2*reach+20)}" height="30" fill="#456383"/><path d="M${350-reach} 250 L350 130 L${350+reach} 250" fill="none" stroke="#356cae" stroke-width="7"/><line x1="110" y1="250" x2="590" y2="250" stroke="#8b9db0" stroke-dasharray="5 5"/><text x="350" y="48" text-anchor="middle" fill="#12345b" font-size="19">${basketAngle}° · ${t("from horizontal","desde horizontal")}</text><text x="350" y="315" text-anchor="middle" fill="#12345b" font-size="17">${t("Ideal 10,000 lb load; each side:","Carga ideal 10,000 lb; cada lado:")} ${Math.round(tension).toLocaleString()} lb</text></svg><p>${t("Force illustration: symmetric basket, static load, no friction effects, rigging self-weight omitted. The capacity of the actual basket still comes from its identified configuration rating. The drawings above show hitch concepts.","Ilustración de fuerzas: canasta simétrica, carga estática, sin efectos de fricción, peso del aparejo omitido. La capacidad real sigue proviniendo de su configuración identificada. Los dibujos superiores muestran conceptos de enganche.")}</p>`;
    $("#visual-hitches .hitch-angle").appendChild(visual);
    $("#basketAngle").oninput = event => { basketAngle = Number(event.target.value); renderHitches(); };
  }

  function renderBend() {
    const d=12,D=bendRatio*d,R=D/2,r=R+d/2;
    $("#visual-bend").innerHTML=`<article class="lab-card">${panelHead(t("Measure the actual contact","Mida el contacto real"),t("Bend diameter: geometry first","Diámetro de doblez: primero geometría"),t("The drawing uses one scale. D is the bearing diameter; d is the nominal sling diameter. No universal acceptance threshold is assigned.","El dibujo usa una escala. D es diámetro de apoyo; d es diámetro nominal de eslinga. No se asigna límite universal de aceptación."))}<div class="bend-grid"><div class="bend-stage"><svg viewBox="0 0 700 420" role="img" aria-label="${t("Bearing and sling diameter to scale","Diámetro de apoyo y eslinga a escala")}"><circle cx="350" cy="240" r="${R}" fill="#536176" stroke="#aeb9c8"/><path d="M${350-r} 100 V240 A${r} ${r} 0 0 0 ${350+r} 240 V100" fill="none" stroke="#e3c873" stroke-width="${d}"/><line x1="${350-R}" y1="240" x2="${350+R}" y2="240" stroke="white"/><text x="350" y="226" fill="white" text-anchor="middle" font-size="18">D</text><line x1="${350-r-d/2}" y1="130" x2="${350-r+d/2}" y2="130" stroke="white"/><text x="${350-r-27}" y="136" fill="white" font-size="18">d</text><text x="350" y="355" text-anchor="middle" fill="#e3c873" font-size="24">D / d = ${bendRatio.toFixed(1)}</text></svg></div><div class="bend-controls"><label for="bendRange">${t("Explore D/d (geometry only)","Explore D/d (solo geometría)")}</label><input id="bendRange" type="range" min="1" max="25" step=".5" value="${bendRatio}"><p>${t("Example measurement: D = 6 in and d = 0.5 in gives D/d = 12. Confirm which bearing dimension the manufacturer's instructions define for the actual connection.","Ejemplo: D = 6 pulg y d = 0.5 pulg da D/d = 12. Confirme la dimensión de apoyo definida por el fabricante para la conexión real.")}</p><p>${t("Select sling construction and the exact contact arrangement before consulting the applicable rating or minimum bend requirement. A larger ratio does not eliminate cutting, poor seating or side loading.","Identifique construcción y contacto exactos antes de consultar capacidad o doblez mínimo. Una relación mayor no elimina corte, mal asiento ni carga lateral.")}</p><div class="bearing-switch">${[["shackle","Shackle bow","Arco de grillete"],["edge","Bare edge","Borde sin protección"],["hook","Hook bowl","Cama del gancho"]].map(([id,en,sp])=>`<button type="button" data-bearing="${id}" aria-pressed="${id===bearing}">${t(en,sp)}</button>`).join("")}</div><p>${bearing==="edge"?t("An edge is a separate cutting hazard. The round-bearing drawing cannot establish edge protection adequacy.","Un borde es un peligro de corte separado. El dibujo de apoyo redondo no establece protección adecuada."):t("Verify actual seating and contact shape using the identified component instructions.","Verifique asiento y forma de contacto reales con instrucciones del componente.")}</p></div></div>${boundary()}</article>`;
    $("#bendRange").oninput=e=>{bendRatio=Number(e.target.value);renderBend();$("#bendRange").focus({preventScroll:true});};
    $$('[data-bearing]').forEach(b=>b.onclick=()=>{bearing=b.dataset.bearing;renderBend();});
  }

  function renderPath() {
    const bad=pathMode==="misapplied";
    const profiles={sling:[12000,12000,6000,8000,8000],hook:[9000,12000,8000,8000,8000],link:[12000,9000,8000,8000,8000],shackle:[12000,12000,8000,6000,8000],load:[12000,12000,8000,8000,6000]};
    const demands=[10000,10000,10000/2/Math.sin(Math.PI/3),10000/2/Math.sin(Math.PI/3),10000/2/Math.sin(Math.PI/3)],ratings=profiles[governing]||profiles.sling,uses=demands.map((n,i)=>n/ratings[i]);
    const names=[t("Hook","Gancho"),t("Master link","Eslabón maestro"),t("Each sling","Cada eslinga"),t("Each lower shackle","Cada grillete inferior"),t("Each load interface","Cada interfaz de carga")],idx=uses.indexOf(Math.max(...uses));
    $("#visual-path").innerHTML=`<article class="lab-card">${panelHead(t("Compute the controlling comparison","Calcule la comparación determinante"),t("Trace the complete load path","Recorra toda la ruta de carga"),t("Choose a fictional equipment set. The highest demand/WLL ratio determines the numerical governing component; misapplication is a separate stop condition.","Elija conjunto ficticio. La mayor relación demanda/WLL determina componente numérico gobernante; una mala aplicación es condición de parada separada."))}<div class="path-grid"><div class="path-stage"><svg viewBox="0 0 700 470" role="img" aria-label="${bad?t("Connector drawn off the hook bowl: stop for misapplication","Conector fuera de cama de gancho: detener por mala aplicación"):t("Seated connection and complete force path","Conexión asentada y ruta completa")}"><path d="M350 30 V70 C350 125 430 120 405 75" stroke="#90abc5" stroke-width="14" fill="none"/><ellipse cx="${bad?408:368}" cy="${bad?73:110}" rx="23" ry="34" stroke="${bad?'#ed7663':'#e3c873'}" stroke-width="8" fill="none"/><path d="M${bad?408:368} ${bad?107:144} L150 340 M${bad?408:368} ${bad?107:144} L570 340" stroke="#7fd1c2" stroke-width="7"/><rect x="125" y="360" width="470" height="40" fill="#456383"/><circle cx="150" cy="340" r="15" stroke="#e3c873" stroke-width="5" fill="none"/><circle cx="570" cy="340" r="15" stroke="#e3c873" stroke-width="5" fill="none"/><text x="350" y="445" text-anchor="middle" fill="white" font-size="17">${bad?t("STOP: connector on hook tip","ALTO: conector en punta del gancho"):t("Concept diagram • forces use 60° symmetric model","Concepto • fuerzas del modelo simétrico a 60°")}</text></svg></div><div class="path-controls"><label for="governingSelect">${t("Fictional component rating set","Conjunto ficticio de capacidades")}</label><select id="governingSelect">${[["sling","Set A","Conjunto A"],["hook","Set B","Conjunto B"],["link","Set C","Conjunto C"],["shackle","Set D","Conjunto D"],["load","Set E","Conjunto E"]].map(([id,en,sp])=>`<option value="${id}" ${id===governing?'selected':''}>${t(en,sp)}</option>`).join("")}</select><button type="button" id="pathMode">${bad?t("Restore seated connection","Restaurar conexión asentada"):t("Move connector to hook tip","Mover conector a punta")}</button><div class="path-status"><b>${bad?t("STOP — invalid application","ALTO — aplicación inválida"):t("Numerical governing component","Componente numérico gobernante")}: ${bad?t("Hook tip loading","Carga en punta"):names[idx]}</b><p>${t("Exercise load 10,000 lb; two equal legs at 60°. All ratings below are fictional applicable ratings for the seated configuration. The tip-loaded picture is outside that model.","Carga del ejercicio 10,000 lb; dos ramales iguales a 60°. Capacidades ficticias aplicables a configuración asentada. La carga en punta queda fuera del modelo.")}</p></div></div></div><div class="practice-table-wrap"><table><thead><tr><th>${t("Component","Componente")}</th><th>${t("Demand (lb)","Demanda (lb)")}</th><th>WLL (lb)</th><th>${t("Utilization","Utilización")}</th></tr></thead><tbody>${names.map((name,i)=>`<tr><td>${name}</td><td>${Math.round(demands[i]).toLocaleString()}</td><td>${ratings[i].toLocaleString()}</td><td>${bad?'—':(uses[i]*100).toFixed(1)+'%'}</td></tr>`).join("")}</tbody></table></div>${boundary()}</article>`;
    $("#pathMode").onclick=()=>{pathMode=bad?"balanced":"misapplied";renderPath();};$("#governingSelect").onchange=e=>{governing=e.target.value;renderPath();};
  }

  function renderTags() {
    $("#visual-tags").innerHTML=`<article class="lab-card">${panelHead(t("Read the actual fields","Lea los campos"),t("Sling tag reader","Lector de etiqueta"),t("Use this readable classroom tag to practice identification and rating selection. Its fictional values must never be used to identify field equipment.","Use esta etiqueta legible del aula para practicar identificación y capacidad. Sus valores ficticios nunca deben identificar equipo real."))}${window.RiggingPractice.tagDocument()}<button type="button" class="utility" id="tagPractice">${t("Read, calculate and defend the tag decision →","Lea, calcule y defienda la decisión →")}</button>${boundary()}</article>`;
    $("#tagPractice").onclick=()=>window.RiggingPractice.open("tags");
  }

  function renderScenarioLibrary() {
    const grid=$("#scenarioLab .scenario-grid");if(!grid)return;
    let nav=$("#scenarioLibraryNav");if(!nav){nav=document.createElement("div");nav.id="scenarioLibraryNav";nav.className="scenario-library-nav";grid.insertAdjacentElement("beforebegin",nav);}
    nav.innerHTML=`<button type="button" id="scenarioJobPackets">${t("Apply your skills: six complete job packets →","Aplique sus habilidades: seis paquetes completos →")}</button>`;
    $("#scenarioJobPackets").onclick=()=>window.RiggingPractice.open("application");
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
    const record=window.RiggingPractice?.record(),inspectionDone=Object.keys(record?.passed||{}).filter(id=>id.startsWith("inspect-")).length,jobsDone=Object.keys(record?.passed||{}).filter(id=>id.startsWith("job-")).length;
    const items = [[t("Components explored","Componentes explorados"),components,30],[t("Decisions mastered","Decisiones dominadas"),decisions,6],[t("Inspection cases demonstrated","Casos de inspección demostrados"),inspectionDone,6],[t("Job packets defended","Paquetes defendidos"),jobsDone,6]];
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
