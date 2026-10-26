import {connectorDefaults,validateConnectorPreferences} from "../../../connector-config";
import {authenticated,bindings,body,response,sameOrigin} from "../../../../server/campaign";
export async function GET(request:Request) {
 if(!await authenticated(request))return response({error:"Sign in to view source selections."},401);
 const db=bindings().CAMPAIGN_DB;if(!db)return response({error:"Shared storage is unavailable."},503);
 try{const row=await db.prepare("SELECT settings,version FROM connector_preferences WHERE id=1").first<{settings:string;version:number}>();return response({settings:row?JSON.parse(row.settings):connectorDefaults,version:row?.version??0});}catch{return response({error:"Source selections could not be loaded."},503);}
}
export async function PUT(request:Request) {
 if(!sameOrigin(request))return response({error:"Request origin not allowed."},403);
 if(!await authenticated(request))return response({error:"Sign in to save source selections."},401);
 const db=bindings().CAMPAIGN_DB;if(!db)return response({error:"Shared storage is unavailable."},503);
 let settings,version;try{const data=await body(request);settings=validateConnectorPreferences(data.settings);version=data.version;if(!Number.isInteger(version)||version<0)throw new Error("Invalid settings version.");}catch(e){return response({error:e instanceof Error?e.message:"Invalid selections."},400);}
 try{const result=await db.prepare("UPDATE connector_preferences SET settings=?,version=version+1 WHERE id=1 AND version=?").bind(JSON.stringify(settings),version).run();if(result.meta.changes!==1)return response({error:"Selections changed in another session. Reload before saving."},409);return response({settings,version:version+1});}catch{return response({error:"Could not save source selections."},503);}
}
