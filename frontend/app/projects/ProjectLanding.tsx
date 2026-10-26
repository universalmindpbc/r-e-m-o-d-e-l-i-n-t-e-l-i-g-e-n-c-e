'use client';
/* eslint-disable @next/next/no-img-element */
import {useEffect} from 'react';
import s from './projects.module.css';
export default function ProjectLanding({legacyLinks=false}:{legacyLinks?:boolean}){
 useEffect(()=>{if(legacyLinks&&(window.location.hash||new URLSearchParams(window.location.search).has('admin')))window.location.replace('/intelligence/climate-justice/'+window.location.search+window.location.hash);},[legacyLinks]);
 return <main className={s.viewport}><section className={s.stage} aria-label="Re-Model Intelligence projects">
 <header className={s.header}><img src="/re-model-logo-lockup-white.png" alt="Re-Model — Re-imagining Impact"/><span>RE-MODEL INTELLIGENCE<span className={s.dot}> / </span>PROJECTS</span><span className={s.status}>CULTURE. EVIDENCE. IMPACT.</span></header>
 <div className={s.intro}><span className={s.eyebrow}>A SHARED INTELLIGENCE PLATFORM</span><h1>Different causes.<br/><span>Collective possibility.</span></h1><p>Explore the relationship between cultural influence,<br/>community needs and meaningful social change.</p></div>
 <div className={s.cards}>
 <a className={s.card} href="/intelligence/climate-justice/"><div className={s.image}><img src="/rihanna-global-citizen-poster.jpg" alt="Rihanna performing"/><span>01 / CLIMATE JUSTICE</span></div><div className={s.cardText}><span className={s.eyebrow}>RIHANNA · CLARA LIONEL FOUNDATION</span><h2>Climate Justice</h2><p>Cultural influence in service of climate resilience<br/>and communities on the frontlines.</p><strong>Explore project <b>↗</b></strong></div></a>
 <a className={`${s.card} ${s.violence}`} href="/intelligence/violence/"><div className={`${s.image} ${s.typographic}`}><div aria-hidden="true">NO MORE<br/>VIOLENCE<span>↗</span></div><span>02 / GLOBAL CAMPAIGN · AUSTRALIA FIRST</span></div><div className={s.cardText}><span className={s.eyebrow}>GLOBAL ELECTRONIC MUSIC INDUSTRY</span><h2>No More Violence</h2><p>Domestic violence. Violent extremism.<br/>Understanding vulnerability. Directing collective action.</p><strong>Explore project <b>↗</b></strong></div></a>
 </div>
 <footer className={s.footer}><span>RE-IMAGINING IMPACT</span><span>AUSTRALIA <i> / </i> USA <i> / </i> EU <i> / </i> ASIA <i> / </i> AFRICA</span><span>SELECT A PROJECT TO BEGIN ↗</span></footer>
 </section></main>;
}
