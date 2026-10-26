"use client";
import {useEffect,useState} from "react";
import {questions,description,validateAnswers,nextPhase,type Answers,type Phase} from "./questions";
import styles from "./survey.module.css";
type State={phase:Phase;answers:Answers;completionUrl?:string;code?:string};
export default function Survey({preview}:{preview:boolean}){
 const [ready,setReady]=useState(preview),[open,setOpen]=useState(false),[consent,setConsent]=useState(false),[declined,setDeclined]=useState(false);
 const [state,setState]=useState<State|null>(null),[answers,setAnswers]=useState<Answers>({}),[busy,setBusy]=useState(false),[error,setError]=useState("");
 useEffect(()=>{if(preview)return;fetch("/api/survey/rihanna-clf").then(r=>r.json()).then(d=>{setOpen(d.open===true);setReady(true);}).catch(()=>{setError("The survey is temporarily unavailable. Please try again later.");setReady(true);});},[preview]);
 async function send(action:string,extra:Record<string,unknown>={}){const p=new URLSearchParams(location.search);const r=await fetch("/api/survey/rihanna-clf",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action,participant:p.get("PROLIFIC_PID"),study:p.get("STUDY_ID"),session:p.get("SESSION_ID"),...extra})});const d=await r.json();if(!r.ok)throw new Error(d.error||"Unable to save. Please try again.");return d as State;}
 async function start(){setBusy(true);setError("");try{const s=preview?{phase:"screen" as const,answers:{}}:await send("start",{consent:true});setState(s);setAnswers(s.answers);}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 async function submit(e:React.FormEvent){e.preventDefault();if(!state)return;setBusy(true);setError("");try{const clean=validateAnswers(state.phase,answers);const s=preview?{phase:nextPhase(state.phase,clean),answers:{...state.answers,...clean}}:await send("answer",{phase:state.phase,answers:clean});setState(s);setAnswers(s.answers);document.getElementById("survey-top")?.scrollIntoView();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 function field(key:keyof typeof questions){return <fieldset key={key}><legend>{questions[key].title}</legend>{questions[key].options.map(option=><label key={option}><input type="radio" name={key} value={option} checked={answers[key]===option} onChange={()=>setAnswers(a=>({...a,[key]:option}))} required/>{option}</label>)}</fieldset>;}
 const finished=state?.phase==="complete"||state?.phase==="screened_out";
 return <main className={styles.shell}><article className={styles.card} id="survey-top"><header><span>RE-MODEL / RESEARCH</span><small>2–3 minutes</small></header>
 {preview&&<aside className={styles.preview}>PREVIEW ONLY · No answers are saved and no payment is triggered.</aside>}
 <h1>Music and charitable organisations</h1>
 {!ready?<p>Loading…</p>:!preview&&!open?<section><h2>Recruitment has not opened</h2><p>This study is being prepared. Please enter through Prolific once it opens.</p></section>:declined?<section><h2>You have not joined the study</h2><p>No survey answers have been collected. You can close this page and return the study on Prolific.</p></section>:!state?<section>
 <p>This independent Re-Model Intelligence study asks about music interests and charitable organisations. It is not commissioned by any artist or charitable organisation mentioned.</p>
 <p>Participation is voluntary. Some people complete only the screening questions ($0.20); eligible participants completing the full survey receive $0.60. You can stop at any time by returning the study on Prolific.</p>
 <details><summary>Your responses and privacy</summary><p>We collect your survey answers and Prolific participant and submission IDs to prevent duplicate responses and reconcile payment. These records are pseudonymous, not anonymous. Do not include names or contact details in the optional text answer.</p><p>Responses are stored in Re-Model’s Cloudflare-hosted research database. Only authorised research administrators can access individual records. Public reporting uses aggregate findings; free-text responses are not published automatically or used to train AI models.</p><p>Identifiable research records are retained for up to 90 days after submission, then deleted. Contact the researcher through Prolific for questions or a withdrawal request, quoting your participant ID. Prolific maintains its own records under its privacy policy.</p></details>
 <label className={styles.consent}><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/>I am 18 or older, have read the information above, and agree to participate.</label>
 <button disabled={!consent||busy} onClick={start}>{busy?"Starting…":"Begin survey"}</button><button className={styles.secondary} onClick={()=>setDeclined(true)}>I do not agree</button>
 </section>:finished?<section><h2>{state.phase==="complete"?"Thank you for sharing your views":"Thank you for answering the screening questions"}</h2><p>{preview?"This is the end of this preview path. No response has been submitted.":state.phase==="complete"?"Your response has been saved. Return to Prolific to record your completion.":"You do not qualify for the main survey. Your screening answers have been saved; return to Prolific to receive the $0.20 screening payment."}</p>{state.completionUrl&&<a className={styles.action} href={state.completionUrl}>Return to Prolific</a>}{state.code&&<p>Completion code: <strong>{state.code}</strong></p>}{preview&&<button onClick={()=>{setState(null);setAnswers({});setConsent(false);setDeclined(false);}}>Restart preview</button>}</section>:<form onSubmit={submit}>
 <p className={styles.progress}>{state.phase==="screen"?"1 / 3 · Music interests":state.phase==="awareness"?"2 / 3 · Your existing views":"3 / 3 · A short description"}</p>
 {state.phase==="screen"&&<>{field("currentFan")}{field("pastFan")}</>}
 {state.phase==="awareness"&&<>{field("rihannaFeeling")}{field("awareness")}{answers.awareness==="Yes"&&<>{field("knowledge")}<label className={styles.recall}>In a few words, what work do you associate with CLF?<small>Optional · “I don’t know” is welcome · 200 characters maximum</small><textarea maxLength={200} value={answers.workRecall||""} onChange={e=>setAnswers(a=>({...a,workRecall:e.target.value}))}/></label>{field("priorFeeling")}</>}</>}
 {state.phase==="description"&&<><blockquote>{description}</blockquote>{field("initiativeFeeling")}</>}
 <button disabled={busy} type="submit">{busy?"Saving…":state.phase==="description"?"Finish survey":"Continue"}</button>
 </form>}
 {error&&<p role="alert" className={styles.error}>{error}</p>}
 <footer>Independent research · Please answer from your own experience.</footer>
 </article></main>;
}
