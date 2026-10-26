import {env} from "cloudflare:workers";
import {bindings,response,sameOrigin,body} from "../../../../server/campaign";
import {studyId,surveyVersion,validateAnswers,nextPhase,type Phase} from "../../../survey/rihanna-clf/questions";
type RecordRow={phase:Phase;answers:string;session_id:string};
const completeCode="AA62BEED",screenOutCode="B406DE59";
function result(row:RecordRow){const code=row.phase==="complete"?completeCode:row.phase==="screened_out"?screenOutCode:null;return response({phase:row.phase,answers:JSON.parse(row.answers),...(code?{code,completionUrl:`https://app.prolific.com/submissions/complete?cc=${code}`}:{})});}
async function isOpen(){const db=bindings().CAMPAIGN_DB;if(!db)return false;const setting=await db.prepare("SELECT enabled FROM prolific_pilot_settings WHERE id=? AND study_id=?").bind(surveyVersion,studyId).first<{enabled:number}>();return setting?.enabled===1;}
export async function GET(){try{return response({open:await isOpen()});}catch{return response({open:false});}}
export async function POST(request:Request){
 if(!sameOrigin(request))return response({error:"Please use the survey page."},403);
 const db=bindings().CAMPAIGN_DB;
 if(!db)return response({error:"Survey storage is unavailable. Please try again later."},503);
 try{
  if(!await isOpen())return response({error:"Recruitment has not opened. Please return to Prolific."},409);
  const input=await body(request);
  if(input.study!==studyId||![input.participant,input.session].every(v=>typeof v==="string"&&/^[a-f0-9]{24}$/.test(v)))return response({error:"Please enter this survey from your Prolific study link."},400);
  const secret=(env as unknown as {PROLIFIC_API_TOKEN?:string}).PROLIFIC_API_TOKEN;
  if(!secret)return response({error:"Survey verification is temporarily unavailable."},503);
  // Verify all claimed identifiers with Prolific before accepting any response.
  const check=await fetch(`https://api.prolific.com/api/v1/submissions/${input.session}/`,{headers:{Authorization:`Token ${secret}`},signal:AbortSignal.timeout(12000)});
  if(!check.ok)return response({error:"We could not verify your Prolific participation. Please retry or contact the researcher on Prolific."},403);
  const submission=await check.json() as {participant_id?:string;participant?:string;study_id?:string;study?:string;status?:string};
  if((submission.participant_id||submission.participant)!==input.participant||(submission.study_id||submission.study)!==studyId)return response({error:"This Prolific submission does not match the study link."},403);
  const read=()=>db.prepare("SELECT phase, answers, session_id FROM prolific_pilot_responses WHERE study_id=? AND participant_id=?").bind(studyId,input.participant).first<RecordRow>();
  const existing=await read();
  if(existing&&existing.session_id!==input.session)return response({error:"A response for this participant already exists. Please contact the researcher on Prolific."},409);
  if(existing&&(existing.phase==="complete"||existing.phase==="screened_out"))return result(existing);
  if(submission.status!=="ACTIVE")return response({error:"Your Prolific submission is no longer active. Please contact the researcher on Prolific."},409);
  if(input.action==="start"){
   if(input.consent!==true)return response({error:"Consent is required to start."},400);
   await db.prepare("INSERT OR IGNORE INTO prolific_pilot_responses (study_id,participant_id,session_id,version,phase) VALUES (?,?,?,?,?)").bind(studyId,input.participant,input.session,surveyVersion,"screen").run();
   const row=await read();if(!row)throw new Error("Unable to start the survey.");return result(row);
  }
  if(input.action!=="answer"||!existing)return response({error:"Please begin the survey first."},400);
  // Replayed/back-button requests return saved progress; prior awareness cannot be rewritten.
  if(input.phase!==existing.phase)return result(existing);
  let answers;try{answers=validateAnswers(existing.phase,input.answers);}catch(e){return response({error:(e as Error).message},400);}
  const phase=nextPhase(existing.phase,answers);
  await db.prepare("UPDATE prolific_pilot_responses SET answers=?,phase=?,updated_at=datetime('now') WHERE study_id=? AND participant_id=? AND phase=?").bind(JSON.stringify({...JSON.parse(existing.answers),...answers}),phase,studyId,input.participant,existing.phase).run();
  const saved=await read();if(!saved)throw new Error("Unable to save your response.");return result(saved);
 }catch{return response({error:"We could not save your response. Please retry; contact the researcher on Prolific if the problem continues."},503);}
}
