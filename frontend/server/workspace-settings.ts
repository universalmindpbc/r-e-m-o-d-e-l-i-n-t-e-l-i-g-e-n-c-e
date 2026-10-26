import {bindings} from './campaign';
import {campaignDefaults} from '../app/campaign-config';
import {demoDefaults} from '../app/synthetic-config';
const violence={name:'No More Violence',talent:'Global Electronic Music Industry',agency:'Re-Model Universe',topics:['#NoMoreViolence','domestic violence','violent extremism'],analysisStartDate:'2026-01-01',analysisEndDate:'2026-10-20',announcementDate:'2026-01-01',endDateMeaning:'Synthetic demonstration window; launch date not confirmed'};
export function workspace(request:Request){const id=new URL(request.url).searchParams.get('workspace')||'climate-justice';if(!['climate-justice','violence'].includes(id))throw Error('Unknown workspace.');return id;}
export async function readSettings(id:string,kind:'campaign'|'synthetic'){
 const db=bindings().CAMPAIGN_DB;const fallback=kind==='campaign'?(id==='violence'?violence:campaignDefaults):demoDefaults;
 if(!db)return {settings:fallback,version:0,updatedAt:null,writable:false};
 const table=kind==='campaign'?'campaign_settings':'synthetic_settings';
 const query=id==='climate-justice'?db.prepare(`SELECT settings, version, updated_at FROM ${table} WHERE id=1`):db.prepare('SELECT settings, version, updated_at FROM workspace_settings WHERE workspace=? AND kind=?').bind(id,kind);
 const row=await query.first<{settings:string;version:number;updated_at:string}>();
 return {settings:row?(kind==='synthetic'?{...demoDefaults,...JSON.parse(row.settings)}:JSON.parse(row.settings)):fallback,version:row?.version??0,updatedAt:row?.updated_at??null,writable:!!row};
}
export async function saveSettings<T>(id:string,kind:'campaign'|'synthetic',settings:T,version:number){
 const db=bindings().CAMPAIGN_DB;if(!db)throw Error('Shared storage unavailable.');const updatedAt=new Date().toISOString();
 const table=kind==='campaign'?'campaign_settings':'synthetic_settings';
 const query=id==='climate-justice'?db.prepare(`UPDATE ${table} SET settings=?, version=version+1, updated_at=? WHERE id=1 AND version=?`).bind(JSON.stringify(settings),updatedAt,version):db.prepare('UPDATE workspace_settings SET settings=?, version=version+1, updated_at=? WHERE workspace=? AND kind=? AND version=?').bind(JSON.stringify(settings),updatedAt,id,kind,version);
 const result=await query.run();return result.meta.changes===1?{settings,version:version+1,updatedAt,writable:true}:null;
}
