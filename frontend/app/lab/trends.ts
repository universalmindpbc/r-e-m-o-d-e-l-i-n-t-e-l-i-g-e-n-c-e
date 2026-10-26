export type TrendRow={label:string;value:number|null;display:string;partial?:boolean};
export type TrendExport={id:string;term:string;geography:string;geographyLabel:string;channel:string;from:string;to:string;exportedAt:string;sourceUrl:string;time:{rows:TrendRow[];file:string;sha256:string}|null;region:{rows:TrendRow[];file:string;sha256:string}|null};
export type TrendDataset={version:number;exports:TrendExport[];acquisition:{status:string;checkedAt:string;message:string}};
function split(line:string){const out:string[]=[];let item='',quoted=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'){if(quoted&&line[i+1]==='"'){item+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){out.push(item);item='';}else item+=c;}if(quoted)throw new Error('Invalid CSV quoting.');out.push(item);return out;}
export function parseTrendsCsv(text:string,term:string):{rows:TrendRow[];kind:'time'|'region';scope:string}{
 const lines=text.replace(/^\uFEFF/,'').split(/\r?\n/).map(split);const index=lines.findIndex(c=>/^(Day|Week|Month|Year|Region|Country|City|Subregion)$/i.test(c[0]?.trim()));
 if(index<0)throw new Error('Choose an Interest over time or Interest by region export from Google Trends.');
 const header=lines[index];const column=header.findIndex((c,i)=>i>0&&c.split(/:\s*\(/)[0].trim().toLowerCase()===term.trim().toLowerCase());if(column<1)throw new Error('The CSV does not contain the selected search term.');
 const kind=/Region|Country|City|Subregion/i.test(header[0])?'region':'time';
 const rows:TrendRow[]=[];for(const c of lines.slice(index+1)){if(!c[0]?.trim())continue;const label=c[0].trim(),raw=(c[column]??'').trim();if(kind==='time'&&!/^\d{4}(-\d{2}(-\d{2})?)?$/.test(label))throw new Error('Expected ISO dates in the Google Trends timeline.');if(raw==='<1'||raw===''||/^(NA|N\/A)$/i.test(raw)){rows.push({label,value:null,display:raw==='<1'?'<1':'Not published'});continue;}const value=Number(raw);if(!/^\d+(\.\d+)?$/.test(raw)||value<0||value>100)throw new Error('Expected normalised Google Trends values between 0 and 100.');rows.push({label,value,display:raw});}
 if(!rows.length||rows.length>2000)throw new Error('The export must contain 1–2,000 observations.');if(new Set(rows.map(r=>r.label)).size!==rows.length)throw new Error('Duplicate observations in the export.');return {rows,kind,scope:header[column].match(/:\s*\((.*)\)\s*$/)?.[1]||''};
}
export function trendLinePath(rows:TrendRow[],left=40,width=820,top=25,height=160){
 const times=rows.map(r=>Date.parse(r.label.length===4?r.label+'-01-01':r.label.length===7?r.label+'-01':r.label));
 const first=times[0],last=times.at(-1)??first;
 return rows.map((r,i)=>r.value===null?'':`${i>0&&rows[i-1].value!==null?'L':'M'} ${left+(last===first?.5:(times[i]-first)/(last-first))*width} ${top+height-r.value/100*height}`).join(' ');
}
