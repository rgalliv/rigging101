const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('playwright');
const core = require('../rigging-core.js');
const geometry = require('../assets/blender/geometry.json');

(async()=>{
  assert.equal(geometry.length,10);
  for(const g of geometry){
    const r=core.solveSpreader({payload:10000,beamWeight:1000,span:10,angle:g.angle});
    assert(Math.abs(r.rise-g.rise_ft)<1e-10);
    assert(Math.abs(r.upperTension-g.upper_tension_lb)<1e-8);
    assert(Math.abs(r.compression-g.compression_lb)<1e-8);
    assert(fs.statSync(path.join(__dirname,`../assets/blender/spreader-${g.angle}.webp`)).size>1000);
  }
  const browser=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
  try{
    const page=await browser.newPage({viewport:{width:1365,height:1000}});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(process.env.BASE_URL||'http://127.0.0.1:8321/index.html');
    await page.click('#navPractice');await page.click('[data-station="spreader"]');
    for(const g of geometry){
      await page.locator('#beamAngle').fill(String(g.angle));
      const img=page.locator('.beam-assembly img');
      await img.evaluate(el=>el.decode());
      assert((await img.getAttribute('src')).endsWith(`-${g.angle}.webp`));
      assert(await img.isVisible());
      assert((await page.locator('#spreaderExplore table').textContent()).includes(Math.round(g.compression_lb).toLocaleString()));
    }
    await page.click('[data-beam-view="diagram"]');
    assert(await page.locator('#spreaderExplore>.practice-diagram').isVisible());
    assert(!await page.locator('.beam-assembly').isVisible());
    await page.locator('#beamAngle').fill('60');
    assert(await page.locator('#spreaderExplore>.practice-diagram').isVisible());
    await page.click('[data-beam-view="assembly"]');
    await page.locator('.beam-assembly img').evaluate(el=>el.decode());
    await page.locator('#spreaderExplore').screenshot({path:'audit-output/blender-spreader.png'});
    await page.click('#langToggle');
    await page.waitForFunction(()=>document.querySelector('.beam-assembly figcaption')?.textContent.includes('Siga la carga'));
    assert.match(await page.locator('.beam-assembly figcaption').textContent(),/Siga la carga/);
    await page.setViewportSize({width:390,height:844});
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.locator('.beam-assembly').screenshot({path:'audit-output/blender-mobile-es.png'});
    await page.evaluate(()=>navigator.serviceWorker.ready);
    await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
    await page.context().setOffline(true);
    for(const angle of [30,75]){
      const bytes=await page.evaluate(async a=>(await (await fetch(`assets/blender/spreader-${a}.webp`)).arrayBuffer()).byteLength,angle);
      assert(bytes>1000,'offline image must be available');
    }
    await page.context().setOffline(false);
    assert.deepEqual(errors,[]);
    const unavailableContext=await browser.newContext({serviceWorkers:'block'});
    await unavailableContext.route('**/assets/blender/*.webp',route=>route.abort());
    const unavailable=await unavailableContext.newPage();
    await unavailable.goto(process.env.BASE_URL||'http://127.0.0.1:8321/index.html');
    await unavailable.click('#navPractice');await unavailable.click('[data-station="spreader"]');
    await unavailable.locator('.beam-image-status').waitFor();
    assert(await unavailable.locator('#spreaderExplore>.practice-diagram').isVisible());
    assert(!await unavailable.locator('.beam-assembly').isVisible());
    assert.equal(await unavailable.locator('[data-beam-view="diagram"]').getAttribute('aria-pressed'),'true');
    await unavailableContext.unroute('**/assets/blender/*.webp');
    await unavailable.click('[data-beam-view="assembly"]');
    await unavailable.locator('.beam-assembly img').evaluate(el=>el.decode());
    assert(await unavailable.locator('.beam-assembly').isVisible());
    await unavailableContext.close();
    console.log('PASS: unavailable image falls back to the force diagram; retry restores 3D.');
    console.log('PASS: 10 rendered geometries match calculator; all images decode; both views, Spanish, mobile and offline assets pass.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
