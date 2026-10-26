import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const origin='https://rmu.universalmind.tv';
const browser=await chromium.launch({headless:true,args:['--enable-automation','--mute-audio','--autoplay-policy=user-gesture-required']});
const cdp=await browser.newBrowserCDPSession();assert((await cdp.send('Browser.getBrowserCommandLine')).arguments.includes('--mute-audio'));
await mkdir('outputs/violence-restored',{recursive:true});const result=[];
try{
 for(const width of [1920,1440,390]){
  const page=await browser.newPage({viewport:{width,height:width===1920?1080:width===1440?900:844}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{Object.defineProperty(Element.prototype,'requestFullscreen',{configurable:true,value:async()=>undefined});});
  try{
   await page.goto(origin+'/intelligence/violence/',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.querySelector('.machine-state time')?.textContent!=='--:--:--');
   await page.locator('.enter-console').click();await page.locator('.screen-overview .overview-geometry').waitFor();
   await page.waitForFunction(()=>{const v=document.querySelector('video');return v&&v.readyState>=2&&!v.paused&&v.currentTime>0;},null,{timeout:45000});
   assert((await page.locator('video').evaluate(v=>v.currentSrc)).endsWith('/rihanna-global-citizen-loop.mp4'));
   const media=await page.locator('video').evaluate(v=>({source:v.currentSrc,duration:v.duration,readyState:v.readyState,currentTime:v.currentTime,casing:getComputedStyle(document.querySelector('.black-casing')).backgroundColor}));
   assert.equal(media.casing,'rgba(0, 0, 0, 0.34)');
   await page.locator('.sound-control').click();assert(await page.locator('video').evaluate(v=>v.muted));
   await page.locator('video').evaluate(v=>{v.pause();v.currentTime=30;});
   const nav=page.locator('.view-nav');assert.deepEqual(await nav.locator('button').allTextContents(),['Overview','Engagement','Alignment','Messaging','Influence','Network','Lab','Report','Admin']);
   const tops=await nav.locator('button').evaluateAll(ns=>ns.map(n=>n.getBoundingClientRect().top));assert(Math.max(...tops)-Math.min(...tops)<1.1);
   assert.equal(await nav.evaluate(n=>getComputedStyle(n).borderTopWidth),'0px');
   const stage=await page.locator('.rmu-stage').boundingBox();assert(Math.abs(stage.width/stage.height-16/9)<.001);
   const circles=await page.locator('.overview-circle-outline').evaluateAll(ns=>ns.map(n=>({w:n.getBoundingClientRect().width,h:n.getBoundingClientRect().height})));assert(circles.every(c=>Math.abs(c.w-c.h)<1));
   await page.waitForFunction(()=>getComputedStyle(document.querySelector('.screen-window')).opacity==='1');await page.screenshot({path:`outputs/violence-restored/overview-${width}.png`});
   await page.locator('.score-talent').click();await page.getByRole('dialog').waitFor();assert.match(await page.getByRole('dialog').innerText(),/SYNTHETIC/);assert.equal(await page.locator('.priority-donut').count(),1);
   await page.getByRole('button',{name:'What should we change?'}).click();await page.locator('.overview-destinations a').first().click();assert(await page.locator('.overview-back').first().count());
   if(width===1440)await page.waitForFunction(()=>getComputedStyle(document.querySelector('.screen-window')).opacity==='1');await page.screenshot({path:'outputs/violence-restored/overview-research.png'});
   await page.keyboard.press('Escape');
   for(const [view,selector] of [['Engagement','.engagement-screen .funnel-geometry'],['Alignment','.alignment-screen .funnel-geometry'],['Messaging','.venn-geometry'],['Influence','.influence-geometry']]){await nav.getByRole('button',{name:view,exact:true}).click();await page.locator(selector).waitFor();await page.waitForFunction(()=>getComputedStyle(document.querySelector('.screen-window')).opacity==='1');await page.screenshot({path:`outputs/violence-restored/${view.toLowerCase()}-${width}.png`});}
   await nav.getByRole('button',{name:'Engagement',exact:true}).click();await page.locator('.stage-posts').click();await page.locator('.need-card').waitFor();assert.match(await page.locator('.need-card').innerText(),/18 Posts/);await page.keyboard.press('Escape');
   await nav.getByRole('button',{name:'Messaging',exact:true}).click();const original=await page.locator('#segment-message').innerText();await page.getByRole('button',{name:'ABC',exact:true}).click();assert.notEqual(await page.locator('#segment-message').innerText(),original);
   await page.getByRole('button',{name:'Open messaging brief',exact:true}).click();assert.match(await page.getByRole('dialog').innerText(),/SYNTHETIC/);await page.keyboard.press('Escape');
   await page.getByRole('button',{name:'Open Survey Research',exact:true}).click();await page.locator('.research-screen').waitFor();assert.equal(await page.locator('.research-asset').count(),3);
   await nav.getByRole('button',{name:'Network',exact:true}).click();await page.locator('[data-network-id]').first().waitFor();assert.equal(await page.locator('[data-network-id]').count(),20);await page.locator('[data-network-id]').first().click();assert.match(await page.locator('[aria-live="polite"]').innerText(),/Synthetic|synthetic|Fictional/);await page.getByRole('button',{name:'Add to my shortlist',exact:false}).click();
   const shortlist=page.waitForEvent('download');await page.getByRole('button',{name:'Export shortlist',exact:false}).click();await (await shortlist).saveAs(`outputs/violence-restored/shortlist-${width}.txt`);
   await nav.getByRole('button',{name:'Lab',exact:true}).click();await page.getByTestId('lab-report-line').waitFor();assert.equal(await page.getByLabel('Source and measure').inputValue(),'abs-domestic-assault');assert.equal(await page.getByTestId('lab-report-line').count(),1);
   await page.waitForFunction(()=>getComputedStyle(document.querySelector('.screen-window')).opacity==='1');await page.screenshot({path:`outputs/violence-restored/lab-${width}.png`});
   await page.getByLabel('State or territory').selectOption('NSW');assert.equal(await page.getByTestId('lab-report-line').count(),1);
   await page.getByLabel('Topic',{exact:true}).selectOption('Violent extremism');assert.equal(await page.getByTestId('lab-report-line').count(),0);await page.getByLabel('Topic',{exact:true}).selectOption('Domestic violence');
   await page.getByRole('button',{name:'Source & method',exact:false}).click();assert.match(await page.getByRole('dialog').innerText(),/not an ABS national total/);await page.keyboard.press('Escape');
   assert(await page.getByRole('button',{name:'Day',exact:true}).isDisabled());await page.getByRole('button',{name:'All available',exact:true}).click();
   await page.getByLabel('Location',{exact:true}).selectOption('USA');assert.equal(await page.getByTestId('lab-report-line').count(),0);await page.getByLabel('Location',{exact:true}).selectOption('Australia');
   await page.getByRole('button',{name:'Violence, reporting & search interest',exact:false}).click();assert.match(await page.getByRole('dialog').innerText(),/Google Trends/);await page.keyboard.press('Escape');
   await page.getByRole('button',{name:'Research brief',exact:false}).click();const brief=page.waitForEvent('download');await page.getByRole('button',{name:'Download research brief',exact:false}).click();await (await brief).saveAs(`outputs/violence-restored/brief-${width}.txt`);await page.keyboard.press('Escape');
   await nav.getByRole('button',{name:'Admin',exact:true}).click();await page.getByRole('dialog').waitFor();assert.equal(await page.getByLabel('Campaign name',{exact:true}).inputValue(),'No More Violence');await page.getByRole('button',{name:'Synthetic data',exact:true}).click();assert.match(await page.getByRole('dialog').innerText(),/No More Violence uses these saved demo values/);await page.keyboard.press('Escape');
   await nav.getByRole('button',{name:'Report',exact:true}).click();const csv=page.waitForEvent('download');await page.getByRole('button',{name:'Export collection data'}).click();await (await csv).saveAs(`outputs/violence-restored/synthetic-${width}.csv`);
   await page.getByRole('button',{name:'Read the complete interactive report online'}).click();await page.locator('[data-report-reader]').waitFor();assert.match(await page.locator('#report-title').innerText(),/No More Violence/i);assert(!(await page.locator('[data-report-reader]').innerText()).includes('CLF'));await page.locator('[data-report-back]').click();
   const configurations=await page.evaluate(async()=>Promise.all(['campaign','synthetic'].flatMap(kind=>['climate-justice','violence'].map(async workspace=>({kind,workspace,data:await fetch(`/api/${kind}?workspace=${workspace}`).then(r=>r.json())})))));assert(configurations.every(c=>c.data.writable));assert.equal(configurations.find(c=>c.kind==='campaign'&&c.workspace==='climate-justice').data.settings.talent,'Rihanna');
   await page.goto(origin+'/intelligence/climate-justice/',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.querySelector('.machine-state time')?.textContent!=='--:--:--');assert.equal(await page.locator('.view-nav button').count(),8);await page.locator('.view-nav').getByRole('button',{name:'Overview',exact:true}).click();await page.locator('.overview-geometry').waitFor();assert.equal(await page.locator('.overview-circle-outline').count(),2);
   assert.deepEqual(errors,[]);result.push({width,geometry:'16:9',video:media,allDashboardViews:'passed',syntheticResearch:'passed',countLab:'passed',campaignIsolation:'passed',errors});console.log('PASS',width);
  }finally{await page.evaluate(()=>document.querySelectorAll('video,audio').forEach(v=>v.pause())).catch(()=>{});await page.close();}
 }
 await writeFile('outputs/violence-restored/results.json',JSON.stringify(result,null,2));
}finally{await browser.close();}
