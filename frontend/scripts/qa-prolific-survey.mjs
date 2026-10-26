import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,args:['--mute-audio','--autoplay-policy=user-gesture-required']});
const base='https://rmu.universalmind.tv';
try{
 for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
  const page=await browser.newPage({viewport});const errors=[],writes=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(r.method()==='POST'&&new URL(r.url()).pathname.startsWith('/api/survey/'))writes.push(r.url());});
  const choose=async(question,answer)=>page.locator('fieldset').filter({has:page.locator('legend',{hasText:question})}).getByRole('radio',{name:answer,exact:true}).check();
  async function begin(){await page.goto(base+'/survey/rihanna-clf?preview=1');await page.getByText('PREVIEW ONLY',{exact:false}).waitFor();assert(await page.getByRole('button',{name:'Begin survey'}).isDisabled());await page.getByRole('checkbox').check();await page.getByRole('button',{name:'Begin survey'}).click();}
  await page.goto(base+'/survey/rihanna-clf');await page.getByRole('heading',{name:'Recruitment has not opened'}).waitFor();
  for(const awareness of ['Yes','No','Not sure']){
   await begin();await choose('currently consider','No');await choose('Thinking back','Yes');await page.getByRole('button',{name:'Continue',exact:true}).click();
   await choose('feel about Rihanna today','Somewhat favourable');await choose('had you heard',awareness);
   assert.equal(await page.getByText('On 25 January 2022',{exact:false}).count(),0);
   if(awareness==='Yes'){await choose('how much did you know','A little');await page.locator('textarea').fill('Disaster preparedness');await choose('Based on what you knew','Not enough knowledge to say');}
   else assert.equal(await page.locator('textarea').count(),0);
   await page.screenshot({path:`/tmp/rmu-prolific-${viewport.width}-${awareness.replaceAll(' ','-')}.png`,fullPage:true});
   await page.getByRole('button',{name:'Continue',exact:true}).click();await page.locator('blockquote').waitFor();
   await choose('Having read this description','Somewhat favourable');await page.getByRole('button',{name:'Finish survey'}).click();
   await page.getByRole('heading',{name:'Thank you for sharing your views'}).waitFor();assert.equal(await page.getByRole('link',{name:'Return to Prolific'}).count(),0);
  }
  for(const recall of ['No','I cannot remember']){await begin();await choose('currently consider','Yes');await choose('Thinking back',recall);await page.getByRole('button',{name:'Continue',exact:true}).click();await page.getByRole('heading',{name:'Thank you for answering the screening questions'}).waitFor();}
  await page.goto(base+'/survey/rihanna-clf?preview=1');await page.getByRole('button',{name:'I do not agree'}).click();await page.getByRole('heading',{name:'You have not joined the study'}).waitFor();
  assert.deepEqual(errors,[]);assert.deepEqual(writes,[],'Preview must never POST responses');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const closed=await page.request.post(base+'/api/survey/rihanna-clf',{headers:{Origin:base},data:{action:'start',consent:true}});assert.equal(closed.status(),409);
  const foreign=await page.request.post(base+'/api/survey/rihanna-clf',{headers:{Origin:'https://other.example'},data:{action:'start'}});assert.equal(foreign.status(),403);
  await page.close();console.log(`PASS ${viewport.width}: aware/unaware/uncertain, former fan, both screen-outs, no consent, no preview writes, closed intake`);
 }
}finally{await browser.close();}
