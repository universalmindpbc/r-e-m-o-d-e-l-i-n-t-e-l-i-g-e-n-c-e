import {env} from "cloudflare:workers";
import {authenticated,response,sameOrigin} from "../../../../../server/campaign";
const paths=/^(status|workflows(?:\/[0-9a-f-]{36}(?:\/(?:resume|map-approved))?)?|runs|collection-preview|jobs\/process-one|runs\/[0-9a-f-]{36}(?:\/(?:fixtures|measure|classify|export\.csv))?)$/;
async function proxy(request:Request) {
 if(!await authenticated(request))return response({error:"Unlock Admin to access the intelligence pipeline."},401);
 if(request.method!=="GET"&&!sameOrigin(request))return response({error:"Request origin not allowed."},403);
 const path=new URL(request.url).pathname.replace(/^\/api\/admin\/pipeline\//,"");
 if(!paths.test(path))return response({error:"Unknown pipeline action."},404);
 const config=env as unknown as {RMU_PIPELINE_URL?:string;RMU_PIPELINE_TOKEN?:string};
 if(!config.RMU_PIPELINE_URL||!config.RMU_PIPELINE_TOKEN)return response({error:"Python API deployment is awaiting repository access.",stage:"awaiting_api_deployment",database_verified:false},503);
 try {
  const target=new URL(config.RMU_PIPELINE_URL);
  if(target.protocol!=="https:"||!target.hostname.endsWith(".onrender.com"))throw new Error("Invalid upstream");
  let body:string|undefined;
  if(request.method!=="GET") {body=await request.text();if(body.length>262144)return response({error:"Request too large."},413);}
  const upstream=await fetch(new URL(`/v1/${path}`,target),{method:request.method,headers:{Authorization:`Bearer ${config.RMU_PIPELINE_TOKEN}`,"Content-Type":"application/json"},body,signal:AbortSignal.timeout(65000),redirect:"manual"});
  if(upstream.status>=300&&upstream.status<400)return response({error:"The Python service returned an unexpected redirect."},502);
  if(upstream.ok&&path.endsWith("/export.csv")&&upstream.headers.get("Content-Type")?.includes("text/csv"))return new Response(upstream.body,{headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":upstream.headers.get("Content-Disposition")||"attachment; filename=rmu-export.csv","Cache-Control":"no-store","X-Content-Type-Options":"nosniff","X-RMU-Row-Count":upstream.headers.get("X-RMU-Row-Count")||"0"}});
  if(!upstream.headers.get("Content-Type")?.includes("application/json"))return response({error:"The Python service is waking up. Try again shortly."},503);
  const result=await upstream.json();
  return response(result,upstream.status);
 }catch{return response({error:"The Python service is unavailable or waking up. Please retry shortly."},503);}
}
export const GET=proxy;
export const POST=proxy;
