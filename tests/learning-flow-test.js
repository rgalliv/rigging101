/* End-to-end evidence checks: use independent classroom answers, not UI state injection. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const BASE=process.env.BASE_URL||'http://127.0.0.1:8321/index.html';
const answers={
  'weight-1':{payload:8400,upper:9000,tons:4.5},
  'weight-2':{cg:7.1,estimate:150,'estimate-source':1},
  'share-1':{'left-share':4000,'right-share':6000,'left-tension':5657,'right-tension':7211},
  'share-2':{'left-share':10500,'right-share':4500,'left-tension':11214,'right-tension':5979},
  'angle-1':{factor:1.25,tension:5000,use:83.33},
  'angle-2':{'vertical-angle':30,included:60,demand:5196,'angle-call':1},
  'tags-1':{'basket-rating':10392,'basket-use':86.61,'tag-call':2},
  'tags-2':{'tag-missing':2,'tag-evidence':0},
  'inspect-wire':{'inspect-wire':1,'inspect-wire-evidence':1},
  'inspect-web':{'inspect-web':0,'inspect-web-evidence':0},
  'inspect-round':{'inspect-round':1,'inspect-round-evidence':2},
  'inspect-chain':{'inspect-chain':2,'inspect-chain-evidence':0},
  'inspect-hardware':{loss:12,'inspect-hardware':1,'inspect-hardware-evidence':1},
  'inspect-beam':{'inspect-beam':2,'inspect-beam-evidence':2},
  'spreader-1':{lower:4000,upper:5081,compression:2540,rise:8.66},
  'spreader-2':{'beam-selection':1,'beam-change':2},
  'job-skid':{'job-skid':1,'job-skid-reason':0},
  'job-pipe':{'job-pipe':2,'job-pipe-reason':0},
  'job-edge':{'job-edge':0,'job-edge-reason':0},
  'job-frame':{'job-frame':1,'job-frame-reason':0},
  'job-four':{'job-four':2,'job-four-reason':0},
  'job-landing':{'job-landing':0,'job-landing-reason':0}
};
async function fillCase(page,id){for(const [key,value] of Object.entries(answers[id])){const el=page.locator(`#practiceForm [name="${key}"]`);if(await el.evaluate(e=>e.tagName)==='SELECT')await el.selectOption(String(value));else await el.fill(String(value));}}
async function finishStations(page){
  await page.click('#navPractice');
  for(const station of ['weight','share','angle','tags','inspection','spreader','application']){
    await page.click(`[data-station="${station}"]`);await page.locator('.practice-modes [data-mode="solve"]').click();
    const n=await page.locator('[data-task]').count();
    for(let i=0;i<n;i++){
      await page.click(`[data-task="${i}"]`);
      if(await page.locator('#practiceForm [type=submit]').isDisabled())continue;
      const id=await page.locator('#practiceForm').getAttribute('data-case');
      await fillCase(page,id);await page.locator('#practiceForm [type=submit]').click();
      assert(await page.locator('#practiceNext').isVisible(),`${id}: ${await page.locator('#practiceFeedback').textContent()}`);
    }
  }
}
module.exports={finishStations};
let testBrowser;
if(require.main===module)(async()=>{
  const browser=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
  testBrowser=browser;
  const page=await browser.newPage({viewport:{width:1400,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(BASE);await page.evaluate(()=>localStorage.clear());await page.reload();
  assert.equal(await page.evaluate(()=>localStorage.getItem('cq.rig101.recordEnvelope')),null,'anonymous render must not create a record');
  await page.click('#navPractice');await page.locator('.practice-modes [data-mode="solve"]').click();
  await fillCase(page,'weight-1');await page.locator('[name=payload]').fill('9000');await page.locator('#practiceForm [type=submit]').click();
  assert.match(await page.locator('#practiceFeedback').textContent(),/Add frame, motor and contents/);
  assert.equal(await page.locator('#practiceNext').count(),0,'wrong work must not unlock');
  await page.click('#practiceHint');
  await page.click('#langToggle');await page.waitForTimeout(100);
  assert.equal(await page.locator('[name=payload]').inputValue(),'9000','language switch preserves work');
  assert.match(await page.locator('#practiceTitle').textContent(),/habilidades/);
  await page.click('#langToggle');await page.waitForTimeout(100);
  await finishStations(page);
  const record=await page.evaluate(()=>window.RiggingPractice.record());
  assert.equal(record.completed,22);assert.equal(record.required,22);
  assert.equal(record.passed['weight-1'].help,true);assert.equal(record.passed['weight-1'].attempts,2);
  assert.equal(record.passed['share-1'].help,false);assert.equal(record.passed['share-1'].attempts,1);
  assert(!(await page.locator('#completionCard').getAttribute('class')).includes('show'),'skill checks alone cannot complete course');
  await page.reload();assert.equal(await page.evaluate(()=>window.RiggingPractice.record().completed),22,'record survives reload');
  // Complete the six conceptual decisions and the final quiz by their stored hash scheme.
  const src=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');const salt=src.match(/const SALT="([^"]+)"/)[1];
  const fnv=s=>{let h=0x811c9dc5;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,0x01000193)>>>0;}return h.toString(16).padStart(8,'0');};
  const correct={};for(const line of src.split('\n')){const m=line.match(/id:"(RIG101_[dq]\d)".*?hash:"([a-f0-9]{8})"/);if(m)correct[m[1]]=[0,1,2,3].find(i=>fnv(`${salt}:${m[1]}:${i}`)===m[2]);}
  await page.click('#navLearn');for(let i=0;i<6;i++){await page.click(`[data-journey-index="${i}"]`);await page.click(`[data-journey-choice="${correct['RIG101_d'+(i+1)]}"]`);await page.click('#journeyCheck');}
  await page.evaluate(()=>window.RiggingCourse.openTool('mastery'));
  for(let i=0;i<8;i++){await page.click(`[data-qchoice="${correct['RIG101_q'+(i+1)]}"]`);await page.click('#checkAnswer');await page.click('#nextQuestion');}
  assert((await page.locator('#completionCard').getAttribute('class')).includes('show'),'complete evidence unlocks completion');
  await page.click('#navPractice');await page.click('[data-station="spreader"]');
  await page.locator('#beamAngle').evaluate(e=>{e.value='30';e.dispatchEvent(new Event('input',{bubbles:true}));});assert.match(await page.locator('#spreaderExplore').textContent(),/not a permitted configuration/);
  await page.locator('#beamAngle').evaluate(e=>{e.value='60';e.dispatchEvent(new Event('input',{bubbles:true}));});
  await page.screenshot({path:path.join(__dirname,'..','audit-output','spreader-desktop.png'),fullPage:true});
  await page.evaluate(()=>window.RiggingCourse.openTool('share'));
  await page.locator('#shareSpan').fill('240');await page.locator('#shareRise').fill('180');await page.click('#applyGeometry');
  assert.equal(await page.evaluate(()=>window.RiggingCourse.modelInput().hookHeight),180);
  const diag=await page.evaluate(()=>{const m=RiggingCourse.modelInput(),r=RiggingTrainingCore.solveTwoPoint(m),line=document.querySelector('.animated-rig-line.left');return {shown:r.geometry.leftAngle,drawn:Math.atan2(+line.getAttribute('y2')-(+line.getAttribute('y1')),+line.getAttribute('x1')-(+line.getAttribute('x2')))*180/Math.PI};});
  assert(Math.abs(diag.drawn-diag.shown)<1e-6);
  await page.click('[data-share-panel="explain"]');assert.match(await page.locator('#sharePanelExplain').textContent(),/training default/);
  await page.setViewportSize({width:390,height:844});await page.click('#langToggle');await page.waitForTimeout(100);
  await page.click('#navPractice');
  for(const station of ['weight','share','angle','tags','inspection','spreader','application']){
    await page.click(`[data-station="${station}"]`);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),`Spanish mobile overflow: ${station}`);
    await page.locator('.practice-modes [data-mode="solve"]').click();
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),`Spanish mobile form overflow: ${station}`);
  }
  await page.screenshot({path:path.join(__dirname,'..','audit-output','practice-mobile-es.png'),fullPage:true});
  await page.evaluate(()=>window.RiggingCourse.reset());assert.equal(await page.evaluate(()=>window.RiggingPractice.record().completed),0);
  assert.equal(await page.evaluate(()=>localStorage.getItem('cq.rig101.recordEnvelope')),null,'clear removes record');
  assert.deepEqual(errors,[]);await browser.close();console.log('PASS: 22 skill checks, diagnostic feedback, coached/independent records, language persistence, reload, full completion gate, geometry, seven Spanish mobile stations and clear-progress privacy.');
})().catch(async e=>{console.error(e);await testBrowser?.close();process.exitCode=1;});
