"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import type {NetworkSnapshot} from "../types";
import styles from "./report.module.css";
export default function NetworkReport(){
 const [view,setView]=useState("draft");
 const [data,setData]=useState<NetworkSnapshot|null>(null),[error,setError]=useState("");
 useEffect(()=>{queueMicrotask(()=>setView(new URLSearchParams(window.location.search).get("view")==="approved"?"approved":"draft"));fetch("/api/network",{cache:"no-store"}).then(async r=>{if(!r.ok)throw Error("This Network snapshot is unavailable or expired.");return r.json();}).then(setData).catch(e=>setError(e.message));},[]);
 return <main className={styles.report}><header><Link href="/#network">← Network</Link><a href="/report">Main report ↗</a><button onClick={()=>window.print()}>Print / Save PDF</button></header>
 <p className={styles.kicker}>RE-MODEL INTELLIGENCE / NETWORK / {view==="approved"?"HUMAN-REVIEWED SELECTION":"DRAFT RESEARCH POOL"}</p><div><button onClick={()=>setView("draft")} aria-pressed={view==="draft"}>Draft research pool</button> <button onClick={()=>setView("approved")} aria-pressed={view==="approved"}>Reviewed recommendations</button></div><h1>Rihanna / CLF<br/>Proposed partnership network</h1>
 {error?<p role="alert">{error}</p>:!data?<p role="status">Loading research…</p>:<>
 <p className={styles.lead}>{view==="approved"?"Only candidates approved by a named human for this campaign and research revision appear below. Partner consent and availability remain unconfirmed.":"Draft research combining the observed X sample with wider-web discovery. This is not a client-approved strategy."}</p>
 <p>{data.period} · X profiles retrieved {new Date(data.retrievedAt).toLocaleDateString("en-AU")}</p>
 {view==="approved"&&!data.candidates.some(c=>c.review?.status==="approved")&&<p role="status">No recommendations have been human-approved yet. Complete the review in Network before sharing a client strategy.</p>}<section><h2>Selection rationale</h2><ul>{data.methodology.map(m=><li key={m}>{m}</li>)}</ul><p>{data.gaps}</p></section>
 {["Culture","Community","Media","Creators"].map(group=><section key={group}><h2>{group}</h2>{data.candidates.filter(c=>c.category===group&&(view!=="approved"||c.review?.status==="approved")).map(c=><article key={c.id}><h3>{c.name} <a href={c.profileUrl||"https://x.com/"+c.handle}>{c.handle?"@"+c.handle:"Public source"}</a></h3><small>{c.origin==="observed"?"Observed on X":"Wider-web discovery"} · {c.subtype} · {c.followers?.toLocaleString()??"Not collected"} X followers · {c.observedPosts} sample posts · {c.confidence} evidence</small><p><b>Proposed role:</b> {c.role}</p><p>{c.rationale}</p><p><b>Connection:</b> {c.connection}</p>{c.review?.at&&<p><b>Human review:</b> {c.review.status} by {c.review.reviewer} · {c.review.at.slice(0,10)}. {c.review.note}</p>}<p><b>Alignment:</b> {c.alignment}</p><p><b>Research:</b> {c.researchNote}</p><p><b>Limitations:</b> {c.limitation}</p><ul>{[...c.evidence,...c.research].map((s,i)=><li key={i}><a href={s.url} target="_blank" rel="noreferrer">{s.label} ↗</a></li>)}</ul></article>)}</section>)}
 <footer>Source run {data.sourceRun}. Estimated incremental API cost US$ {data.costEstimateUsd.toFixed(2)}; invoice reconciliation pending. Research is a dated snapshot, not a guarantee of suitability or campaign performance.</footer>
 </>}</main>;
}
