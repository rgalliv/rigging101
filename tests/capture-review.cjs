const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path');
const out=path.join(__dirname,'..','audit-output','review');fs.mkdirSync(out,{recursive:true});
(async()=>{
  const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
  try{
    const context=await browser.newContext(),page=await context.newPage();page.setDefaultTimeout(8000);
    await page.goto(process.env.BASE_URL||'http://127.0.0.1:8321/index.html',{waitUntil:'networkidle'});
    for(const width of [1365,390]){
      await page.setViewportSize({width,height:900});
      for(const [name,tool,selector,tab] of [['load-share','share','#shareLab'],['geometry','share','#shareSvg'],['bend','visual','#visual-bend','bend'],['tags','visual','#visual-tags','tags'],['inspection','visual','#visual-inspection','inspection'],['weight','skills','#skillWorkbench']]){
        await page.evaluate(tool=>window.RiggingCourse.openTool(tool),tool);
        if(tool==='share' && /verified/i.test(await page.locator('.share-stage-note').innerText()))throw new Error('Model caption overstates evidence');
        if(tab)await page.click(`[data-visual-tab="${tab}"]`);
        await page.locator(selector).scrollIntoViewIfNeeded();await page.waitForTimeout(350);
        await page.screenshot({path:path.join(out,`${width}-${name}.png`)});
      }
    }
    await context.close();
  }finally{await browser.close()}
  console.log('Captured desktop and phone review screens.');
})().catch(error=>{console.error(error);process.exit(1)});
