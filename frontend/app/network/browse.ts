import type {NetworkCandidate,NetworkCategory} from './types';
export const PAGE_SIZE=20,MAX_PINS=5;
export function browseNetwork(all:NetworkCandidate[],options:{query:string;category:NetworkCategory|null;scope:string;shortlist:string[];pins:string[];page:number}){
 const pinned=options.pins.map(id=>all.find(c=>c.id===id)).filter((c):c is NetworkCandidate=>!!c).slice(0,MAX_PINS);
 const q=options.query.trim().toLowerCase();
 const matches=all.filter(c=>(!options.category||c.category===options.category)&&(!q||[c.name,c.handle,c.subtype,c.role,c.alignment].join(' ').toLowerCase().includes(q))&&(options.scope!=='shortlist'||options.shortlist.includes(c.id))&&(options.scope!=='observed'||c.origin==='observed')&&(options.scope!=='discovered'||c.origin==='discovered')&&(options.scope!=='approved'||c.review?.status==='approved'));
 const remaining=matches.filter(c=>!pinned.some(p=>p.id===c.id));const size=PAGE_SIZE-pinned.length;
 const pages=Math.max(1,Math.ceil(remaining.length/size));const page=Math.max(0,Math.min(options.page,pages-1));
 return {visible:[...pinned,...remaining.slice(page*size,(page+1)*size)],pinned,matches,pages,page,start:remaining.length?page*size+1:0,end:Math.min((page+1)*size,remaining.length),total:remaining.length};
}
export function graphPositions(visible:NetworkCandidate[],pins:string[]){
 const centers={Culture:[25,24],Community:[25,78],Media:[73,24],Creators:[73,78]};
 const counts:Record<string,number>={};for(const c of visible)if(!pins.includes(c.id))counts[c.category]=(counts[c.category]||0)+1;
 const single=Object.keys(counts).length===1;const seen:Record<string,number>={};let pin=0;
 return visible.map(c=>{if(pins.includes(c.id)){return {c,x:8+(pin++*20),y:4};}
 const i=seen[c.category]||0;seen[c.category]=i+1;const n=counts[c.category];if(single)return {c,x:10+(i%5)*19,y:25+Math.floor(i/5)*19};const [cx,cy]=centers[c.category];
 // Two rings keep up to 20 same-category nodes distinct without repeating positions.
 const outer=n>10?Math.ceil(n/2):n;const ring=i<outer?0:1;const count=ring? n-outer:outer;const index=ring?i-outer:i;
 const angle=-Math.PI/2+index*2*Math.PI/count;return {c,x:cx+Math.cos(angle)*(ring?9:18),y:cy+Math.sin(angle)*(ring?8:15)};});
}
export function csvExport(candidates:NetworkCandidate[]){const escape=(x:unknown)=>{let v=String(x??'');if(/^[=+@\-\t\r]/.test(v))v="'"+v;return '"'+v.replaceAll('"','""')+'"';};const rows=[['Name','Category','Type','Discovery','Review','X followers','Observed posts','Role','Alignment','Limitations','Sources'],...candidates.map(c=>[c.name,c.category,c.subtype,c.origin,c.review?.status||'pending',c.followers,c.observedPosts,c.role,c.alignment,c.limitation,[...c.evidence,...c.research].map(s=>s.url).join(' | ')])];return rows.map(r=>r.map(escape).join(',')).join('\r\n');}
