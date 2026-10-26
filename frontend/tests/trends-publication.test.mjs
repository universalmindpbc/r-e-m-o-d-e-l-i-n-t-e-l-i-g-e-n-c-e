import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
test('development ingestion retains CSV values and hashes, rejects mismatched geography without overwriting published data',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'rmu-trends-test-'));
 try{
 const csv='Month,domestic violence: (Australia)\n2006-01,10\n2016-01,<1\n2026-01,40\n';
 await writeFile(join(dir,'test-only.csv'),csv);
 const manifest={version:1,acquisition:{status:'test-only'},exports:[{id:'test-only',terms:['domestic violence'],geography:'AU',geographyLabel:'Australia',channel:'Web Search',from:'2006-01-01',to:'2026-10-20',exportedAt:'2026-10-20',sourceUrl:'https://trends.google.com/trends/explore?date=2006-01-01%202026-10-20&geo=AU&q=domestic%20violence',timeCsv:'test-only.csv'}]};
 const file=join(dir,'manifest.json'),output=join(dir,'compiled.json');await writeFile(file,JSON.stringify(manifest));
 const valid=spawnSync(process.execPath,['scripts/build-trends-data.mjs',file,output],{encoding:'utf8'});assert.equal(valid.status,0,valid.stderr);
 const saved=await readFile(output,'utf8');const compiled=JSON.parse(saved);assert.equal(compiled.exports[0].time.rows[1].value,null);assert.equal(compiled.exports[0].time.sha256,createHash('sha256').update(csv).digest('hex'));
 await writeFile(join(dir,'test-only.csv'),csv.replace('(Australia)','(United States)'));
 const invalid=spawnSync(process.execPath,['scripts/build-trends-data.mjs',file,output],{encoding:'utf8'});assert.notEqual(invalid.status,0);assert.match(invalid.stderr,/CSV geography/);assert.equal(await readFile(output,'utf8'),saved);
 }finally{await rm(dir,{recursive:true,force:true});}
});


test('published user exports preserve all 822 monthly values and flag only the incomplete month',async()=>{
 const dataset=JSON.parse(await readFile('server/google-trends.json','utf8'));
 assert.deepEqual(dataset.exports.map(r=>r.geography),['AU','US','']);
 let total=0;
 for(const record of dataset.exports){
  const raw=await readFile(join('data/google-trends',record.time.file),'utf8');
  const source=raw.replace(/^\uFEFF/,'').trim().split(/\r?\n/).slice(3).map(line=>{const [label,value]=line.split(',');return {label,value:Number(value)};});
  assert.equal(source.length,274);assert.equal(record.channel,'Web Search');assert.equal(record.from,'2004-01-01');assert.equal(record.to,'2026-10-19');
  assert.equal(record.time.sha256,createHash('sha256').update(raw).digest('hex'));
  assert.deepEqual(record.time.rows.map(({label,value})=>({label,value})),source);
  assert.deepEqual(record.time.rows.filter(r=>r.partial).map(r=>r.label),['2026-10']);
  assert.equal(record.region,null);total+=record.time.rows.length;
 }
 assert.equal(total,822);
});
