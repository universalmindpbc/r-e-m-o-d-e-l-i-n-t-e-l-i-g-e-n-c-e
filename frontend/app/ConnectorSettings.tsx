"use client";
import {useEffect,useState} from "react";
import {connectors,connectorGroups,type ConnectorGroup} from "./connector-config";
export default function ConnectorSettings({signedIn,onSynthetic}:{signedIn:boolean;onSynthetic:()=>void}) {
 const [group,setGroup]=useState<ConnectorGroup>("Listening");const [active,setActive]=useState("brand24");
 const [selected,setSelected]=useState<string[]>([]);const [version,setVersion]=useState(0);const [ready,setReady]=useState(false);const [busy,setBusy]=useState(false);const [dirty,setDirty]=useState(false);const [message,setMessage]=useState("");const [error,setError]=useState(false);
 const load=async()=>{setReady(false);setMessage("");try{const r=await fetch("/api/admin/connectors",{cache:"no-store"});const d=await r.json();if(!r.ok)throw new Error(d.error);setSelected(d.settings.selected);setVersion(d.version);setReady(true);setDirty(false);setError(false);}catch(e){setMessage(e instanceof Error?e.message:"Could not load selections.");setError(true);}};
 useEffect(()=>{let active=true;queueMicrotask(()=>{if(active&&signedIn)void load();});return()=>{active=false;};},[signedIn]);
 const save=async()=>{setBusy(true);try{const r=await fetch("/api/admin/connectors",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({settings:{selected},version})});const d=await r.json();if(!r.ok)throw new Error(d.error);setVersion(d.version);setDirty(false);setError(false);setMessage("Source selections saved. No services connected or searches started.");}catch(e){setMessage(e instanceof Error?e.message:"Could not save selections.");setError(true);}finally{setBusy(false);}};
 const current=connectors.find(c=>c.id===active)!;
 return <section className="connector-settings" aria-label="Connector settings">
 <div className="connector-intro"><div><h2>Data connections</h2><p>Choose the sources to set up for your intelligence workspace.</p></div><span className="connector-status">0 connected · {connectors.length} in catalogue</span></div>
 <p className="connector-disclosure">Selections are a setup plan. Each source stays off until its integration and authorised access are verified.</p>
 <nav className="connector-groups" aria-label="Connector categories">{connectorGroups.map(g=><button type="button" key={g} aria-pressed={group===g} onClick={()=>{setGroup(g);setActive(connectors.find(c=>c.group===g)!.id);}}>{g}<span>{connectors.filter(c=>c.group===g).length}</span></button>)}</nav>
 <div className="connector-grid">{connectors.filter(c=>c.group===group).map(c=><article className={`connector-card ${active===c.id?"is-selected":""}`} key={c.id}>
 <button type="button" className="connector-detail" aria-pressed={active===c.id} onClick={()=>setActive(c.id)}><strong>{c.name}</strong><span>{c.purpose}</span></button>
 <div className="connector-card-footer"><small>Not connected</small><button type="button" role="switch" aria-label={`Include ${c.name} in setup`} aria-checked={selected.includes(c.id)} disabled={!signedIn||!ready||busy} onClick={()=>{setSelected(v=>v.includes(c.id)?v.filter(id=>id!==c.id):[...v,c.id]);setDirty(true);setMessage("");}}><span className="connector-switch"/><span>Plan setup</span></button></div>
 </article>)}</div>
 <aside className="connector-next" aria-live="polite"><div><span>SETUP REQUIREMENTS</span><h3>{current.name}</h3></div><p>{current.setup} {current.id==="synthetic"&&<button type="button" onClick={onSynthetic}>Edit demo figures →</button>} {current.url&&<a href={current.url} target="_blank" rel="noreferrer">Official API guide ↗</a>}</p></aside>
 <div className="admin-actions"><button type="button" className="connector-save" onClick={save} disabled={!signedIn||!ready||!dirty||busy}>{busy?"Saving…":"Save source selections"}</button><button type="button" onClick={load} disabled={!signedIn||busy}>Reload selections</button><span>{!signedIn?"Unlock Admin to choose sources.":dirty?"Unsaved selections":ready?`${selected.length} selected for setup`:error?"Selections unavailable":"Loading selections…"}</span></div>
 <p className="admin-save-status" role={error?"alert":"status"}>{message}</p>
 </section>;
}
