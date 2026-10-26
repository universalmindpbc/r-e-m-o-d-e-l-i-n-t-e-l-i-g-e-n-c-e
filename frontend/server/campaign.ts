import { env } from "cloudflare:workers";
type Statement = { bind(...args: unknown[]): Statement; first<T>(): Promise<T|null>; run(): Promise<{meta:{changes:number}}> };
type Store = { prepare(sql:string):Statement };
export function bindings() { return env as unknown as { CAMPAIGN_DB?:Store; RMU_ADMIN_SECRET?:string }; }
export const response=(body:unknown,status=200,headers:Record<string,string>={})=>Response.json(body,{status,headers:{"Cache-Control":"no-store",...headers}});
export function sameOrigin(request:Request) { return request.headers.get("origin")===new URL(request.url).origin; }
const bytes=new TextEncoder();
async function signature(payload:string,secret:string) {const key=await crypto.subtle.importKey("raw",bytes.encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);return Array.from(new Uint8Array(await crypto.subtle.sign("HMAC",key,bytes.encode(payload))),b=>b.toString(16).padStart(2,"0")).join("");}
export async function equalSecret(a:string,b:string) {const hash=async(s:string)=>new Uint8Array(await crypto.subtle.digest("SHA-256",bytes.encode(s)));const [x,y]=await Promise.all([hash(a),hash(b)]);let diff=0;for(let i=0;i<x.length;i++)diff|=x[i]^y[i];return diff===0;}
export async function makeSession(secret:string) {const payload=`${Date.now()+8*60*60*1000}.${crypto.randomUUID()}`;return `${payload}.${await signature(payload,secret)}`;}
export async function authenticated(request:Request) {const secret=bindings().RMU_ADMIN_SECRET;if(!secret)return false;const token=request.headers.get("cookie")?.split(";").map(v=>v.trim()).find(v=>v.startsWith("rmu_admin="))?.slice(10);if(!token)return false;const [expires,nonce,sig,...rest]=token.split(".");if(rest.length||!expires||!nonce||!sig||!Number.isFinite(Number(expires))||Number(expires)<Date.now()||Number(expires)>Date.now()+8*60*60*1000)return false;return equalSecret(sig,await signature(`${expires}.${nonce}`,secret));}
export async function body(request:Request) {const text=await request.text();if(text.length>8192)throw new Error("Request too large.");return JSON.parse(text);}
