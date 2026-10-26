export type DemoField={id:string;label:string;group:string;value:number|null;max:number;min?:number;decimal?:boolean;unit?:string};
const field=(id:string,label:string,group:string,value:number|null,max=1e12,unit="",decimal=false,min=0):DemoField=>({id,label,group,value,max,unit,decimal,min});
export const demoFields:DemoField[]=[
 field('talent','Talent score','Overview',77,100,'%'),field('audience','Audience score','Overview',86,100,'%'),field('target','Strategic target','Overview',97,100,'%'),field('talentChange','Talent change','Overview',5,100,'%',true,-100),field('audienceChange','Audience change','Overview',-3,100,'%',true,-100),
 ...[['events','Events',1],['posts','Posts',18],['views','Views',128000000],['plays','Plays',73000000],['likes','Likes + mentions',3300000],['shares','Shares',97000],['reach','Reach',1100000000],['engagements','Engagements / Action',333000000],['revenue','Revenue',17000000]].map(([id,label,value])=>field(String(id),String(label),'Engagement',Number(value),1e12,id==='revenue'?'$':'')),field('roi','ROI','Engagement',123,10000,'%',true,-100),
 field('alignment','Alignment','Alignment',35,100,'%'),field('authenticity','Authenticity','Alignment',57,100,'%'),field('impact','Impact','Alignment',83,100,'%'),field('uplift','Uplift','Alignment',22.2,1000,'%',true,-100),
 field('voice','Share of voice (blank = X)','Influence',null,100,'%'),field('weeklyPosts','Posts per week','Influence',9,10000),field('seconds','Watch time per day','Influence',30,86400,'seconds'),field('influenceReach','Required reach','Influence',3700000),field('sentiment','Sentiment shift','Influence',22,100,'%',true,-100),
 field('talentPosts','Rihanna original posts','Evidence samples',20,1000000),field('fanAccounts','Unique fan accounts','Evidence samples',100,1000000),field('fanPosts','Fan original posts','Evidence samples',160,10000000),field('priorities','Candidate shared priorities','Evidence samples',2,3),
 ...['Frontline communities','Climate resilience','Equitable funding'].flatMap((name,i)=>[field(`theme${i}Posts`,`${name}: posts`,'Theme counts',[12,9,6][i],1000000),...['Support','Opposition','Mixed','No clear position'].map((s,j)=>field(`theme${i}Stance${j}`,`${name}: ${s}`,'Theme counts',[[68,8,9,15],[61,10,12,17],[42,22,16,20]][i][j],1000000))]),
];
export type DemoValues=Record<string,number|null>;
export const demoDefaults:DemoValues=Object.fromEntries(demoFields.map(f=>[f.id,f.value]));
export function validateDemo(value:unknown):DemoValues {
 if(!value||typeof value!=="object"||Array.isArray(value))throw new Error('Demo figures are required.');
 const input=value as DemoValues;const result:DemoValues={};
 for(const f of demoFields){const v=input[f.id];if(v===null&&f.id==='voice'){result[f.id]=null;continue;}if(typeof v!=='number'||!Number.isFinite(v)||v<(f.min??0)||v>f.max||(!f.decimal&&!Number.isInteger(v)))throw new Error(`${f.label}: enter ${f.decimal?'a number':'a whole number'} from ${f.min??0} to ${f.max}.`);result[f.id]=v;}
 if(!result.talentPosts||!result.fanAccounts)throw new Error('Evidence sample denominators must be greater than zero.');
 if(result.fanPosts!<result.fanAccounts!)throw new Error('Fan posts must cover at least the unique fan accounts.');
 for(let i=0;i<3;i++){if(result[`theme${i}Posts`]!>result.talentPosts!)throw new Error('A theme post count cannot exceed the Rihanna post sample.');const total=[0,1,2,3].reduce((n,j)=>n+result[`theme${i}Stance${j}`]!,0);if(total!==result.fanAccounts)throw new Error('Each theme’s four stance counts must sum to the unique fan accounts.');}
 return result;
}
export const compact=(n:number|null)=>new Intl.NumberFormat('en-US',{notation:'compact',maximumFractionDigits:1}).format(n??0);
export const percent=(n:number|null)=>`${n??0}%`;
export const ratio=(n:number,total:number)=>Math.round(n/total*1000)/10;
