"use client";
import {useState} from 'react';
import {useResearchData} from './ApprovedData';
import type {ResearchView} from './ResearchBrief';
const questions=[['seeing','What are we seeing?'],['evidence','What supports it?'],['challenge','What challenges it?'],['change','What should we change?'],['test','How will we test that?']] as const;
export function jumpToOverview(event:React.MouseEvent<HTMLAnchorElement>,id:string){
 event.preventDefault();const target=event.currentTarget.closest('dialog')?.querySelector<HTMLElement>(`[id="${id}"]`);
 if(target){target.scrollIntoView({block:'start',behavior:'instant'});target.focus({preventScroll:true});}
}
export default function OverviewContents({view}:{view:ResearchView}){
 const research=useResearchData();const [question,setQuestion]=useState<string|null>(null);
 if(!research)return null;
 const findings=research.findings.filter(f=>f.views.includes(view));
 return <nav className="overview-contents" id="overview-contents" tabIndex={-1} aria-label="Explore this analysis">
 <div className="overview-contents-heading"><strong>Explore this analysis</strong><a href="#overview-visuals" onClick={e=>jumpToOverview(e,'overview-visuals')}>Charts & engagement ↓</a><a href={`#research-${view.replaceAll(' ','-')}-method`} onClick={e=>jumpToOverview(e,`research-${view.replaceAll(' ','-')}-method`)}>Sources & method ↓</a></div>
 <div className="overview-questions">{questions.map(([key,label])=><button key={key} type="button" aria-expanded={question===key} aria-controls="overview-destinations" onClick={()=>setQuestion(question===key?null:key)}>{label}<span aria-hidden="true">{question===key?'−':'+'}</span></button>)}</div>
 {question&&<div className="overview-destinations" id="overview-destinations"><p>{questions.find(q=>q[0]===question)?.[1]} <span>Choose a finding</span></p>{findings.length?findings.map((f,i)=>{const id=`research-${view.replaceAll(' ','-')}-${i}-${question}`;return <a key={f.title} href={`#${id}`} onClick={e=>jumpToOverview(e,id)}><span>{String(i+1).padStart(2,'0')}</span>{f.title}<span aria-hidden="true">↓</span></a>}):<p>No findings are available for this perspective yet.</p>}</div>}
 </nav>;
}
