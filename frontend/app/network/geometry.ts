import type {NetworkCandidate,NetworkCategory} from './types';
export const categories:NetworkCategory[]=['Culture','Community','Media','Creators'];
export const centers={Culture:[28,32],Community:[28,72],Media:[65,30],Creators:[65,73]};
const offsets=[[-12,-6],[-2,-12],[11,-4],[-8,11],[7,13],[-18,4],[17,8],[-2,2],[0,20],[-13,-15],[-20,19],[17,23]];
// Use stage-width units: the locked 16:9 canvas makes these scale uniformly.
const width=68,height=61*9/16;
export const nodeSize=(followers:number|null)=>followers===null?1.8:Math.min(3.1,1.2+Math.log10(Math.max(1,followers))*.23);
export const protectedLabels=categories.map(cat=>({left:centers[cat][0]*width/100-5,right:centers[cat][0]*width/100+5,top:(centers[cat][1]-21)*height/100-.25,bottom:(centers[cat][1]-21)*height/100+1.7}));
export const hub={x:.48*width,y:310/600*height,radius:2.3};
export function clearsProtectedSpace(x:number,y:number,radius:number){
 return Math.hypot(x-hub.x,y-hub.y)>=radius+hub.radius+.4&&protectedLabels.every(r=>Math.hypot(x-Math.max(r.left,Math.min(x,r.right)),y-Math.max(r.top,Math.min(y,r.bottom)))>=radius);
}
export function constellationPositions(candidates:NetworkCandidate[]){
 const counts:Record<string,number>={};const placed:{x:number;y:number;body:number}[]=[];
 return candidates.map(c=>{
  const i=counts[c.category]||0;counts[c.category]=i+1;
  const o=offsets[i%offsets.length],center=centers[c.category];
  const initial={x:(center[0]+o[0])*width/100,y:(center[1]+o[1])*height/100};
  const body=nodeSize(c.followers)/2;
  // Reserve the full animated pulse extent, active ring and a reading margin.
  const radius=Math.max((body+.45)*1.5,body+.65)+.3;
  const safe=(x:number,y:number)=>x>=radius&&x<=width-radius&&y>=radius&&y<=height-radius&&clearsProtectedSpace(x,y,radius)&&placed.every(p=>Math.hypot(x-p.x,y-p.y)>=body+p.body+.5);
  let pos=initial;
  if(!safe(pos.x,pos.y)){
   let best=Infinity;
   for(let y=radius;y<=height-radius;y+=.35)for(let x=radius;x<=width-radius;x+=.35){const distance=(x-initial.x)**2+(y-initial.y)**2;if(distance<best&&safe(x,y)){best=distance;pos={x,y};}}
   if(!Number.isFinite(best))throw Error('Network layout has no collision-free position.');
  }
  placed.push({...pos,body});return{c,x:pos.x/width*100,y:pos.y/height*100};
 });
}
