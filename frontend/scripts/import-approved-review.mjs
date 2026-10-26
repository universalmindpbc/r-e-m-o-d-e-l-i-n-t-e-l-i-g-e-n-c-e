import fs from 'node:fs';
const markdown=fs.readFileSync('server/intelligence/approved-review.md','utf8');
const lines=markdown.split('\n');let i=0,serial=0;const headings=[];
function parse(end=false){const out=[];while(i<lines.length){const s=lines[i++].trim();if(s==='</callout>'){if(end)return out;throw Error('Unexpected close');}if(!s)continue;
if(s.startsWith('<callout ')){out.push({type:'callout',color:s.match(/color="(.*?)"/)?.[1],children:parse(true)});continue;}
if(s.startsWith('```')){const lang=s.slice(3);const code=[];while(i<lines.length&&!lines[i].trim().startsWith('```'))code.push(lines[i++]);i++;out.push({type:'code',lang,text:code.join('\n')});continue;}
if(s.startsWith('<empty-block')){out.push({type:'space'});continue;}
if(s.startsWith('<table_of_contents')){out.push({type:'toc'});continue;}
if(s==='---'){out.push({type:'rule'});continue;}
if(s.startsWith('![')){if(!s.includes('re-model-intelligence-id.png'))throw Error('Unmapped image');out.push({type:'image',src:'/re-model-intelligence-id.png'});continue;}
const h=s.match(/^(#{1,3}) (.*?)(?: \{color=".*?"\})?$/);if(h){const id=`atomic-heading-${++serial}`;out.push({type:'heading',level:h[1].length,text:h[2],id});if(h[1].length===1&&/^\d{2}/.test(h[2]))headings.push({id,title:h[2]});continue;}
const list=s.match(/^(- |\d+\. )(.*)/);if(list){const ordered=list[1]!=='- ';const prev=out.at(-1);if(prev?.type==='list'&&prev.ordered===ordered)prev.items.push(list[2]);else out.push({type:'list',ordered,items:[list[2]]});continue;}
out.push({type:'paragraph',text:s});}if(end)throw Error('Unclosed callout');return out;}
const blocks=parse();fs.writeFileSync('server/intelligence/approved-review.json',JSON.stringify({sourceUrl:'https://app.notion.com/p/3f97b9c99c5681408d7fda64139d278e',syncedAt:'2026-10-15',headings,blocks,markdown},null,2)+'\n');console.log(`${headings.length} chapters imported`);
