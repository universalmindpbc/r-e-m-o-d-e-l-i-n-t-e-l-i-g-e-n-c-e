import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url);
const spec=JSON.parse(await readFile(new URL('server/intelligence/specification.json',root),'utf8'));
const hash=createHash('sha256').update(JSON.stringify(spec)).digest('hex');
const escape=s=>s.replace(/[\\*~`$[\]<>{}|^]/g,'\\$&');
const source='https://app.notion.com/p/3f37b9c99c56802ca9c5de6d24186736';
let markdown=`**${spec.status}**\n\nVersion: ${spec.version}\n\nActive analytical prompt: none. This is the review candidate, not a running AI system.\n\nContent SHA-256: \`${hash}\`\n\n<table_of_contents/>\n\n`;
for(const s of spec.sections){markdown+=`## ${escape(s.title)}\n\n`;for(const p of s.body){markdown+=(s.kind==='prompt'||(s.kind==='contract'&&p.includes('RunManifest:')))?'```text\n'+p+'\n```\n\n':escape(p).replace(source,`<mention-page url="${source}"/>`)+ '\n\n';}}
await mkdir(new URL('work/',root),{recursive:true});
await writeFile(new URL('work/atomic-super-prompt.notion.md',root),markdown);
await writeFile(new URL('work/atomic-super-prompt-export.json',root),JSON.stringify({hash,markdown,title:spec.title+' · '+spec.version}));
console.log(`Exported ${spec.sections.length} sections. SHA-256 ${hash}`);
