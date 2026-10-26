import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
async function checkClearance(p){
 const overlaps=await p.evaluate(()=>{
  const unit=document.querySelector('.rmu-stage').getBoundingClientRect().width/100;
  const labels=[...document.querySelectorAll('[data-network-label]')].map(e=>e.getBoundingClientRect());
  const hub=document.querySelector('[data-network-hub]').getBoundingClientRect();
  return [...document.querySelectorAll('[data-network-id]')].flatMap(e=>{
   const b=e.getBoundingClientRect(),x=b.x+b.width/2,y=b.y+b.height/2,r=(b.width/2+.45*unit)*1.5;
   const labelHit=labels.some(l=>Math.hypot(x-Math.max(l.left,Math.min(x,l.right)),y-Math.max(l.top,Math.min(y,l.bottom)))<r);
   const hubHit=Math.hypot(x-hub.x-hub.width/2,y-hub.y-hub.height/2)<r+hub.width/2;
   return labelHit||hubHit?[e.dataset.networkId]:[];
  });
 });assert.deepEqual(overlaps,[],'Nodes and full pulse rings must clear headings and hub');
}
const browser=await chromium.launch({headless:true,args:['--mute-audio','--autoplay-policy=user-gesture-required']});
try{for(const viewport of [{width:1920,height:1080},{width:1440,height:900},{width:390,height:844}]){
 const p=await browser.newPage({viewport});const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('https://rmu.universalmind.tv/?network-quiet-navigation='+Date.now()+'#network',{waitUntil:'load'});try{await p.locator('[data-network-id]').first().waitFor();}catch(e){console.log('Load diagnostic',errors,await p.locator('body').innerText());throw e;}
 const section=p.getByRole('region',{name:'Network partnerships'});assert.equal(await p.locator('[data-network-id]').count(),20);assert.equal(await section.locator('input,select,table').count(),0);assert.equal(await section.getByRole('button',{name:'Next partners',exact:true}).count(),1);assert.equal(await section.getByText('Human review pending · draft strategy',{exact:true}).count(),0);
 await checkClearance(p);
 const firstIds=await p.locator('[data-network-id]').evaluateAll(nodes=>nodes.map(n=>n.dataset.networkId));
 assert(await section.getByRole('button',{name:'Previous partners',exact:true}).isDisabled());
 await section.getByRole('button',{name:'Next partners',exact:true}).click();
 await checkClearance(p);
 const secondIds=await p.locator('[data-network-id]').evaluateAll(nodes=>nodes.map(n=>n.dataset.networkId));assert.equal(secondIds.length,20);const positions=await p.locator('[data-network-id]').evaluateAll(nodes=>nodes.map(n=>n.style.left+','+n.style.top));assert.equal(new Set(positions).size,20);assert(secondIds.every(id=>!firstIds.includes(id)));assert(await section.getByRole('button',{name:'Next partners',exact:true}).isDisabled());
 await p.screenshot({path:'/tmp/network-protected-page2-'+viewport.width+'.png'});await section.getByRole('button',{name:'Previous partners',exact:true}).click();assert.deepEqual(await p.locator('[data-network-id]').evaluateAll(nodes=>nodes.map(n=>n.dataset.networkId)),firstIds);
 const resetBox=await section.getByRole('button',{name:'Reset view',exact:true}).boundingBox();const nextBox=await section.getByRole('button',{name:'Next partners',exact:true}).boundingBox();assert(Math.abs(resetBox.y-nextBox.y)<2);
 await p.screenshot({path:'/tmp/network-quiet-navigation-'+viewport.width+'.png'});
 for(const id of await p.locator('[data-network-id]').evaluateAll(nodes=>nodes.map(n=>n.dataset.networkId))){await p.locator('[data-network-id="'+id+'"]').click();await section.getByText('Cause alignment',{exact:true}).waitFor();}
 await section.getByRole('button',{name:/Add to my shortlist/}).click();const download=p.waitForEvent('download');await section.getByRole('button',{name:/Export shortlist/}).click();assert((await download).suggestedFilename().endsWith('.txt'));
 await section.getByRole('button',{name:'Reset view',exact:true}).click();await section.getByRole('button',{name:/^Creators/}).click();assert.equal(await section.getByRole('button',{name:/^Creators/}).getAttribute('aria-pressed'),'true');const rect=await p.locator('.rmu-stage').boundingBox();assert(Math.abs(rect.width/rect.height-16/9)<.01);assert.deepEqual(errors,[]);
 await p.evaluate(()=>document.querySelectorAll('video,audio').forEach(e=>e.pause()));await p.close();console.log('Restored layout and interactions passed',viewport.width);
}}finally{await browser.close();}
