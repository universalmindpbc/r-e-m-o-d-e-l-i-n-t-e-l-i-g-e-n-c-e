"use client";
import {useEffect,useState,type CSSProperties} from 'react';
import {useWorkspace} from '../WorkspaceProvider';
import {useCampaign} from '../CampaignProvider';
import type {NetworkSnapshot,NetworkCandidate,NetworkCategory} from './types';
import {networkIdentity} from './workflow';
import styles from './network.module.css';
import {categories,centers,nodeSize,constellationPositions} from './geometry';

export default function Network(){
 const {api,id,synthetic}=useWorkspace();const key=`rmu-network-${id}-shortlist-v1`;
 const {snapshot:campaign,loading}=useCampaign();
 const [data,setData]=useState<NetworkSnapshot|null>(null),[error,setError]=useState('');
 const [selected,setSelected]=useState<string|null>(null),[filter,setFilter]=useState<NetworkCategory|null>(null);
 const [page,setPage]=useState(0);
 const [shortlist,setShortlist]=useState<string[]>([]),[details,setDetails]=useState(false);
 useEffect(()=>{let alive=true;fetch(api('/api/network'),{cache:'no-store'}).then(async r=>{if(!r.ok)throw Error(r.status===410?'This research snapshot has expired. A refresh is required.':'Network research is unavailable.');return r.json();}).then(d=>{if(alive)setData(d);}).catch(e=>{if(alive)setError(e.message);});
 try{const saved=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(saved))queueMicrotask(()=>{if(alive)setShortlist(saved.filter((v:unknown)=>typeof v==='string'));});}catch{/* Optional local selection. */}
 return()=>{alive=false;};},[api,key]);
 const visible=data?.candidates.slice(page*20,(page+1)*20)||[];
 function changePage(next:number){setPage(next);setSelected(null);setFilter(null);setDetails(false);}
 const candidate=visible.find(c=>c.id===selected);
 function toggle(c:NetworkCandidate){const next=shortlist.includes(c.id)?shortlist.filter(id=>id!==c.id):[...shortlist,c.id];setShortlist(next);try{localStorage.setItem(key,JSON.stringify(next));}catch{/* Export remains available. */}}
 function exportShortlist(){if(!data)return;const chosen=data.candidates.filter(c=>shortlist.includes(c.id));const text=['NETWORK / DRAFT PARTNERSHIP SHORTLIST',data.campaign,synthetic?'SYNTHETIC PLACEHOLDERS. No actual partners or endorsements.':'Proposed partners; no endorsement or availability confirmed.','',...chosen.flatMap(c=>[c.name+' / '+c.category,'Origin: '+c.origin,'Followers: '+(c.followers??'Not collected'),'Proposed role: '+c.role,'Rationale: '+c.rationale,'Alignment: '+c.alignment,'Limitations: '+c.limitation,...[...c.evidence,...c.research].map(e=>e.label+': '+e.url),''])].join('\n');const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=`${id}-Network-${synthetic?'SYNTHETIC':'draft'}-shortlist.txt`;a.click();URL.revokeObjectURL(url);}
 const points=constellationPositions(visible);
 const matches=data&&networkIdentity(campaign.settings)===data.campaignIdentity;
 return <section className={styles.page} aria-label="Network partnerships">
 <header className={styles.heading}><small>{synthetic?"NO MORE VIOLENCE / SYNTHETIC NETWORK":"RIHANNA / CLARA LIONEL FOUNDATION"}</small><h1>NETWORK</h1><p>Shared purpose. Different voices.</p></header>
 {loading?<div className={styles.empty}>Loading campaign…</div>:error?<div role="alert" className={styles.empty}>{error}</div>:!data?<div role="status" className={styles.empty}>Loading researched network…</div>:!matches?<div className={styles.empty}>This researched network belongs to Rihanna / CLF. A separate network is required for the selected campaign.</div>:<>
 <div className={styles.graph} aria-label="Proposed partnership constellation">
 <svg viewBox="0 0 1000 600" preserveAspectRatio="none" aria-hidden="true" className={styles.lines}>
 {points.flatMap((p,i)=>points.slice(i+1).filter(q=>q.c.category===p.c.category&&Math.hypot(q.x-p.x,q.y-p.y)<26).map(q=><line key={p.c.id+q.c.id} x1={p.x*10} y1={p.y*6} x2={q.x*10} y2={q.y*6} style={{strokeDasharray:'none',opacity:.45}}/>))}
 {points.map(p=><line key={p.c.id} x1={480} y1={310} x2={p.x*10} y2={p.y*6} className={selected===p.c.id?styles.activeLine:''} opacity={filter && p.c.category!==filter ? .07 : undefined}/>)}
 </svg>
 <div data-network-hub className={styles.hub}><span>{synthetic?"NO MORE":"RIHANNA"}</span><small>{synthetic?"VIOLENCE":"+ CLF"}</small></div>
 {categories.map(cat=><button key={cat} data-network-label className={styles.group} style={{left:centers[cat][0]+'%',top:(centers[cat][1]-21)+'%'}} aria-pressed={filter===cat} onClick={()=>setFilter(filter===cat?null:cat)}>{cat}<small>{visible.filter(c=>c.category===cat).length}</small></button>)}
 {points.map(({c,x,y},i)=><button key={c.id} data-network-id={c.id} aria-label={c.name+', '+c.category} aria-pressed={selected===c.id} onMouseEnter={()=>{if(!details){setSelected(c.id);setDetails(false);}}} onFocus={()=>{setSelected(c.id);setDetails(false);}} onClick={()=>{setSelected(c.id);setDetails(true);}} className={[styles.node,selected===c.id?styles.active:'',filter&&c.category!==filter?styles.dim:''].join(' ')} style={{left:x+'%',top:y+'%','--size':nodeSize(c.followers)+'cqw','--delay':i*.43+'s'} as CSSProperties}><span className={styles.dot}/><span className={styles.nodeLabel}>{c.name}</span></button>)}
 </div>
 <aside key={candidate?.id||'intro'} className={styles.detail} aria-live="polite">
 {candidate?<><small className={styles.eyebrow}>{candidate.category} / PROPOSED PARTNER</small><h2>{candidate.name}</h2>{!synthetic&&<a href={candidate.profileUrl||'https://x.com/'+candidate.handle} target="_blank" rel="noreferrer">{candidate.handle?'@'+candidate.handle:'Public source'} ↗</a>}
 <div className={styles.metrics}><strong>{candidate.followers===null?'—':Intl.NumberFormat('en',{notation:'compact',maximumFractionDigits:1}).format(candidate.followers)}</strong><span>{synthetic?"Synthetic followers":"X followers"}<small>{candidate.followers===null?'Not collected':new Date(data.retrievedAt).toLocaleDateString('en-AU')}</small></span><b>{candidate.observedPosts}<small>sample posts</small></b></div>
 <h3>Proposed role</h3><p>{candidate.role}</p><h3>Why this connection</h3><p>{candidate.rationale}</p>
 <button className={styles.textButton} onClick={()=>setDetails(!details)} aria-expanded={details}>{details?'Hide evidence ↑':'Explore evidence ↓'}</button>
 {details&&<div className={styles.evidence}><h3>Cause alignment</h3><p>{candidate.alignment}</p><h3>Research / {candidate.confidence.toLowerCase()} evidence</h3><p>{candidate.researchNote}</p><p>{synthetic?'Fictional placeholder.':candidate.origin==='observed'?'Observed in the X sample.':'Discovered through wider-web research.'} {candidate.connection}</p><h3>Still to establish</h3><p>{candidate.limitation}</p>{[...candidate.evidence,...candidate.research].map((s,i)=><a key={i} href={s.url} target="_blank" rel="noreferrer">{s.label} ↗</a>)}</div>}
 <button className={styles.shortlist} aria-pressed={shortlist.includes(candidate.id)} onClick={()=>toggle(candidate)}>{shortlist.includes(candidate.id)?'✓ In my shortlist':'＋ Add to my shortlist'}</button>
 </>:<><small className={styles.eyebrow}>CULTURE JAMMING</small><h2>One purpose.<br/>Many perspectives.</h2><p>{synthetic?"Explore 20 fictional partner placeholders across culture, community, media and creators.":"Explore 20 potential partners across culture, community, media and creators."}</p><p>Select a node to see its proposed role and supporting evidence.</p></>}
 </aside>
 <div className={styles.bottom}><button onClick={()=>{setSelected(null);setFilter(null);setDetails(false);}}>Reset view</button><button onClick={exportShortlist} disabled={!shortlist.length}>Export shortlist ({data.candidates.filter(c=>shortlist.includes(c.id)).length}) ↓</button><a href={synthetic?"/intelligence/violence/#report":"/network/report"} target="_blank" rel="noreferrer">Network report ↗</a>{data.candidates.length>20&&<><button aria-label="Previous partners" disabled={page===0} onClick={()=>changePage(page-1)}>← Previous</button><button aria-label="Next partners" disabled={(page+1)*20>=data.candidates.length} onClick={()=>changePage(page+1)}>Next →</button></>}</div>
 <details className={styles.method}><summary>Evidence &amp; method</summary><div><p>Connections represent proposals, not confirmed relationships. Size reflects known X followers; accounts without collected metrics use a neutral size.</p><p>{data.status} · {data.period}. {data.gaps}</p><ul>{data.methodology.map(s=><li key={s}>{s}</li>)}</ul></div></details>
 </>}
 </section>;
}
