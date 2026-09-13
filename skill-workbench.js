(() => {
  'use strict';
  const course=window.RiggingCourse, skills=window.RiggingSkills;
  const host=document.getElementById('skillWorkbench');
  if(!course||!skills||!host) return;
  let station='weight';
  const language=()=>document.documentElement.lang.startsWith('es')?'es':'en';
  const t=(en,es)=>language()==='es'?es:en;
  const local=value=>value[language()];
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const record=()=>course.read('skillRecord',{});
  function save(id, update) {
    const next={...record()}, previous=next[id]||{};
    next[id]={version:skills.VERSION,draft:{},attempts:[],...previous,...update};
    course.write('skillRecord',next);
    course.updateProgress();
    updateCounts();
    window.dispatchEvent(new Event('rigging-skill-progress'));
  }
  function updateCounts() {
    const p=skills.progress(record());
    host.querySelector('#skillCount').textContent=t(`${p.mastered} of ${p.total} evidence checks demonstrated`,`${p.mastered} de ${p.total} verificaciones demostradas`);
    host.querySelectorAll('[data-station]').forEach(button=>{
      const items=skills.cases.filter(c=>c.station===button.dataset.station);
      button.querySelector('small').textContent=`${items.filter(c=>skills.isMastered(record(),c)).length}/${items.length}`;
    });
    const next=host.querySelector('#skillNext');
    next.textContent=p.complete?t('Open final knowledge check →','Abrir evaluación final →'):t('Continue to unfinished practice →','Continuar con práctica pendiente →');
  }
  function feedback(item) {
    const row=record()[item.id], last=row?.attempts?.at(-1);
    if(!last) return '';
    if(JSON.stringify(last.values)!==JSON.stringify(row.draft)) return `<p>${t('Answers changed. Check this record again.','Respuestas cambiadas. Verifique este registro de nuevo.')}</p>`;
    if(last.correct) return `<p class="skill-success">${t('Demonstrated for this classroom record.','Demostrado para este registro de aula.')} ${last.coached?t('Worked example used; coaching is recorded.','Ejemplo resuelto usado; apoyo registrado.'):t('Independent attempt recorded.','Intento independiente registrado.')}</p>`;
    const results=skills.grade(item,row.draft);
    return `<p>${t('Review these steps, then submit another attempt:','Revise estos pasos y envíe otro intento:')}</p><ul>${results.fields.filter(f=>!f.correct).map(f=>`<li><b>${esc(local(item.fields.find(field=>field.id===f.id).label))}:</b> ${esc(local(f.hint))}</li>`).join('')}</ul>`;
  }
  function diagram() {
    return `<figure class="skill-diagram"><svg viewBox="0 0 640 350" role="img" aria-labelledby="spreaderTitle spreaderDesc"><title id="spreaderTitle">${t('Conceptual spreader force system','Sistema conceptual de fuerzas del separador')}</title><desc id="spreaderDesc">${t('Symmetric upper slings at 45 degrees from horizontal, 120 inch span. Vertical lower legs carry the payload; the upper rigging also carries the beam. The beam is in compression.','Eslingas superiores simétricas a 45 grados de la horizontal, separación de 120 pulgadas. Ramales inferiores verticales soportan la carga útil; los superiores también soportan la viga. La viga está en compresión.')}</desc><defs><marker id="forceArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#d7b95a"/></marker></defs><path d="M150 215L320 45L490 215" fill="none" stroke="#59c5b5" stroke-width="6"/><path d="M150 215V285M490 215V285" stroke="#59c5b5" stroke-width="6"/><rect x="132" y="207" width="376" height="17" rx="4" fill="#d7b95a"/><rect x="125" y="284" width="390" height="34" rx="5" fill="#516b89"/><path d="M205 240H290M435 240H350" stroke="#d7b95a" stroke-width="3" marker-end="url(#forceArrow)"/><g fill="currentColor" font-size="22" text-anchor="middle"><text x="320" y="22">${t('Hook · payload + beam','Gancho · carga + viga')}</text><text x="180" y="198">45°</text><text x="460" y="198">45°</text><text x="320" y="273">120 ${t('in · span','pulg · separación')}</text><text x="320" y="308">9,000 lb</text><text x="320" y="195">${t('Beam: 600 lb','Viga: 600 lb')}</text></g></svg><figcaption>${t('Conceptual force diagram. Equal scale on both axes; connections are schematic. Compression is not a structural rating.','Diagrama conceptual de fuerzas. Misma escala en ambos ejes; conexiones esquemáticas. La compresión no es una capacidad estructural.')}</figcaption></figure>`;
  }
  function render() {
    const current=skills.stations.find(s=>s.id===station)||skills.stations[0];
    const items=skills.cases.filter(c=>c.station===current.id);
    host.innerHTML=`<header class="skill-heading"><p class="kicker">${t('Required practice','Práctica obligatoria')}</p><h2>${t('Make the calculation. Defend the decision.','Calcule. Defienda la decisión.')}</h2><p>${t('Seven stations connect the six course steps to decisions you can demonstrate. Complete all 22 checks and the final knowledge check. Numeric answers use the stated units; round forces to the nearest pound and lengths to one decimal place.','Siete estaciones conectan los seis pasos del curso con decisiones demostrables. Complete las 22 verificaciones y la evaluación final. Use las unidades indicadas; redondee fuerzas a libras enteras y longitudes a un decimal.')}</p><strong id="skillCount" role="status"></strong></header>
      <nav class="skill-stations" aria-label="${t('Practice stations','Estaciones de práctica')}">${skills.stations.map(s=>`<button type="button" data-station="${s.id}" aria-current="${s.id===station?'step':'false'}">${esc(local(s.title))}<small></small></button>`).join('')}</nav>
      <div class="skill-body"><h3 tabindex="-1" id="skillStationTitle">${esc(local(current.title))}</h3><p class="skill-boundary">${t('Fictional classroom documents and measurements. They are not equipment tags, inspection evidence, product ratings or permission to lift. Use the actual manufacturer instructions and authorized plan in the field.','Documentos y medidas ficticios de aula. No son etiquetas de equipo, evidencia de inspección, capacidades de productos ni permiso de izaje. En campo use las instrucciones reales del fabricante y el plan autorizado.')}</p>
      <details class="skill-worked" id="skillWorked"><summary>${t('Review a worked example with different values','Repasar un ejemplo resuelto con valores diferentes')}</summary><p>${esc(local(current.worked))}</p></details>
      ${station==='spreader'?'<div id="spreaderExplore"></div>'+diagram():''}
      ${items.map(item=>{const row=record()[item.id]||{},done=skills.isMastered(record(),item);return `<article class="skill-case" data-case="${item.id}"><header><span class="skill-case-status">${done?t('Demonstrated','Demostrado'):t('Independent check','Verificación independiente')}</span><h4>${esc(local(item.title))}</h4></header><div class="skill-document">${esc(local(item.document))}</div><form data-skill-form="${item.id}" novalidate><div class="skill-fields">${item.fields.map(field=>`<label for="${item.id}-${field.id}">${esc(local(field.label))}${field.options?`<select name="${field.id}" id="${item.id}-${field.id}" required><option value="">${t('Select a decision','Seleccione una decisión')}</option>${field.options.map(o=>`<option value="${o.value}" ${row.draft?.[field.id]===o.value?'selected':''}>${esc(local(o.label))}</option>`).join('')}</select>`:`<input name="${field.id}" id="${item.id}-${field.id}" type="number" step="any" inputmode="decimal" required value="${esc(row.draft?.[field.id]??'')}" autocomplete="off">`}</label>`).join('')}</div><button class="btn btn-dark" type="submit">${t('Check my evidence','Verificar mi evidencia')}</button><div class="skill-feedback" role="status" aria-live="polite">${feedback(item)}</div><small class="skill-attempt-count">${t('Recorded attempts','Intentos registrados')}: ${row.attempts?.length||0}</small></form></article>`}).join('')}
      <button class="btn btn-gold" id="skillNext" type="button"></button>
      <details class="skill-sources"><summary>${t('Source boundaries and field verification','Fuentes y verificación de campo')}</summary><p>${t('The arithmetic uses static equilibrium for the stated ideal geometry. OSHA construction rigging rules establish inspection, identification and rated-load duties; equipment-specific manufacturer instructions establish configuration and removal details. Fictional limits in these packets apply only to their exercise.','La aritmética usa equilibrio estático para la geometría ideal indicada. Las reglas de OSHA para construcción establecen deberes de inspección, identificación y carga nominal; las instrucciones del fabricante del equipo establecen configuración y retiro. Los límites ficticios de estos paquetes solo aplican al ejercicio.')}</p><ul><li><a href="https://www.osha.gov/laws-regs/regulations/standardnumber/1926/1926.251" target="_blank" rel="noopener">OSHA 1926.251</a></li><li><a href="https://www.thecrosbygroup.com/wp-content/uploads/catalog/2016/en-US/473.pdf" target="_blank" rel="noopener">Crosby · sling tensions and support shares (historical catalog)</a></li><li><a href="https://www.modulift.com/2023/07/04/how-to-safely-assemble-a-spreader-beam/" target="_blank" rel="noopener">Modulift · assembly and configuration instructions</a></li></ul><p>${t('This device-local record describes classroom practice. Employer field performance verification remains required.','Este registro local describe práctica de aula. Sigue siendo necesaria la verificación del desempeño de campo por el empleador.')}</p></details></div>`;
    if(station==='spreader') window.RiggingSpreader.render();
    updateCounts();
    host.querySelectorAll('[data-station]').forEach(button=>button.onclick=()=>open(button.dataset.station,true));
    host.querySelector('#skillWorked').addEventListener('toggle',event=>{
      if(event.target.open) items.forEach(item=>save(item.id,{coached:true}));
    });
    host.querySelectorAll('form').forEach(form=>{
      const id=form.dataset.skillForm, item=skills.cases.find(c=>c.id===id);
      const values=()=>Object.fromEntries(new FormData(form));
      form.addEventListener('input',()=>{
        save(id,{draft:values()});
        form.querySelector('.skill-feedback').innerHTML=feedback(item);
        form.closest('article').querySelector('.skill-case-status').textContent=t('Check edited answers','Verifique las respuestas editadas');
      });
      form.addEventListener('submit',event=>{
        event.preventDefault();
        const draft=values(), row=record()[id]||{}, result=skills.grade(item,draft);
        const attempt={at:new Date().toISOString(),values:draft,correct:result.correct,coached:Boolean(row.coached),attempt:(row.attempts?.length||0)+1};
        save(id,{draft,attempts:[...(row.attempts||[]),attempt]});
        form.querySelector('.skill-feedback').innerHTML=feedback(item);
        form.querySelector('.skill-attempt-count').textContent=t(`Recorded attempts: ${attempt.attempt}`,`Intentos registrados: ${attempt.attempt}`);
        form.closest('article').querySelector('.skill-case-status').textContent=result.correct?t('Demonstrated','Demostrado'):t('Needs practice','Necesita práctica');
      });
    });
    host.querySelector('#skillNext').onclick=()=>{
      const missing=skills.cases.find(item=>!skills.isMastered(record(),item));
      if(missing) open(missing.station,true); else course.openTool('mastery');
    };
  }
  function open(id,focus=false) {
    station=skills.stations.some(s=>s.id===id)?id:station;
    render();
    if(document.body.dataset.tool!=='skills') course.openTool('skills');
    if(focus) host.querySelector('#skillStationTitle').focus();
  }
  window.RiggingWorkbench={open,render};
  window.addEventListener('rigging-language',render);
  window.addEventListener('rigging-reset',()=>{station='weight';render()});
  window.addEventListener('rigging-course-render',()=>{if(document.body.dataset.tool==='skills')render()});
  render();
})();
