// Development ingestion only: visitors never upload files or call Google.
import {readFile,writeFile,rename} from 'node:fs/promises';
import {resolve,dirname,basename} from 'node:path';
import {createHash} from 'node:crypto';
import {parseTrendsCsv} from '../app/lab/trends.ts';
const manifestPath=resolve(process.argv[2]||'data/google-trends/manifest.json');
const output=resolve(process.argv[3]||'server/google-trends.json');
const manifest=JSON.parse(await readFile(manifestPath,'utf8'));
if(manifest.version!==1||!Array.isArray(manifest.exports))throw Error('Invalid Trends manifest.');
const exports=[];const ids=new Set();
for(const item of manifest.exports){
 for(const key of ['id','geography','geographyLabel','channel','from','to','exportedAt','sourceUrl'])if(typeof item[key]!=='string')throw Error(`Missing ${key}.`);
 if(!['Web Search','YouTube Search'].includes(item.channel)||!Array.isArray(item.terms)||!item.terms.length||item.terms.some(t=>!['domestic violence','violent extremism'].includes(t)))throw Error('Unsupported search definition.');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(item.from)||!/^\d{4}-\d{2}-\d{2}$/.test(item.to)||item.from>item.to||!Number.isFinite(Date.parse(item.exportedAt)))throw Error('Invalid export dates.');
 const url=new URL(item.sourceUrl);
 if(url.origin!=='https://trends.google.com'||url.pathname!=='/trends/explore'||(url.searchParams.get('geo')||'')!==item.geography||(url.searchParams.get('gprop')||'')!==(item.channel==='YouTube Search'?'youtube':''))throw Error('Source URL must match export geography and search type.');
 if(!['all',`${item.from} ${item.to}`].includes(url.searchParams.get('date')))throw Error('Use an explicit date window or all-history source URL.');
 const query=(url.searchParams.get('q')||'').split(',');if(item.terms.some(t=>!query.includes(t)))throw Error('Source URL does not match search terms.');
 for(const term of item.terms){
  const record={id:`${item.id}:${term}`,term,geography:item.geography,geographyLabel:item.geographyLabel,channel:item.channel,from:item.from,to:item.to,exportedAt:item.exportedAt,sourceUrl:item.sourceUrl,time:null,region:null};
  if(ids.has(record.id))throw Error('Duplicate export ID.');ids.add(record.id);
  for(const kind of ['time','region']){
   const file=item[`${kind}Csv`];if(!file)continue;if(typeof file!=='string'||basename(file)!==file||!file.endsWith('.csv'))throw Error('CSV must be a filename beside the manifest.');
   const raw=await readFile(resolve(dirname(manifestPath),file),'utf8');if(Buffer.byteLength(raw)>1000000)throw Error('CSV exceeds 1 MB.');
   const parsed=parseTrendsCsv(raw,term);if(parsed.scope!==item.geographyLabel)throw Error('CSV geography does not match its manifest.');if(parsed.kind!==kind)throw Error('CSV chart type does not match its manifest field.');
   if(kind==='time'){const years=parsed.rows.map(r=>Number(r.label.slice(0,4)));if(years.some(y=>y<Number(item.from.slice(0,4))-1||y>Number(item.to.slice(0,4))))throw Error('CSV observations fall outside the export years.');if(parsed.rows.some((r,i)=>i&&r.label<=parsed.rows[i-1].label))throw Error('Timeline must be chronological.');}
   // Monthly CSVs can include the current, unfinished month. Retain the published
   // value, but mark it incomplete using the export request's actual end date.
   const rows=parsed.rows.map(row=>{
    if(kind!=='time'||row.label.length!==7)return row;
    const [year,month]=row.label.split('-').map(Number);
    const end=new Date(Date.UTC(year,month,0)).toISOString().slice(0,10);
    return row.label+'-01'<=item.to&&end>item.to?{...row,partial:true}:row;
   });
   record[kind]={rows,file,sha256:createHash('sha256').update(raw).digest('hex')};
  }
  if(!record.time&&!record.region)throw Error('Each export needs a source CSV.');exports.push(record);
 }
}
const result={version:1,acquisition:manifest.acquisition,exports};
await writeFile(output+'.tmp',JSON.stringify(result,null,2)+'\n');await rename(output+'.tmp',output);
console.log(`Google Trends: ${exports.length} source-backed exports compiled. ${exports.length?'':'No observations published.'}`);
