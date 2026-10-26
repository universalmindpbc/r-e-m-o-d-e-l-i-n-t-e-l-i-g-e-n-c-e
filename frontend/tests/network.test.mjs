import test from 'node:test';
import assert from 'node:assert/strict';
import {browseNetwork,graphPositions,csvExport} from '../app/network/browse.ts';
import {networkIdentity,networkPlan} from '../app/network/workflow.ts';
import {campaignDefaults} from '../app/campaign-config.ts';
const all=Array.from({length:100},(_,i)=>({id:String(i),name:'Partner '+i,category:['Culture','Community','Media','Creators'][i%4],origin:i%2?'observed':'discovered',subtype:'Musician',role:'Role',alignment:'Cause',review:{status:i===2?'approved':'pending'}}));
const opts={query:'',category:null,scope:'all',shortlist:[],pins:[],page:0};
test('100 candidates browse exactly once in five pages of 20',()=>{const ids=[];for(let page=0;page<5;page++){const b=browseNetwork(all,{...opts,page});assert.equal(b.visible.length,20);ids.push(...b.visible.map(c=>c.id));}assert.equal(new Set(ids).size,100);});
test('pins remain across pages and filters without duplication or exceeding 20',()=>{for(let page=0;page<7;page++){const b=browseNetwork(all,{...opts,pins:['0','1','2','3','4'],page});assert(b.visible.length<=20);assert.deepEqual(b.visible.slice(0,5).map(c=>c.id),['0','1','2','3','4']);assert.equal(new Set(b.visible.map(c=>c.id)).size,b.visible.length);}const b=browseNetwork(all,{...opts,query:'does not exist',pins:['0']});assert.equal(b.visible.length,1);assert.equal(b.total,0);});
test('filters, shortlist and approved view act across the full pool',()=>{assert.equal(browseNetwork(all,{...opts,scope:'shortlist',shortlist:['2','99']}).matches.length,2);assert.equal(browseNetwork(all,{...opts,scope:'approved'}).matches[0].id,'2');assert.equal(browseNetwork(all,{...opts,category:'Culture'}).matches.length,25);assert.equal(browseNetwork(all,{...opts,query:'partner 99',page:99}).page,0);});
test('20 same-category positions never overlap exactly',()=>{const pts=graphPositions(all.slice(0,20).map(c=>({...c,category:'Culture'})),[]);assert.equal(new Set(pts.map(p=>p.x+','+p.y)).size,20);});
test('new topics or dates require a distinct three-stage campaign plan',()=>{assert.notEqual(networkIdentity(campaignDefaults),networkIdentity({...campaignDefaults,topics:['new cause']}));assert.notEqual(networkIdentity(campaignDefaults),networkIdentity({...campaignDefaults,analysisEndDate:'2022-05-01'}));assert.deepEqual(networkPlan(campaignDefaults).stages.map(s=>s.id),['observe','discover','review']);assert.equal(networkPlan(campaignDefaults).required,true);});
test('spreadsheet export escapes formulas and quotes',()=>{const csv=csvExport([{...all[0],name:'=1+1',research:[],evidence:[],limitation:'a,"b"'}]);assert(csv.includes("\"'=1+1\""));assert(csv.includes('"a,""b"""'));});

import {validateReview} from '../app/network/review-validation.ts';
test('reviews require a real candidate, valid decision, reviewer and substantive note',()=>{const valid={candidateId:'1',status:'approved',reviewer:'Reviewer',note:'Reviewed the source evidence and current limitations.'};assert.equal(validateReview(valid,['1']).status,'approved');for(const update of [{candidateId:'fake'},{status:'complete'},{reviewer:''},{note:'ok'}])assert.throws(()=>validateReview({...valid,...update},['1']));});

import {networkRevision} from '../app/network/workflow.ts';
test('changed research invalidates approval revision automatically',async()=>{assert.notEqual(await networkRevision({evidence:'old'}),await networkRevision({evidence:'new'}));assert.equal(await networkRevision({evidence:'old'}),await networkRevision({evidence:'old'}));});

import {constellationPositions,nodeSize,clearsProtectedSpace} from '../app/network/geometry.ts';
test('dense category pages preserve heading and hub exclusion zones including pulse rings',()=>{
 for(const category of ['Culture','Community','Media','Creators']){
  const points=constellationPositions(all.slice(0,20).map(c=>({...c,category,followers:100000000})));
  for(const p of points){const r=(nodeSize(p.c.followers)/2+.45)*1.5+.3;assert(clearsProtectedSpace(p.x*.68,p.y*.343125,r));}
 }
});
