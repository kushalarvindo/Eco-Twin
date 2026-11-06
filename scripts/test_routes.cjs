const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText,f);
const {networkRoute}=require('../frontend/src/routing.ts');
for(const to of ['admin','library','food-court']) {
 const route=networkRoute('cse',to);
 assert(route,'Expected a connected mapped route to '+to);
 assert(route.points.length>2);
 assert(route.walkMeters>=route.straightMeters-1);
 const withoutSteps=networkRoute('cse',to,true);
 assert(withoutSteps);
 assert.equal(withoutSteps.steps,false);
}
assert.equal(networkRoute('cse','cse'),null);
assert.equal(networkRoute('bad','cse'),null);
global.localStorage={getItem:()=>null};
global.sessionStorage={getItem:()=>null,setItem:()=>{}};
const {sampleHistory}=require('../frontend/src/samples.ts');
const now=new Date().toISOString(),old=new Date(Date.now()-100*86400000).toISOString();
const records=[{id:1,zone:'cse',status:'Verified',category:'Water',created_at:now,history:[]},{id:2,zone:'cse',status:'Verified',category:'Water',created_at:old,history:[]},{id:3,zone:'cse',status:'Resolved',category:'Water',created_at:old,history:[{status:'Resolved',created_at:now}]}];
const recent=sampleHistory(records,'cse','30','Water',1);
assert.equal(recent.counts.cse,1);
assert.equal(recent.total,1);
assert.equal(recent.weeks.reduce((sum,w)=>sum+w.resolved,0),1);
assert.equal(sampleHistory(records,'cse','all','Water',1).counts.cse,2);
assert.equal(sampleHistory(records,'cse','30','Energy',1).total,0);
console.log('Mapped routes, step avoidance and sample date/category filters passed.');
