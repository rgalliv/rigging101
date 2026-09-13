const {spawn}=require('node:child_process');
const path=require('node:path');
const {createServer}=require('../scripts/serve.cjs');
const tests=process.argv.slice(2);
const files=tests.length?tests:['rigging-core-test.js','required-skills-unit.cjs','required-practice-test.cjs','blender-visuals-test.js','button-test.js','spanish-mode-test.js','layout-pass-test.js','competency-ux-test.js','remediation-test.js','stage2-test.js'];
const server=createServer();
server.listen(0,'127.0.0.1',async()=>{
  const env={...process.env,BASE_URL:`http://127.0.0.1:${server.address().port}/index.html`};
  let failed=0;
  try{for(const file of files){console.log(`\nRunning ${file}`);const status=await new Promise((resolve,reject)=>{const child=spawn(process.execPath,[path.join(__dirname,file)],{env,stdio:'inherit',windowsHide:true});const timer=setTimeout(()=>{child.kill();resolve(1)},240000);child.on('error',reject);child.on('exit',code=>{clearTimeout(timer);resolve(code)})});if(status!==0)failed++;}}
  finally{server.close();}
  console.log(`\n${files.length-failed}/${files.length} test suites passed.`);process.exitCode=failed?1:0;
});
