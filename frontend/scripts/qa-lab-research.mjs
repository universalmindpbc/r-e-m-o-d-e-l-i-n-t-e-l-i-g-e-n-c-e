import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const browser=await chromium.launch({headless:true,args:['--enable-automation','--mute-audio','--autoplay-policy=user-gesture-required']});
const cdp=await browser.newBrowserCDPSession();assert((await cdp.send('Browser.getBrowserCommandLine')).arguments.includes('--mute-audio'));
const page=await browser.newPage({viewport:{width:1440,height:900}});let requestSent=false;let providerResult;const statuses=[];
page.on('request',req=>{if(req.url().endsWith('/api/lab/research')&&req.method()==='POST')requestSent=true;});
page.on('response',async res=>{if(res.url().includes('/api/lab/research')){const data=await res.json().catch(()=>null);if(data?.status)statuses.push(data.status);if(data?.status==='completed')providerResult=data;}});
try{
 await page.goto('https://rmu.universalmind.tv/intelligence/violence/#lab',{waitUntil:'domcontentloaded'});await page.getByRole('button',{name:'Deep research',exact:false}).click();await page.getByLabel('RESEARCH QUESTION', {exact:false}).fill('Review the ABS domestic-violence assault count series selected in the Lab. Verify the six-jurisdiction coverage and the distinction between recorded victims, unique people and every incident. Explain the missing national coverage and recording changes, and propose a responsible research next step with citations.');
 await page.getByRole('button',{name:'Start sourced research'}).click();console.log('Research requested through staging UI');
 await page.waitForFunction(()=>document.querySelector('[data-testid="research-result"]')||document.querySelector('[role="alert"]'),null,{timeout:480000});
 const alert=page.getByRole('alert');if(await alert.count())throw new Error(await alert.innerText());
 await page.locator('[data-testid="research-result"]').waitFor();assert(requestSent);assert(providerResult);assert(providerResult.citations.length>0);assert(providerResult.searches>0);assert(await page.locator('[data-testid="research-result"] a').count()>0);
 await mkdir('outputs/lab-abs/research',{recursive:true});await writeFile('outputs/lab-abs/research/research-result.json',JSON.stringify({requestSent,statuses,providerResult},null,2));await page.screenshot({path:'outputs/lab-abs/research/research-1440.png'});console.log(JSON.stringify({requestSent,completed:true,model:providerResult.model,citations:providerResult.citations.length,searches:providerResult.searches,id:providerResult.id}));
}finally{await page.evaluate(()=>document.querySelectorAll('video,audio').forEach(m=>m.pause())).catch(()=>{});await browser.close();}
