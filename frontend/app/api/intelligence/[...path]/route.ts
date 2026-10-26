import {env} from "cloudflare:workers";
import {response} from "../../../../server/campaign";
// Public, read-only intelligence from this single staging workspace. No paid actions.
export async function GET(request:Request) {
 const path=new URL(request.url).pathname.replace(/^\/api\/intelligence\//,"");
 if(!/^workflows(?:\/[0-9a-f-]{36}(?:\/export\.csv)?)?$/.test(path))return response({error:"Unknown intelligence resource."},404);
 const config=env as unknown as {RMU_PIPELINE_URL?:string;RMU_PIPELINE_TOKEN?:string};
 if(!config.RMU_PIPELINE_URL||!config.RMU_PIPELINE_TOKEN)return response({error:"Intelligence service is not configured."},503);
 try {
  const target=new URL(config.RMU_PIPELINE_URL);
  if(target.protocol!=="https:"||!target.hostname.endsWith(".onrender.com"))throw new Error("Invalid upstream");
  const exportCsv=path.endsWith("/export.csv");
  const upstreamPath=exportCsv?path.replace(/^workflows\//,"runs/"):path;
  const upstream=await fetch(new URL(`/v1/${upstreamPath}`,target),{headers:{Authorization:`Bearer ${config.RMU_PIPELINE_TOKEN}`},signal:AbortSignal.timeout(65000),redirect:"manual"});
  if(exportCsv){
   if(!upstream.ok||!upstream.headers.get("Content-Type")?.includes("text/csv"))return response({error:"CSV export is unavailable. Please retry."},upstream.ok?502:upstream.status);
   return new Response(upstream.body,{headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":`attachment; filename="rmu-${path.split('/')[1]}.csv"`,"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
  }
  if(!upstream.headers.get("Content-Type")?.includes("application/json"))throw new Error("Service waking");
  const data=await upstream.json();
  if(!upstream.ok)return response(data,upstream.status);
  const publicRun=(row:Record<string,unknown>)=>Object.fromEntries(["id","campaign","starts_on","ends_on","workflow","evidence_count","evidence","findings","classifications","model_analysis","analyses"].filter(key=>key in row).map(key=>[key,row[key]]));
  return response(path==="workflows"?{runs:(data.runs||[]).map(publicRun)}:publicRun(data),upstream.status);
 }catch{return response({error:"Intelligence service is waking up or unavailable. Please retry."},503);}
}
