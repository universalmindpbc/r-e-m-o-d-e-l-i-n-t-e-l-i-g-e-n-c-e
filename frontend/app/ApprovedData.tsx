"use client";
import {createContext,useContext,useEffect,useState,type ReactNode} from 'react';
import type {ResearchData} from './ResearchBrief';
import {useWorkspace} from './WorkspaceProvider';
import {useSynthetic} from './SyntheticProvider';
import {violenceDemo} from './violence-demo';
import {useCampaign} from './CampaignProvider';
type MappedFinding={meaning:string;change:string;test:string;evidence:string;sources:string[]};
type RunHeader={id:string;workflow:{state:string;updated_at?:string};campaign:{name:string;talent:string;topics:string[]};starts_on:string;ends_on:string};
export type ApprovedData={campaignIdentity?:string;version:string;run_id:string;overview:{framing?:{favourable:number;critical:number;mixed:number;descriptive:number;uncertain:number;total:number;newsPosts:number}|null;audienceScope?:string;organisationPosts?:number;inferredFanAccounts?:number;talentPosts:number;fanPosts:number;fanAccounts:number;reviewedLabels:number;priorities:number;themes:{name:string;posts:number;stance:number[];relevantAccounts?:number;notDiscussedAccounts?:number;uncertainRelevanceAccounts?:number;interpretation:string;evidence:{record_id:string;cohort:string;quote:string;stance:string;reason:string}[]}[]};messaging:{shared:Record<string,string>;actions:Record<string,string>} & Record<`${"Talent"|"Audience"|"Society"}${number}`,MappedFinding>;provenance:{model:string;review:string;total_posts:number;source_selection:string};evidence:{id:string;text_content:string;source_url:string;cohort:string}[]};
const ResearchContext=createContext<ResearchData|null>(null);
export const useResearchData=()=>useContext(ResearchContext);
const StatusContext=createContext({loading:true,error:""});
export const useApprovedDataStatus=()=>useContext(StatusContext);
const Context=createContext<ApprovedData|null>(null);
export const useApprovedData=()=>useContext(Context);
export function ApprovedDataProvider({children}:{children:ReactNode}){
 const {synthetic}=useWorkspace();return synthetic?<SyntheticApprovedData>{children}</SyntheticApprovedData>:<CollectedApprovedData>{children}</CollectedApprovedData>;
}
function SyntheticApprovedData({children}:{children:ReactNode}){const {snapshot}=useCampaign();const {snapshot:demo,loading,error}=useSynthetic();const data=violenceDemo(snapshot.settings,demo.settings);return <StatusContext.Provider value={{loading,error}}><Context.Provider value={data.mapped}><ResearchContext.Provider value={data.research}>{children}</ResearchContext.Provider></Context.Provider></StatusContext.Provider>;}
function CollectedApprovedData({children}:{children:ReactNode}){
 const {snapshot,loading:campaignLoading,error:campaignError}=useCampaign();const [value,setValue]=useState<ApprovedData|null>(null);
 const [research,setResearch]=useState<ResearchData|null>(null);
 const [status,setStatus]=useState({identity:"",loading:true,error:""});
 const identity=JSON.stringify([snapshot.settings.name,snapshot.settings.talent,snapshot.settings.topics.map(t=>t.toLowerCase()).sort(),snapshot.settings.analysisStartDate,snapshot.settings.analysisEndDate]);
 useEffect(()=>{if(campaignLoading||campaignError)return;let stopped=false;let inFlight=false;let mappedRunId="";const controller=new AbortController();
 const read=async()=>{if(inFlight)return;inFlight=true;try{
  const list=await fetch('/api/intelligence/workflows',{cache:'no-store',signal:controller.signal}).then(r=>{if(!r.ok)throw Error();return r.json();});
  const run=list.runs.find((r:RunHeader)=>JSON.stringify([r.campaign.name,r.campaign.talent,r.campaign.topics.map((t:string)=>t.toLowerCase()).sort(),r.starts_on.slice(0,10),r.ends_on.slice(0,10)])===identity);
  if(!run){mappedRunId="";if(!stopped){setValue(null);setResearch(null);setStatus({identity,loading:false,error:"No saved X analysis is available for this campaign."});}return;}
  const revision=run.id+":"+(run.workflow.updated_at||run.workflow.state);
  if(revision===mappedRunId)return;
  const detail=await fetch(`/api/intelligence/workflows/${run.id}`,{cache:'no-store',signal:controller.signal}).then(r=>{if(!r.ok)throw Error();return r.json();});
  const deep=detail.analyses?.find((a:{metric_version:string})=>a.metric_version==='research-brief-v1')?.result;
  if(!stopped)setResearch(deep?{...deep,campaignIdentity:identity,evidence:detail.evidence||[],classifications:detail.classifications||[],priorities:detail.analyses?.find((a:{metric_version:string})=>a.metric_version==='campaign-priorities-v1')?.result}:null);
  const mapped=detail.analyses?.find((a:{metric_version:string;result:ApprovedData})=>a.metric_version==='approved-panels-v4')?.result || detail.analyses?.find((a:{metric_version:string;result:ApprovedData})=>a.metric_version==='approved-panels-v3')?.result || detail.analyses?.find((a:{metric_version:string;result:ApprovedData})=>a.metric_version==='approved-panels-v2')?.result || detail.analyses?.find((a:{metric_version:string;result:ApprovedData})=>a.metric_version==='approved-panels-v1')?.result;
  mappedRunId=revision;
  if(mapped){
   const relevant=new Set((detail.classifications||[]).filter((c:{codebook_version:string;provenance:{relevance:string}})=>['approved-overview-v1','approved-overview-v2'].includes(c.codebook_version)&&c.provenance.relevance==='relevant').map((c:{observation_id:string;theme:string})=>`${c.observation_id}:${c.theme}`));
   mapped.overview.themes.forEach((t:ApprovedData['overview']['themes'][number])=>t.evidence.sort((a,b)=>Number(relevant.has(`${b.record_id}:${t.name}`))-Number(relevant.has(`${a.record_id}:${t.name}`))));
  }
  if(!stopped){setValue(mapped?{...mapped,campaignIdentity:identity,evidence:detail.evidence||[]}:null);setStatus({identity,loading:false,error:mapped||deep?"":"No saved X analysis is available for this campaign."});}
 }catch{mappedRunId="";if(!stopped)setStatus({identity,loading:false,error:"X analysis could not be loaded. Retrying automatically…"});}finally{inFlight=false;}};
 void read();const timer=setInterval(read,15000);return()=>{stopped=true;controller.abort();clearInterval(timer);};},[identity,campaignLoading,campaignError]);
 return <StatusContext.Provider value={{loading:campaignLoading||(!campaignError&&(status.identity!==identity||status.loading)),error:campaignError||(status.identity===identity?status.error:"")}}><Context.Provider value={value?.campaignIdentity===identity?value:null}><ResearchContext.Provider value={research?.campaignIdentity===identity?research:null}>{children}</ResearchContext.Provider></Context.Provider></StatusContext.Provider>;
}
export function ApprovedSources({ids}:{ids:string[]}){const data=useApprovedData();return <>{ids.map(id=>{const post=data?.evidence.find(e=>e.id===id);return post?<p key={id}><a href={post.source_url} target="_blank" rel="noreferrer">View source post ↗</a> · {post.cohort.replaceAll('_',' ')}<br/>{post.text_content}</p>:null;})}</>;}
