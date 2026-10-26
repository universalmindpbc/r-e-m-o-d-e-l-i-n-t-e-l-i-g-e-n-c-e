import {networkRevision} from "../../../network/workflow";
import {validateReview} from "../../../network/review-validation";
import snapshot from '../../../../server/network-demo.json';
import {authenticated,bindings,body,response,sameOrigin} from '../../../../server/campaign';
import {networkCampaignMatches,reviewedNetwork} from '../../../../server/network';
export async function POST(request:Request){
 if(!sameOrigin(request))return response({error:'Request origin not allowed.'},403);
 if(!await authenticated(request))return response({error:'Unlock Admin to record a human review.'},401);
 try{
 const data=await body(request);const revision=await networkRevision(snapshot);const candidate=snapshot.candidates.find(c=>c.id===data.candidateId);
 if(data.revision!==revision||data.campaignIdentity!==snapshot.campaignIdentity||!await networkCampaignMatches())return response({error:'Campaign or research revision changed. Reload before reviewing.'},409);
 if(Date.now()>Date.parse(snapshot.expiresAt))return response({error:'Refresh the research before reviewing.'},410);
 try{validateReview(data,snapshot.candidates.map(c=>c.id));}catch(e){return response({error:e instanceof Error?e.message:'Invalid review.'},400);}
 if(!candidate)return response({error:'Unknown candidate.'},400);
 if(data.status==='approved'&&(!candidate.research.length||!candidate.alignment||!candidate.limitation))return response({error:'Complete the research evidence before approval.'},400);
 const db=bindings().CAMPAIGN_DB;if(!db)return response({error:'Review storage unavailable.'},503);
 await db.prepare('INSERT INTO network_review_events (campaign_identity,revision,candidate_id,status,reviewer,note,created_at) VALUES (?,?,?,?,?,?,?)').bind(snapshot.campaignIdentity,revision,candidate.id,data.status,data.reviewer.trim(),data.note.trim(),new Date().toISOString()).run();
 return response(await reviewedNetwork());
 }catch{return response({error:'Review could not be saved. Your draft is retained.'},503);}
}
