const assert=require('node:assert/strict'),core=require('../rigging-core.js'),skills=require('../skill-data.js');
let count=0;function test(name,fn){fn();count++;console.log('PASS '+name)}
const ready={totalLoad:12000,span:120,cgFromLeft:78,hookHeight:90,capacities:Object.fromEntries(core.REQUIRED_CAPACITY_KEYS.map(k=>[k,30000])),evidence:{weight:'verified',cg:'verified',geometry:'measured',inspectionComplete:true}};
test('training geometry never reaches ready state',()=>assert.equal(core.solveTwoPoint({...ready,evidence:{...ready.evidence,geometry:'training'}}).status,'geometry_required'));
test('drawn angles match physical model across span, rise and offset changes',()=>{
 for(const span of [24,120,320])for(const rise of [12,90,600])for(const pct of [.1,.5,.9]){
  const input={...ready,span,cgFromLeft:span*pct,hookHeight:rise},d=core.layoutTwoPoint(input),r=core.solveTwoPoint(input);
  assert.ok(Math.abs(Math.atan2(d.pickY-d.hookY,d.hookX-d.leftX)*180/Math.PI-r.geometry.leftAngle)<1e-9);
  assert.ok(Math.abs(Math.atan2(d.pickY-d.hookY,d.rightX-d.hookX)*180/Math.PI-r.geometry.rightAngle)<1e-9);
 }
});
test('combined CG conserves moments',()=>assert.deepEqual(core.combinedCG([{weight:3,position:2},{weight:7,position:10}]),{weight:10,moment:76,position:7.6}));
test('spreader includes self-weight above beam and obeys vector equilibrium',()=>{
 const b=core.solveSpreader({payload:10000,beamWeight:800,span:144,angle:60});
 assert.equal(b.lowerTension,5000);assert.equal(b.hookLoad,10800);
 assert.ok(Math.abs(2*b.upperTension*Math.sin(Math.PI/3)-10800)<1e-9);
 assert.ok(Math.abs(b.upperTension*Math.cos(Math.PI/3)-b.compression)<1e-9);
 assert.ok(Math.abs(b.rise-72*Math.sqrt(3))<1e-9);
});
test('invalid physical inputs rejected',()=>{
 for(const value of [0,-1,Infinity,NaN])assert.throws(()=>core.solveTwoPoint({...ready,span:value}));
 assert.throws(()=>core.solveSpreader({payload:1000,beamWeight:-1,span:120,angle:45}));
 assert.throws(()=>core.solveSpreader({payload:1000,beamWeight:0,span:120,angle:90}));
});
test('seven stations and 22 unique evidence records',()=>{assert.equal(skills.stations.length,7);assert.equal(skills.cases.length,22);assert.equal(new Set(skills.cases.map(c=>c.id)).size,22)});
test('empty, partial, invalid and wrong answers never pass',()=>{
 for(const c of skills.cases){assert.equal(skills.grade(c,{}).correct,false);assert.equal(skills.grade(c,Object.fromEntries(c.fields.map(f=>[f.id,f.options?'invalid':'NaN']))).correct,false)}
});
test('progress requires current version, a passed attempt and matching draft',()=>{
 const record={};for(const c of skills.cases){const draft=Object.fromEntries(c.fields.map(f=>[f.id,String(f.expected)]));record[c.id]={version:skills.VERSION,draft,attempts:[{correct:true,values:{...draft}}]}}
 assert.equal(skills.progress(record).complete,true);
 record['weight-total'].draft.hook='1';assert.equal(skills.progress(record).complete,false);
 record['weight-total'].draft.hook='8020';record['weight-total'].version='old';assert.equal(skills.progress(record).complete,false);
});
test('inspection evidence has varied dispositions',()=>assert.deepEqual(new Set(skills.cases.filter(c=>c.station==='inspection').map(c=>c.fields.find(f=>f.id==='call').expected)),new Set(['continue','hold','remove'])));
test('zero threshold has a distinct calculation fingerprint',()=>assert.notEqual(core.calculationFingerprint({...ready,thresholds:{elevated:0,critical:.95}}),core.calculationFingerprint(ready)));
console.log(`${count} required-skills unit checks passed.`);
