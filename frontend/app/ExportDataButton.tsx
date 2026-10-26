"use client";
import {useWorkspace} from "./WorkspaceProvider";
import {useSynthetic} from "./SyntheticProvider";
import {useCampaign} from "./CampaignProvider";
import {violenceDemo} from "./violence-demo";
import {useState} from "react";
import type {CampaignSettings} from "./campaign-config";
type Run={id:string;campaign:{name:string;talent:string;topics:string[]};starts_on:string;ends_on:string};
const identity=(campaign:Pick<CampaignSettings,"name"|"talent"|"topics">,start:string,end:string)=>JSON.stringify([campaign.name,campaign.talent,campaign.topics.map(t=>t.toLowerCase()).sort(),start.slice(0,10),end.slice(0,10)]);
async function read(url:string){const response=await fetch(url,{cache:"no-store"});if(!response.ok)throw new Error("Collection unavailable. Please retry.");return response.json();}
export default function ExportDataButton({dashboard=false}:{dashboard?:boolean}) {
 const {api,synthetic}=useWorkspace();const {snapshot}=useCampaign();const {snapshot:demo}=useSynthetic();
 const [busy,setBusy]=useState(false),[error,setError]=useState("");
 async function download(){
  if(busy)return;setBusy(true);setError("");
  try{
   if(synthetic){const {research}=violenceDemo(snapshot.settings,demo.settings);const quote=(v:unknown)=>'"'+String(v??'').replaceAll('"','""')+'"';const csv=['data_status,id,cohort,text,created_at,likes,replies,reposts,quotes',...research.evidence.map(p=>['SYNTHETIC EXAMPLE',p.id,p.cohort,p.text_content,p.created_at,p.metrics?.like_count,p.metrics?.reply_count,p.metrics?.retweet_count,p.metrics?.quote_count].map(quote).join(','))].join('\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));const a=document.createElement('a');a.href=url;a.download='No-More-Violence-SYNTHETIC.csv';a.click();URL.revokeObjectURL(url);return;}
   const [config,data]=await Promise.all([read(api('/api/campaign')),read('/api/intelligence/workflows')]);
   const campaign:CampaignSettings=config.settings;
   const run:Run|undefined=data.runs.find((r:Run)=>identity(r.campaign,r.starts_on,r.ends_on)===identity(campaign,campaign.analysisStartDate,campaign.analysisEndDate));
   if(!run)throw new Error("No collection is available for this campaign yet.");
   const response=await fetch(`/api/intelligence/workflows/${run.id}/export.csv`,{cache:"no-store"});
   if(!response.ok||!response.headers.get('Content-Type')?.includes('text/csv'))throw new Error("CSV download unavailable. Please retry.");
   const url=URL.createObjectURL(await response.blob());const link=document.createElement('a');
   link.href=url;link.download=`rmu-${campaign.talent.toLowerCase().replace(/[^a-z0-9]+/g,'-')}-${run.id}.csv`;
   document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
  }catch(e){setError(e instanceof Error?e.message:"CSV download unavailable. Please retry.");}finally{setBusy(false);}
 }
 return <><button type="button" onClick={()=>{void download();}} disabled={busy} aria-label="Export collection data"><span>{busy?"Preparing CSV…":dashboard?"EXPORT DATA":"Export collection data"}</span>{dashboard&&<i aria-hidden="true">↓</i>}</button>{error&&<span role="alert" className="export-data-error">{error}</span>}</>;
}
