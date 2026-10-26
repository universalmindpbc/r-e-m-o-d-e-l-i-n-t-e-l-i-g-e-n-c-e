import {networkPlan} from '../../network/workflow';
import {validateCampaign} from '../../campaign-config';
import {authenticated,body,response,sameOrigin} from '../../../server/campaign';
import {workspace,readSettings,saveSettings} from '../../../server/workspace-settings';
export async function GET(request:Request){
 try{const id=workspace(request);const saved=await readSettings(id,'campaign');return response({networkPlan:networkPlan(saved.settings),...saved});}catch(e){return response({error:e instanceof Error?e.message:'Settings unavailable.'},503);}
}
export async function PUT(request:Request){
 if(!sameOrigin(request))return response({error:'Request origin not allowed.'},403);
 if(!await authenticated(request))return response({error:'Sign in to save settings.'},401);
 let settings,version,id;try{id=workspace(request);const data=await body(request);settings=validateCampaign(data.settings);version=data.version;if(!Number.isInteger(version)||version<0)throw Error('Invalid version.');}catch(e){return response({error:e instanceof Error?e.message:'Invalid settings.'},400);}
 try{const saved=await saveSettings(id,'campaign',settings,version);if(!saved)return response({error:'Someone else saved changes. Reload saved settings before trying again.'},409);return response({networkPlan:networkPlan(saved.settings),...saved});}catch{return response({error:'Save failed. Your draft is retained.'},503);}
}
