import assert from 'node:assert/strict';
import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const browser=await chromium.launch({headless:true,args:['--mute-audio','--autoplay-policy=user-gesture-required']});
try {
 for(const mode of ['normal','delayed','failed','empty']) {
  const context=await browser.newContext({viewport:{width:1920,height:1080},serviceWorkers:'block'});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{Element.prototype.requestFullscreen=async()=>{};});
  let release;const gate=new Promise(resolve=>{release=resolve;});
  if(mode!=='normal') await page.route('**/api/intelligence/workflows',async route=>{
   if(mode==='delayed') {await gate;await route.continue();}
   else await route.fulfill({status:mode==='failed'?503:200,contentType:'application/json',body:JSON.stringify(mode==='empty'?{runs:[]}:{error:'QA unavailable'})});
  });
  await page.goto('https://rmu.universalmind.tv/',{waitUntil:'domcontentloaded'});
  await page.locator('.view-nav button').filter({hasText:'Overview'}).click();
  await page.locator('.overview-hit-rihanna').click();
  const dialog=page.locator('dialog.alignment-insight');
  await dialog.waitFor();
  const check=async()=>assert.doesNotMatch(await dialog.innerText(),/DEMO DATA|Synthetic Rihanna-only sample|Synthetic example/);
  await check();
  if(mode==='delayed') {await page.getByText('Loading saved X analysis…',{exact:true}).waitFor();release();}
  if(mode==='normal'||mode==='delayed') {
   await dialog.getByText('X ANALYSIS',{exact:true}).waitFor({timeout:60000});
   for(const name of ['Fans','Alignment','Rihanna']) {await dialog.getByRole('button',{name,exact:true}).click();await check();}
   await page.screenshot({path:`/tmp/rmu-overview-${mode}.png`});
  } else {
   await dialog.getByText('X ANALYSIS UNAVAILABLE',{exact:true}).waitFor();await check();
  }
  assert.deepEqual(errors,[]);
  await page.evaluate(()=>document.querySelectorAll('video,audio').forEach(m=>m.pause()));
  await context.close();console.log(`PASS clean-session Overview: ${mode}`);
 }
} finally {await browser.close();}
