const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const skills=require('../skill-data.js');
const BASE=process.env.BASE_URL||'http://127.0.0.1:8321/index.html',KEY='cq.rig101.recordEnvelope';
const checks=[],out=path.join(__dirname,'..','audit-output','required-practice');fs.mkdirSync(out,{recursive:true});
async function test(name,fn){try{await fn();checks.push({name,pass:true});console.log('PASS '+name)}catch(error){checks.push({name,pass:false,error:error.message});console.error('FAIL '+name+': '+error.message)}}
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
 const context=await browser.newContext({viewport:{width:1365,height:900}}),page=await context.newPage(),errors=[];page.setDefaultTimeout(8000);
 page.on('pageerror',error=>errors.push(error.message));
 try{
 await page.goto(BASE,{waitUntil:'networkidle'});
 await test('course boots and opens all seven required stations',async()=>{
   assert.deepEqual(errors,[]);await page.click('#navPractice');await page.waitForSelector('#skillWorkbench:visible');
   assert.equal(await page.locator('[data-station]').count(),7);assert.match(await page.locator('#skillCount').innerText(),/0 of 22/);
 });
 await test('drafts, coaching and incorrect intermediate steps survive language switch and reload',async()=>{
   await page.fill('#weight-total-payload','7000');await page.fill('#weight-total-hook','8020');
   await page.locator('[data-skill-form="weight-total"] button[type=submit]').click();
   assert.match(await page.locator('[data-case="weight-total"] .skill-feedback').innerText(),/machine, base/);
   assert.match(await page.locator('#skillCount').innerText(),/0 of 22/);
   await page.click('#skillWorked summary');await page.waitForTimeout(80);
   await page.click('#langToggle');assert.equal(await page.inputValue('#weight-total-payload'),'7000');
   assert.match(await page.locator('#skillWorkbench h2').innerText(),/Calcule/);
   await page.reload({waitUntil:'networkidle'});assert.equal(await page.inputValue('#weight-total-hook'),'8020');
   await page.click('#langToggle');
 });
 await test('each independent record is graded and counted through its form',async()=>{
   for(const station of skills.stations){await page.click(`[data-station="${station.id}"]`);
     for(const item of skills.cases.filter(c=>c.station===station.id)){
       for(const field of item.fields){const selector=`#${item.id}-${field.id}`;if(field.options)await page.selectOption(selector,field.expected);else await page.fill(selector,String(field.expected));}
       await page.locator(`[data-skill-form="${item.id}"] button[type=submit]`).click();
       assert.match(await page.locator(`[data-case="${item.id}"] .skill-feedback`).innerText(),/Demonstrated/);
     }
   }
   assert.match(await page.locator('#skillCount').innerText(),/22 of 22/);
   assert.equal(await page.locator('#completionCard').evaluate(el=>el.classList.contains('show')),false);
   const record=await page.evaluate(()=>window.RiggingCourse.recordPayload());
   assert.equal(record.skills['weight-total'].attempts.length,2);assert.equal(record.skills['weight-total'].attempts[1].coached,true);
   assert.equal(record.fieldPerformance.status,'not_observed');assert.equal(record.knowledge.skillChecks.mastered,22);
 });
 await test('six guided decisions route to final only after required practice is complete',async()=>{
   await page.click('#navLearn');
   const answers=await page.evaluate(()=>{const d=window.RiggingCourseData,fnv=s=>{let h=0x811c9dc5;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,0x01000193)>>>0}return h.toString(16).padStart(8,'0')};return d.DECISIONS.map(q=>[0,1,2,3].find(i=>fnv(`${d.SALT}:${q.id}:${i}`)===q.hash))});
   for(const answer of answers){await page.click(`[data-journey-choice="${answer}"]`);await page.click('#journeyCheck');await page.click('#journeyNext')}
   assert.equal(await page.evaluate(()=>document.body.dataset.tool),'mastery');
 });
 await test('quiz plus required evidence emits canonical and legacy completion once',async()=>{
   await page.evaluate(()=>{window.observedCompletions=[];for(const type of ['cq-module-complete','cq-lab-complete'])window.addEventListener(type,e=>window.observedCompletions.push({type,detail:e.detail}))});
   const answers=await page.evaluate(()=>{const d=window.RiggingCourseData,fnv=s=>{let h=0x811c9dc5;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,0x01000193)>>>0}return h.toString(16).padStart(8,'0')};return d.KC.map(q=>[0,1,2,3].find(i=>fnv(`${d.SALT}:${q.id}:${i}`)===q.hash))});
   assert.match(await page.evaluate(()=>window.RiggingCourseData.KC[2].stem),/9,000.*50 degrees/);
   for(const answer of answers){await page.click(`[data-qchoice="${answer}"]`);await page.click('#checkAnswer');await page.click('#nextQuestion')}
   await page.evaluate(()=>{window.RiggingCourse.updateProgress();window.RiggingCourse.updateProgress()});
   const events=await page.evaluate(()=>window.observedCompletions);assert.equal(events.length,2);assert.equal(events[0].detail.skillChecks,22);assert.equal(events[0].detail.fieldPerformance,'not_observed');
   assert.equal(await page.locator('#completionCard').evaluate(el=>el.classList.contains('show')),true);
   await page.locator('#completionCard').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,'desktop-completion.png')});
 });
 await test('editing demonstrated evidence removes completion until rechecked',async()=>{
   await page.click('#navPractice');await page.click('[data-station="weight"]');await page.fill('#weight-total-hook','1');
   assert.match(await page.locator('#skillCount').innerText(),/21 of 22/);
   assert.equal(await page.locator('#completionCard').evaluate(el=>el.classList.contains('show')),false);
   await page.fill('#weight-total-hook','8020');await page.locator('[data-skill-form="weight-total"] button[type=submit]').click();
 });
 await test('load geometry, evidence invalidation and capacities use the applied model',async()=>{
   await page.evaluate(()=>window.RiggingCourse.openTool('share'));
   assert.equal(await page.locator('.share-analysis-tabs').evaluate(tabs=>{
     const r=tabs.getBoundingClientRect();return [...tabs.querySelectorAll('button')].every(button=>{const b=button.getBoundingClientRect();return b.top>=r.top&&b.bottom<=r.bottom});
   }),true,'desktop analysis tabs are clipped by the flex container');
   await page.fill('#shareSpanInput','144');await page.fill('#shareRiseInput','96');await page.click('#applyShareGeometry');
   const angle=await page.evaluate(()=>{const l=document.querySelector('#shareSvg .animated-rig-line.left');return Math.atan2(+l.getAttribute('y2')-+l.getAttribute('y1'),+l.getAttribute('x1')-+l.getAttribute('x2'))*180/Math.PI});
   const expected=Math.atan2(96,144*.65)*180/Math.PI;assert.ok(Math.abs(angle-expected)<1e-7);
   await page.click('[data-share-panel="capacity"]');
   for(const key of ['leftSlingWll','rightSlingWll','leftHardwareWll','rightHardwareWll','topHardwareWll'])await page.fill(`[data-capacity-key="${key}"]`,'30000');
   await page.click('[data-apply-capacity]');await page.click('[data-share-panel="assumptions"]');
   await page.selectOption('[data-evidence="weight"]','verified');await page.selectOption('[data-evidence="cg"]','verified');await page.check('[data-evidence-inspection]');
   await page.click('[data-share-panel="capacity"]');assert.match(await page.locator('.share-system-status').innerText(),/Verify the geometry/);
   await page.click('[data-share-panel="assumptions"]');await page.selectOption('[data-evidence="geometry"]','measured');
   await page.click('[data-share-panel="capacity"]');assert.match(await page.locator('.share-system-status').innerText(),/ready for qualified review/);
   await page.fill('#shareWeight','99999');await page.click('[data-share-panel="explain"]');
   assert.equal(await page.evaluate(()=>window.RiggingCourse.getShareInput().totalLoad),12000);
   await page.click('#applyShareWeight');
   assert.equal(await page.evaluate(()=>window.RiggingCourse.shareEvidence.cg),'estimated');
   await page.click('[data-share-panel="model"]');await page.click('#resetShare');assert.equal(await page.inputValue('#shareSpanInput'),'120');
   await page.click('[data-share-panel="capacity"]');assert.equal(await page.inputValue('[data-capacity-key="leftSlingWll"]'),'');
 });
 await test('D/d, basket geometry and calculated governing path respond to controls',async()=>{
   await page.evaluate(()=>window.RiggingCourse.openTool('visual'));await page.click('[data-visual-tab="bend"]');
   await page.locator('#bendRange').evaluate(el=>{el.value='8';el.dispatchEvent(new Event('input',{bubbles:true}))});
   const ratio=await page.evaluate(()=>2*Number(document.querySelector('#bendBearing').getAttribute('r'))/Number(document.querySelector('#bendSling').getAttribute('stroke-width')));assert.equal(ratio,8);
   assert.doesNotMatch(await page.locator('#visual-bend').innerText(),/Generous|Marginal/);
   await page.click('[data-visual-tab="hitches"]');const before=await page.locator('.basket-live svg path').first().getAttribute('d');
   await page.locator('#basketAngle').evaluate(el=>{el.value='45';el.dispatchEvent(new Event('input',{bubbles:true}))});assert.notEqual(await page.locator('.basket-live svg path').first().getAttribute('d'),before);
   await page.click('[data-visual-tab="path"]');assert.match(await page.locator('.path-status').innerText(),/sling leg/);
   await page.selectOption('#governingSelect','B');assert.match(await page.locator('.path-status').innerText(),/Hook/);
   await page.click('#pathMode');assert.match(await page.locator('.path-status').innerText(),/HOLD/);
   await page.click('[data-visual-tab="tags"]');assert.match(await page.locator('.classroom-tag').innerText(),/WS-17/);
 });
 await test('phone and tablet layouts retain drafts without page overflow in both languages',async()=>{
   for(const width of [390,768])for(const lang of ['en','es']){
     await page.setViewportSize({width,height:844});if((await page.getAttribute('html','lang')).startsWith('es')!==(lang==='es'))await page.click('#langToggle');
     await page.click('#navPractice');
     for(const station of skills.stations){await page.click(`[data-station="${station.id}"]`);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${width} ${lang} ${station.id} overflows`)}
     await page.click('[data-station="spreader"]');await page.locator('.skill-diagram').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,`${width}-${lang}-spreader.png`)});
   }
 });
 await test('offline reload retains all new course scripts and required practice',async()=>{
   await page.evaluate(async()=>{await Promise.race([navigator.serviceWorker.ready,new Promise((_,reject)=>setTimeout(()=>reject(new Error("Service worker did not install")),8000))])});await page.reload({waitUntil:'networkidle'});
   try { await context.setOffline(true);await page.reload({waitUntil:'load'});await page.click('#navPractice');
   assert.equal(await page.locator('[data-station]').count(),7);await page.click('[data-station="tags"]');assert.equal(await page.locator('#tag-rating-rating').count(),1);
   const result=await page.evaluate(async()=>{const r=await fetch('assets/inspection/wire-kinking.png');return r.ok});assert.equal(result,true);
   } finally { await context.setOffline(false); }
 });
 await test('prior-version records retain history and lose outdated quiz and skill credit',async()=>{
   // Seed before the runtime loads. Writing into an active tab would be overwritten
   // by that tab's legitimate pagehide persistence during reload.
   const oldContext=await browser.newContext(),oldPage=await oldContext.newPage();
   try {
     await oldPage.addInitScript(key=>{if(!sessionStorage.getItem('migrationSeeded')){localStorage.setItem(key,JSON.stringify({schemaVersion:'2.0',contentVersion:'2026.09.06.1',data:{decisions:['RIG101_d1'],kcMastered:true,quizAttempts:{RIG101_q1:2},skillRecord:{legacy:{passed:true}},skillStationsV1:{passed:{'weight-1':{help:true,attempts:2}},events:[{case:'weight-1',correct:true}]}}}));sessionStorage.setItem('migrationSeeded','yes')}},KEY);
     await oldPage.goto(BASE,{waitUntil:'networkidle'});
     const payload=await oldPage.evaluate(()=>window.RiggingCourse.recordPayload());assert.equal(payload.knowledge.finalKnowledgeCheckMastered,false);assert.equal(payload.knowledge.skillChecks.mastered,0);assert.equal(payload.archivedVersions.at(-1).knowledge.quizMastered,true);assert.equal(payload.archivedVersions.at(-1).quizAttempts.RIG101_q1,2);
     assert.equal(payload.archivedVersions.at(-1).skillStationsV1.passed['weight-1'].attempts,2);
     await oldPage.reload({waitUntil:'networkidle'});
     assert.equal(await oldPage.evaluate(()=>window.RiggingCourse.recordPayload().archivedVersions.length),1);
   } finally { await oldContext.close(); }
 });
 await test('reset deletes all learning evidence and leaves no script errors',async()=>{
   await page.locator('#deleteRecord').evaluate(el=>el.click());
   const record=await page.evaluate(()=>window.RiggingCourse.recordPayload());assert.equal(record.knowledge.skillChecks.mastered,0);assert.deepEqual(record.skills,{});assert.deepEqual(record.archivedVersions,[]);assert.deepEqual(errors,[]);
 });
 }finally{await context.setOffline(false);fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors},null,2));await browser.close()}
 console.log(`${checks.filter(c=>c.pass).length}/${checks.length} required-practice browser checks passed.`);process.exitCode=checks.some(c=>!c.pass)?1:0;
})().catch(e=>{console.error(e);process.exit(1)});
