import snapshot from '../../../server/network-demo.json';
import {reviewedNetwork} from '../../../server/network';
import {workspace,readSettings} from '../../../server/workspace-settings';
import {violenceNetwork} from '../../violence-demo';
export async function GET(request:Request){
 if(workspace(request)==='violence'){try{const [campaign,demo]=await Promise.all([readSettings('violence','campaign'),readSettings('violence','synthetic')]);return Response.json(violenceNetwork(campaign.settings,demo.settings),{headers:{'Cache-Control':'no-store'}});}catch{return Response.json({error:'Synthetic network unavailable.'},{status:503});}}
 if(Date.now()>Date.parse(snapshot.expiresAt))return Response.json({error:'Network snapshot expired; operator refresh required.'},{status:410});
 try{return Response.json(await reviewedNetwork(),{headers:{'Cache-Control':'no-store'}});}catch{return Response.json({error:'Network review records unavailable; try again.'},{status:503,headers:{'Cache-Control':'no-store'}});}
}
