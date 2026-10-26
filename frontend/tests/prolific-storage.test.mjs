import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import ts from 'typescript';
import * as questionnaire from '../app/survey/rihanna-clf/questions.ts';

test('intake verifies identity, persists progress, freezes awareness and prevents duplicate records',async()=>{
 const sqlite=new DatabaseSync(':memory:');
 sqlite.exec(readFileSync(new URL('../db/migrations/0005_prolific_pilot.sql',import.meta.url),'utf8'));
 const db={prepare(sql){return {bind(...args){return {async first(){return sqlite.prepare(sql).get(...args)||null;},async run(){return {meta:sqlite.prepare(sql).run(...args)};}};}};}};
 const campaign={bindings:()=>({CAMPAIGN_DB:db}),sameOrigin:r=>r.headers.get('origin')===new URL(r.url).origin,body:r=>r.json(),response:(data,status=200)=>Response.json(data,{status})};
 const source=readFileSync(new URL('../app/api/survey/rihanna-clf/route.ts',import.meta.url),'utf8');
 const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const exports={};new Function('require','exports',compiled)(id=>id==='cloudflare:workers'?{env:{PROLIFIC_API_TOKEN:'test-only'}}:id.includes('server/campaign')?campaign:questionnaire,exports);
 const pid='a'.repeat(24),sid='b'.repeat(24);
 const make=(data,origin='https://rmu.universalmind.tv')=>new Request('https://rmu.universalmind.tv/api/survey/rihanna-clf',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify({study:questionnaire.studyId,participant:pid,session:sid,...data})});
 const original=globalThis.fetch;let verification={participant:pid,study_id:questionnaire.studyId,status:'ACTIVE'};
 globalThis.fetch=async()=>Response.json(verification);
 try{
  assert.equal((await exports.POST(make({action:'start',consent:true}))).status,409);
  sqlite.exec('UPDATE prolific_pilot_settings SET enabled=1');
  assert.equal((await exports.POST(make({action:'start',consent:true},'https://other.example'))).status,403);
  verification={...verification,participant:'c'.repeat(24)};
  assert.equal((await exports.POST(make({action:'start',consent:true}))).status,403);
  verification={...verification,participant:pid};
  assert.equal((await exports.POST(make({action:'start',consent:false}))).status,400);
  assert.equal((await (await exports.POST(make({action:'start',consent:true}))).json()).phase,'screen');
  assert.equal((await exports.POST(make({action:'answer',phase:'screen',answers:{currentFan:'Yes'}}))).status,400);
  assert.equal((await (await exports.POST(make({action:'answer',phase:'screen',answers:{currentFan:'No',pastFan:'Yes'}}))).json()).phase,'awareness');
  const aware={rihannaFeeling:'No opinion',awareness:'No'};
  assert.equal((await (await exports.POST(make({action:'answer',phase:'awareness',answers:aware}))).json()).phase,'description');
  const replay=await (await exports.POST(make({action:'answer',phase:'awareness',answers:{...aware,awareness:'Yes'}}))).json();
  assert.equal(replay.answers.awareness,'No');
  assert.equal((await (await exports.POST(make({action:'start',consent:true}))).json()).phase,'description');
  const finished=await (await exports.POST(make({action:'answer',phase:'description',answers:{initiativeFeeling:'Very favourable'}}))).json();
  assert.equal(finished.phase,'complete');assert.match(finished.completionUrl,/app.prolific.com\/submissions\/complete\?cc=/);
  assert.deepEqual(await (await exports.POST(make({action:'answer',phase:'description',answers:{initiativeFeeling:'Very unfavourable'}}))).json(),finished);
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM prolific_pilot_responses').get().n,1);
  assert.equal((await exports.POST(make({action:'start',consent:true,session:'d'.repeat(24)}))).status,409);
  sqlite.exec('DELETE FROM prolific_pilot_responses');
  await exports.POST(make({action:'start',consent:true}));
  const screened=await (await exports.POST(make({action:'answer',phase:'screen',answers:{currentFan:'Yes',pastFan:'I cannot remember'}}))).json();
  assert.equal(screened.phase,'screened_out');assert.notEqual(screened.code,finished.code);
  sqlite.exec("UPDATE prolific_pilot_responses SET created_at=datetime('now','-90 days')");
  sqlite.exec("DELETE FROM prolific_pilot_responses WHERE created_at < datetime('now', '-89 days')");
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM prolific_pilot_responses').get().n,0);
 }finally{globalThis.fetch=original;sqlite.close();}
});
