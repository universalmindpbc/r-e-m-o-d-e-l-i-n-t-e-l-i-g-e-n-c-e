'use client';
import type {Measure,Observation} from './evidence';
import s from './lab.module.css';

// Every mark is a published observation. Missing values break lines and never become zero.
export default function EvidenceChart({measure,rows,state}:{measure:Measure;rows:Observation[];state:string}){
 const line=measure.kind==='line'||(measure.id==='recorded-assault'&&state!=='All');
 const w=1400,h=380,left=100,right=45,top=40,bottom=65,width=w-left-right,height=h-top-bottom;
 const max=Math.max(1,...rows.map(r=>r.value??0))*1.15;
 const y=(v:number)=>top+height-v/max*height;
 const years=[...new Set(rows.map(r=>r.year))].sort((a,b)=>a-b);
 const x=(year:number)=>left+(years.length===1?.5:(year-years[0])/(years.at(-1)!-years[0]))*width;
 const groups=[...new Set(rows.map(r=>r.label))];
 const colours=['#c2f778','#a1c5ff','#f3c690'];
 const value=(n:number)=>n.toLocaleString('en-AU',{maximumFractionDigits:measure.unit==='%'?1:0})+(measure.unit==='%'?'%':'');
 const description=`${measure.title}; ${measure.unit}; ${measure.period}; ${rows.map(r=>`${r.label}, ${r.year}: ${r.value===null?'not published':value(r.value)}`).join('; ')}`;
 return <div className={s.chartWrap} data-testid="lab-evidence-chart"><svg className={s.chart} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={description}>
 <text x={left} y="18" fill="#ddd" fontSize="14" letterSpacing="2">{measure.unit==='%'?'POPULATION PERCENTAGE (%)':measure.unit.toUpperCase()}</text>
 {[0,.25,.5,.75,1].map(v=><g key={v}><line x1={left} x2={w-right} y1={y(max*v)} y2={y(max*v)} stroke="#fff" strokeOpacity={v===0?'.4':'.09'}/><text x={left-20} y={y(max*v)+5} textAnchor="end" fill="#ddd" fontSize="15">{value(max*v)}</text></g>)}
 {line?<>
 {years.map(year=><text key={year} x={x(year)} y={h-35} textAnchor="middle" fill="#ddd" fontSize="15">{!measure.countSeries&&year===2022?'2021–22':year}</text>)}
 {groups.map((group,g)=>{const points=rows.filter(r=>r.label===group).sort((a,b)=>a.year-b.year);return <g key={group}>
 <path data-testid="evidence-line" fill="none" stroke={colours[g%colours.length]} strokeWidth="3" d={points.map((r,i)=>r.value===null?'':`${i>0&&points[i-1].value!==null?'L':'M'} ${x(r.year)} ${y(r.value)}`).join(' ')}/>
 {points.map(r=>r.value===null?<text key={r.year} x={x(r.year)} y={top+18+g*20} textAnchor="end" fill={colours[g%colours.length]} fontSize="13">{group}: not published</text>:<circle key={r.year} cx={x(r.year)} cy={y(r.value)} r="5" fill={colours[g%colours.length]} tabIndex={0} role="button" aria-label={`${r.label}, ${r.year}: ${value(r.value)} ${measure.unit==='%'?'':measure.unit}`}><title>{r.label} · {r.year}: {value(r.value)} {r.note||''}</title></circle>)}
 </g>;})}
 <text x={w-right} y={h-4} textAnchor="end" fill="#ddd" fontSize="14">{measure.countSeries?'YEAR':'SURVEY WAVE'}</text>
 </>:rows.map((r,i)=>{const slot=width/rows.length,cx=left+slot*(i+.5),barWidth=Math.min(120,slot*.55);return <g key={`${r.label}-${r.year}`}>
 {r.value===null?<text x={cx} y={y(0)-12} textAnchor="middle" fill="#bbb" fontSize="13">Not published</text>:<><rect data-testid="evidence-bar" x={cx-barWidth/2} y={y(r.value)} width={barWidth} height={height-(y(r.value)-top)} fill="#c2f778" fillOpacity=".8" tabIndex={0} role="button" aria-label={`${r.label}: ${value(r.value)} ${measure.unit==='%'?'':measure.unit}`}><title>{r.label}: {value(r.value)} {measure.unit} · {r.year}</title></rect><text x={cx} y={y(r.value)-10} textAnchor="middle" fill="#eee" fontSize="17">{value(r.value)}</text></>}
 <text x={cx} y={h-35} textAnchor="middle" fill="#ddd" fontSize="15">{r.label}</text>
 </g>;})}
 </svg>{line&&groups.length>1&&<div className={s.legend}>{groups.map((g,i)=><span key={g}><i style={{background:colours[i%colours.length]}}/>{g}</span>)}</div>}</div>;
}
