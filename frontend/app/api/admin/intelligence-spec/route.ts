import spec from "../../../../server/intelligence/specification.json";
import review from "../../../../server/intelligence/review.json";
import document from "../../../../server/intelligence/approved-review.json";
import {authenticated,response} from "../../../../server/campaign";
export async function GET(request:Request) {
 if(!await authenticated(request))return response({error:"Sign in to view the intelligence specification."},401);
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(JSON.stringify(spec)))),b=>b.toString(16).padStart(2,"0")).join("");
 return response({...spec,hash,reviewUrl:review.url,document});
}
