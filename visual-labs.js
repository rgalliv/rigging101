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
    const selected=INSPECTION_CASES.find(item=>item.id===damageMode)||INSPECTION_CASES[0];
    $("#visual-inspection").innerHTML='<article class="lab-card">'+panelHead(t('Reference study','Estudio de referencia'),t('Wire rope condition library','Biblioteca de condiciones del cable'),t('Study the diagnostic features. These historical diagrams are unscored teaching references; they do not establish a disposition for an actual sling.','Estudie los rasgos diagnósticos. Estos diagramas históricos son referencias de enseñanza sin puntuación; no establecen una disposición para una eslinga real.'))+
      '<div class="inspection-layout"><div class="damage-nav"><div class="damage-list">'+INSPECTION_CASES.map(item=>'<button type="button" data-damage="'+item.id+'" aria-current="'+(item.id===selected.id)+'">'+t(item.en,item.es)+'</button>').join('')+'</div></div><div><img class="inspection-study" src="'+selected.image+'" alt="'+t(selected.altEn,selected.altEs)+'"><p class="inspection-study-note">'+t(selected.cueEn,selected.cueEs)+'</p><p>'+t('For measurements, counts and disposition decisions, use the six supplied inspection records.','Para medidas, conteos y disposiciones, use los seis registros de inspección suministrados.')+'</p><button type="button" class="btn btn-dark" id="openInspectionRecords">'+t('Practice six inspection records →','Practicar seis registros de inspección →')+'</button></div></div><div class="inspection-source">'+t('Historical IPT wire-rope inspection illustrations retained from the existing course. A generic picture cannot verify rope construction, dimensions or serviceability.','Ilustraciones históricas IPT conservadas del curso existente. Una imagen genérica no verifica construcción, dimensiones ni aptitud para servicio.')+'</div>'+boundary()+'</article>';
    $$('[data-damage]').forEach(button=>button.onclick=()=>{damageMode=button.dataset.damage;renderInspection()});
    $('#openInspectionRecords').onclick=()=>window.RiggingWorkbench.open('inspection',true);
  }

  function renderHitches() {
    const panels = [
      ["basic",t("Vertical and choker forms","Formas vertical y ahorcada"),"assets/reference/hitch-types-basic.jpg",t("A vertical hitch requires an approved lifting point. A choker cinches around the load and uses the identified choker rating; contact and choke angle still matter.","Un enganche vertical requiere un punto de izaje aprobado. Un ahorcado se ciñe alrededor de la carga y usa la capacidad de ahorcado identificada; el contacto y el ángulo de ahorcamiento siguen siendo importantes.")],
      ["controlled",t("Basket and double-wrap forms","Formas de canasta y doble vuelta"),"assets/reference/hitch-types-controlled-loads.jpg",t("Basket legs support from both sides. Double-wrap arrangements can increase contact and help contain pipe or tubing only when manufacturer data and the load-specific plan permit them.","Los ramales de canasta soportan desde ambos lados. Los arreglos de doble vuelta pueden aumentar el contacto y ayudar a contener tubos solo cuando los datos del fabricante y el plan específico de la carga lo permiten.")]
    ];
    $("#visual-hitches").innerHTML = `<article class="lab-card">${panelHead(t("Technical concept reference", "Referencia técnica conceptual"), t("Hitch comparison", "Comparación de enganches"), t("Compare the hitch forms, then make the separate control, contact, and capacity checks required for the actual load.", "Compare las formas de enganche y luego realice las verificaciones separadas de control, contacto y capacidad requeridas para la carga real."))}<div class="hitch-panels">${panels.map(([id,title,image,reason]) => `<article class="hitch-panel"><img src="${image}" alt="${id==="basic"?t("Technical diagram comparing vertical and choker hitch arrangements","Diagrama técnico que compara arreglos de enganche vertical y ahorcado"):t("Technical diagram comparing double-wrap choker, basket, and double-wrap basket arrangements around pipe","Diagrama técnico que compara arreglos de ahorcado de doble vuelta, canasta y canasta de doble vuelta alrededor de tubos")}"><div class="hitch-copy"><h4>${title}</h4><p>${reason}</p></div></article>`).join("")}</div><div class="hitch-angle"><label for="basketAngle"><b>${t("Planned basket-leg angle from horizontal", "Ángulo planificado del ramal de canasta desde la horizontal")}</b> · <output>${basketAngle}°</output></label><input id="basketAngle" type="range" min="30" max="90" value="${basketAngle}"><p>${t("The diagram does not supply capacity. As the legs flatten, tension rises. Use the identified sling rating for the exact basket configuration and angle.", "El diagrama no proporciona capacidad. A medida que los ramales se tienden, la tensión aumenta. Use la capacidad identificada de la eslinga para la configuración y el ángulo exactos de la canasta.")}</p></div>${boundary()}</article>`;
    const radians=basketAngle*Math.PI/180,L=100,scale=1.5,H=L*Math.sin(radians),reach=L*Math.cos(radians),left=200,right=500,pickY=300,topY=pickY-H*scale, tension=6000/2/Math.sin(radians);
    const graphic=document.createElement('div');graphic.className='basket-live';
    graphic.innerHTML='<svg viewBox="0 0 700 400" role="img" aria-label="'+t('Dimensioned balanced basket model','Modelo de canasta equilibrada con dimensiones')+'"><path d="M'+(left+reach*scale)+' '+topY+' L'+left+' '+pickY+' Q350 365 '+right+' '+pickY+' L'+(right-reach*scale)+' '+topY+'" fill="none" stroke="#59c5b5" stroke-width="8"/><rect x="205" y="300" width="290" height="35" rx="6" fill="#687e97"/><path d="M'+left+' '+pickY+'H'+(left+60)+' M'+right+' '+pickY+'H'+(right-60)+'" stroke="#a7b6c8" stroke-dasharray="5 5"/><g fill="#f3f7fc" font-size="23" text-anchor="middle"><text x="350" y="32">'+t('Ideal balanced basket · 6,000 lb','Canasta ideal equilibrada · 6,000 lb')+'</text><text x="110" y="185">L = 100 in</text><text x="565" y="185">H = '+H.toFixed(1)+' in</text><text x="268" y="290">'+basketAngle+'°</text><text x="432" y="290">'+basketAngle+'°</text><text x="350" y="375">'+t('Each supporting part: ','Cada parte portante: ')+Math.round(tension).toLocaleString()+' lb</text></g></svg><p>'+t('Both axes use one scale. Each free supporting part is 100 in long; H and horizontal reach change with the angle. Two compatible upper connections are shown schematically. The continuous basket must also have verified containment, contact and an applicable sling rating.','Ambos ejes usan una escala. Cada parte portante libre mide 100 pulg; H y el alcance horizontal cambian con el ángulo. Se muestran dos conexiones superiores compatibles en forma esquemática. La canasta continua requiere contención, contacto y capacidad aplicable verificados.')+'</p>';
    $('#visual-hitches .hitch-angle').prepend(graphic);
    $("#basketAngle").oninput = event => { basketAngle = Number(event.target.value); renderHitches(); };
  }

  function renderBend() {
    const d=22,D=bendRatio*d,r=D/2,centerline=r+d/2,cx=350,cy=230;
    $('#visual-bend').innerHTML='<article class="lab-card">'+panelHead(t('Measure the contact','Mida el contacto'),t('Bend diameter and sling diameter','Diámetro de apoyo y de eslinga'),t('D/d is geometry. A larger ratio alone does not establish an acceptable configuration or capacity.','D/d es geometría. Una relación mayor por sí sola no establece una configuración aceptable ni capacidad.'))+
      '<div class="bend-grid"><div class="bend-stage"><svg viewBox="0 0 700 440" role="img" aria-labelledby="bendSvgTitle bendSvgDesc"><title id="bendSvgTitle">D/d = '+bendRatio+'</title><desc id="bendSvgDesc">'+t('A round sling contacts the lower half of a circular bearing. The drawn bearing diameter divided by the drawn sling thickness equals the displayed ratio.','Una eslinga redonda contacta la mitad inferior de un apoyo circular. El diámetro dibujado dividido por el espesor de la eslinga equivale a la relación mostrada.')+'</desc><circle id="bendBearing" cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="#617287"/><path id="bendSling" d="M'+(cx+centerline)+' 75 V'+cy+' A'+centerline+' '+centerline+' 0 0 1 '+(cx-centerline)+' '+cy+' V75" fill="none" stroke="#e3c873" stroke-width="'+d+'"/><line x1="'+(cx-r)+'" y1="'+cy+'" x2="'+(cx+r)+'" y2="'+cy+'" stroke="#fff" stroke-width="2"/><line x1="'+(cx-centerline-d/2)+'" y1="120" x2="'+(cx-centerline+d/2)+'" y2="120" stroke="#fff" stroke-width="2"/><text x="350" y="220" text-anchor="middle" fill="white" font-size="20">D</text><text x="'+(cx-centerline-26)+'" y="126" fill="white" font-size="20">d</text><text x="350" y="395" text-anchor="middle" fill="#e3c873" font-size="23">D/d = '+bendRatio.toFixed(1)+'</text></svg></div><div class="bend-controls"><label for="bendRange">'+t('Bearing diameter / round sling diameter','Diámetro de apoyo / diámetro de eslinga redonda')+'</label><input id="bendRange" type="range" min="1" max="10" step=".5" value="'+bendRatio+'"><div class="metric-stack"><div class="metric"><span style="text-transform:none">D/d</span><b>'+bendRatio.toFixed(1)+'</b></div></div><p>'+t('Sling diameter d stays fixed while bearing diameter D changes. The inside surface remains in contact with the bearing. Compare the actual ratio with the exact sling and hitch manufacturer data. No acceptance threshold is supplied here.','El diámetro d permanece fijo mientras cambia D. La superficie interior permanece en contacto con el apoyo. Compare la relación real con los datos del fabricante para la eslinga y el enganche exactos. Aquí no se establece un umbral de aceptación.')+'</p><p>'+t('A sharp edge requires a separate cutting and protection check; this circular-contact model does not represent an edge radius or web-sling thickness rule.','Un borde filoso exige verificar corte y protección aparte; este modelo circular no representa una regla de radio de borde ni de espesor de faja.')+'</p></div></div>'+boundary()+'</article>';
    $('#bendRange').oninput=event=>{bendRatio=Number(event.target.value);renderBend()};
  }

  function renderPath() {
    const bad=pathMode==='misapplied',setB=governing==='B',total=10000,T=total/2/Math.sin(Math.PI/3);
    const records=[['hook',t('Hook','Gancho'),total,setB?11000:20000],['link',t('Master link','Eslabón maestro'),total,18000],['sling',t('Each sling leg','Cada ramal'),T,setB?10000:6500],['shackle',t('Each lower shackle','Cada grillete inferior'),T,8000],['load',t('Each axial attachment','Cada punto axial'),T,9000]];
    const max=records.reduce((a,b)=>a[2]/a[3]>b[2]/b[3]?a:b),active=bad?'shackle':max[0];
    $('#visual-path').innerHTML='<article class="lab-card">'+panelHead(t('Compare the entire path','Compare toda la ruta'),t('Calculated governing component','Componente gobernante calculado'),t('Fictional classroom sets: a centered 10,000 lb rigid load, two 60° legs and capacities applicable to each stated axial demand. These are not product ratings.','Conjuntos ficticios de aula: carga rígida centrada de 10,000 lb, dos ramales a 60° y capacidades aplicables a cada demanda axial indicada. No son capacidades de productos.'))+
      '<div class="path-grid"><div class="path-stage"><svg viewBox="0 0 640 470" role="img" aria-label="'+t('Governing capacity and blocked connection','Capacidad gobernante y conexión bloqueada')+'"><path d="M320 60V160L195 376M320 160L445 376" stroke="#59c5b5" stroke-width="6" fill="none"/>'+records.map(([id,label],i)=>{const x=i<2?320:i===2?257:i===3?195:320,y=[60,150,268,376,426][i];return '<g><circle cx="'+x+'" cy="'+y+'" r="'+(id==='load'?34:23)+'" fill="'+(id===active?'#c54f49':'#688299')+'"/><text x="'+(x+35)+'" y="'+(y+5)+'" fill="white" font-size="15">'+label+'</text></g>'}).join('')+(bad?'<path d="M150 376H230" stroke="#f8c662" stroke-width="9"/><text x="105" y="346" fill="#f8c662" font-size="17">'+t('Side load · no rating','Carga lateral · sin capacidad')+'</text>':'')+'</svg></div><div class="path-controls"><label for="governingSelect">'+t('Supplied capacity set','Conjunto de capacidades suministrado')+'</label><select id="governingSelect"><option value="A" '+(!setB?'selected':'')+'>'+t('Set A · lower sling capacity','Conjunto A · menor capacidad de eslingas')+'</option><option value="B" '+(setB?'selected':'')+'>'+t('Set B · lower hook capacity','Conjunto B · menor capacidad del gancho')+'</option></select><button type="button" id="pathMode">'+(bad?t('Restore specified alignment','Restablecer alineación indicada'):t('Introduce shackle side loading','Introducir carga lateral del grillete'))+'</button><div class="path-status" role="status"><b>'+(bad?t('HOLD: shackle configuration has no applicable rating','SUSPENDER: configuración del grillete sin capacidad aplicable'):t('Governing: ','Gobierna: ')+max[1]+' · '+(max[2]/max[3]*100).toFixed(1)+'%')+'</b><p>'+t('Capacity utilization compares each component’s demand with its applicable rating. A missing configuration rating prevents approval even when the remaining numeric checks are below 100%.','La utilización compara la demanda de cada componente con su capacidad aplicable. Una capacidad faltante impide aprobación aunque las demás verificaciones numéricas estén bajo 100%.')+'</p></div></div></div><div class="path-table-wrap"><table class="path-capacities"><thead><tr><th>'+t('Component','Componente')+'</th><th>'+t('Demand (lb)','Demanda (lb)')+'</th><th>'+t('Applicable capacity (lb)','Capacidad aplicable (lb)')+'</th><th>%</th></tr></thead><tbody>'+records.map(([id,label,demand,wll])=>'<tr'+(id===active?' class="governing"':'')+'><td>'+label+'</td><td>'+Math.round(demand).toLocaleString()+'</td><td>'+(bad&&id==='shackle'?t('Unverified','Sin verificar'):wll.toLocaleString())+'</td><td>'+(bad&&id==='shackle'?'—':(demand/wll*100).toFixed(1))+'</td></tr>').join('')+'</tbody></table></div>'+boundary()+'</article>';
    $('#pathMode').onclick=()=>{pathMode=bad?'balanced':'misapplied';renderPath()};
    $('#governingSelect').onchange=e=>{governing=e.target.value;renderPath()};
  }

  function renderTags() {
    const fields=[['manufacturer','Classroom supplier · fictional','Proveedor de aula · ficticio'],['id','ID: WS-17','ID: WS-17'],['material','Web sling · synthetic','Eslinga de faja · sintética'],['length','Length: 12 ft','Longitud: 12 pies'],['ratings','Vertical: 5,000 lb · Choker: 4,000 lb','Vertical: 5,000 lb · Ahorcado: 4,000 lb'],['markings','Basket: 10,000 lb only with vertical supporting parts; inclined ratings not supplied.','Canasta: 10,000 lb solo con partes portantes verticales; sin capacidades inclinadas.']];
    $('#visual-tags').innerHTML='<article class="lab-card">'+panelHead(t('Read the supplied document','Lea el documento suministrado'),t('Classroom sling identification record','Registro de identificación de eslinga de aula'),t('Read each actual field in this fictional record. It teaches document interpretation; it is not a photograph of a real tag.','Lea cada campo real de este registro ficticio. Enseña interpretación documental; no es una fotografía de una etiqueta real.'))+'<div class="classroom-tag"><b>'+t('CLASSROOM RECORD · T-17','REGISTRO DE AULA · T-17')+'</b>'+fields.map(([id,en,sp])=>'<p id="tag-field-'+id+'">'+t(en,sp)+'</p>').join('')+'</div><p>'+t('Do not infer a missing inclined-basket rating, substitute another sling’s tag, or apply the angle factor twice to an already angle-rated assembly.','No deduzca una capacidad inclinada faltante, sustituya la etiqueta por la de otra eslinga ni aplique dos veces el factor a un conjunto ya calificado por ángulo.')+'</p><button id="tagPractice" class="btn btn-dark" type="button">'+t('Practice tag selection and missing identification →','Practicar selección e identificación faltante →')+'</button>'+boundary()+'</article>';
    $('#tagPractice').onclick=()=>window.RiggingWorkbench.open('tags',true);
  }

  function renderScenarioLibrary() {
    const grid=$('#scenarioLab .scenario-grid'),call=$('#scenarioCall');if(!grid||!call)return;
    let nav=$('#scenarioLibraryNav');if(!nav){nav=document.createElement('nav');nav.id='scenarioLibraryNav';nav.className='scenario-library-nav';nav.setAttribute('role','tablist');grid.insertAdjacentElement('beforebegin',nav)}
    let packet=$('#scenarioLibraryPending');if(!packet){packet=document.createElement('div');packet.id='scenarioLibraryPending';packet.className='application-document';grid.insertAdjacentElement('beforebegin',packet)}
    const scenes=window.RiggingSkills.cases.filter(c=>c.station==='applications'),local=x=>x[es()?'es':'en'];
    nav.innerHTML='<button type="button" data-scenario-scene="shop" role="tab" aria-selected="'+(scenarioScene==='shop')+'">'+t('Shop photo study','Estudio de foto del taller')+'</button>'+scenes.map(c=>'<button type="button" role="tab" aria-selected="'+(scenarioScene===c.id)+'" data-scenario-scene="'+c.id+'">'+local(c.title)+'</button>').join('');
    const active=scenarioScene==='shop';grid.hidden=!active;call.hidden=!active;packet.hidden=active;
    if(!active){const c=scenes.find(c=>c.id===scenarioScene)||scenes[0];packet.innerHTML='<span class="lab-kicker">'+t('Fictional classroom job packet','Paquete de trabajo ficticio de aula')+'</span><h3>'+local(c.title)+'</h3><p>'+local(c.document)+'</p><button type="button" id="applicationPractice" class="btn btn-dark">'+t('Make and record the decision →','Tomar y registrar la decisión →')+'</button>';$('#applicationPractice').onclick=()=>window.RiggingWorkbench.open('applications',true)}
    $$('[data-scenario-scene]').forEach(button=>button.onclick=()=>{scenarioScene=button.dataset.scenarioScene;renderScenarioLibrary()});
  }

  function renderPanel(id) {
    ({inspection:renderInspection,hitches:renderHitches,bend:renderBend,path:renderPath,tags:renderTags}[id] || renderInspection)();
  }
  function updateProgressMap() {
    let map=$('#progressMap');if(!map){map=document.createElement('div');map.id='progressMap';map.className='progress-map';$('#readinessRecommendation')?.insertAdjacentElement('afterend',map)}
    const record=window.RiggingCourse.read('skillRecord',{}),count=station=>window.RiggingSkills.cases.filter(c=>c.station===station&&window.RiggingSkills.isMastered(record,c)).length;
    const components=Number($('#componentProgress')?.getAttribute('aria-valuenow')||0),decisions=Number($('#journeyTrack')?.getAttribute('aria-valuenow')||0);
    const items=[[t('Components explored','Componentes explorados'),components,30],[t('Decisions mastered','Decisiones dominadas'),decisions,6],[t('Inspection records demonstrated','Registros de inspección demostrados'),count('inspection'),6],[t('Application packets demonstrated','Paquetes de aplicación demostrados'),count('applications'),6]];
    map.innerHTML=items.map(([label,value,total])=>'<div class="progress-map-item"><span>'+label+'</span><b>'+value+' / '+total+'</b></div>').join('');
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
  window.addEventListener("rigging-skill-progress",updateProgressMap);
  window.addEventListener("rigging-reset",()=>{scenarioScene="shop";renderAll()});
  renderAll();
})();
