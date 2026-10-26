import snapshot from './network-demo.json';
import {bindings} from './campaign';
import {campaignDefaults,type CampaignSettings} from '../app/campaign-config';
import {networkIdentity,networkRevision} from '../app/network/workflow';
export async function networkCampaignMatches(){const db=bindings().CAMPAIGN_DB;const row=db?await db.prepare('SELECT settings FROM campaign_settings WHERE id=1').first<{settings:string}>():null;return networkIdentity(row?JSON.parse(row.settings) as CampaignSettings:campaignDefaults)===snapshot.campaignIdentity;}
export async function reviewedNetwork(){
 const revision=await networkRevision(snapshot);
 const db=bindings().CAMPAIGN_DB;if(!db)throw Error('Review storage unavailable');
 const row=await db.prepare("SELECT json_group_array(json_object('candidateId',candidate_id,'status',status,'reviewer',reviewer,'note',note,'at',created_at)) AS records FROM network_review_events WHERE id IN (SELECT max(id) FROM network_review_events WHERE campaign_identity=? AND revision=? GROUP BY candidate_id)").bind(snapshot.campaignIdentity,revision).first<{records:string}>();
 const reviews=JSON.parse(row?.records||'[]') as {candidateId:string;status:string;reviewer:string;note:string;at:string}[];
 return {...snapshot,revision,candidates:snapshot.candidates.map(c=>({...c,review:reviews.find(r=>r.candidateId===c.id)||{status:'pending',reviewer:'',note:'',at:''}}))};
}
