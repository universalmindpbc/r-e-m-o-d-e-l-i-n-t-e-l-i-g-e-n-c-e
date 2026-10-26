import { authenticated,bindings,body,equalSecret,makeSession,response,sameOrigin } from "../../../../server/campaign";
const cookie="Path=/; HttpOnly; Secure; SameSite=Strict";
export async function GET(request:Request) {return response({authenticated:await authenticated(request),ready:!!bindings().RMU_ADMIN_SECRET&&!!bindings().CAMPAIGN_DB});}
export async function POST(request:Request) {
 if(!sameOrigin(request))return response({error:"Request origin not allowed."},403);
 const secret=bindings().RMU_ADMIN_SECRET;if(!secret||!bindings().CAMPAIGN_DB)return response({error:"Shared Admin storage is not configured yet."},503);
 try {const data=await body(request);if(typeof data.key!=="string"||!(await equalSecret(data.key,secret)))return response({error:"The admin key is incorrect."},401);return response({authenticated:true},200,{"Set-Cookie":`rmu_admin=${await makeSession(secret)}; ${cookie}; Max-Age=28800`});}catch{return response({error:"Invalid sign-in request."},400);}
}
export async function DELETE(request:Request) {if(!sameOrigin(request))return response({error:"Request origin not allowed."},403);return response({authenticated:false},200,{"Set-Cookie":`rmu_admin=; ${cookie}; Max-Age=0`});}
