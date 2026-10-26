import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import published from '../server/google-trends.json' with {type:'json'};
import {trendLinePath} from '../app/lab/trends.ts';
const browser=await chromium.launch({headless:true,args:['--enable-automation','--mute-audio','--autoplay-policy=user-gesture-required']});
const cdp=await browser.newBrowserCDPSession();assert((await cdp.send('Browser.getBrowserCommandLine')).arguments.includes('--mute-audio'));
const results=[];await mkdir('outputs/trends-published',{recursive:true});
try{
 for(const width of [1920,1440,390]){
  const page=await browser.newPage({viewport:{width,height:width===1920?1080:width===1440?900:844}});const errors=[],google=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(new URL(r.url()).hostname==='trends.google.com')google.push(r.url());});
  await page.addInitScript(()=>{Object.defineProperty(Element.prototype,'requestFullscreen',{configurable:true,value:async()=>undefined});});
  try{
   await page.goto('https://rmu.universalmind.tv/intelligence/violence/#lab',{waitUntil:'domcontentloaded'});await page.getByTestId('lab-report-line').waitFor();await page.waitForFunction(()=>getComputedStyle(document.querySelector('.screen-window')).opacity==='1');
   assert.equal(await page.getByLabel('Source and measure').inputValue(),'abs-domestic-assault');
   const response=await page.request.get('https://rmu.universalmind.tv/api/lab/trends/');assert.equal(response.status(),200);assert.deepEqual(await response.json(),published);
   await page.getByRole('button',{name:'Violence, reporting & search interest',exact:false}).click();const dialog=page.getByRole('dialog');await dialog.getByTestId('google-trends-line').waitFor();assert.equal(await dialog.locator('input[type=file]').count(),0);
   for(const record of published.exports){
    await dialog.getByLabel('Search geography').selectOption(record.geography);
    await dialog.getByRole('button',{name:'All available',exact:true}).click();
    const line=dialog.getByTestId('google-trends-line');assert.equal(await line.getAttribute('d'),trendLinePath(record.time.rows.map(r=>r.partial?{...r,value:null}:r)));
    assert.equal(await dialog.getByTestId('google-trends-incomplete-line').getAttribute('stroke-dasharray'),'5 4');
    const details=dialog.locator('details').filter({has:page.getByText('View source observations',{exact:true})});
    if(!await details.getAttribute('open')&&await details.getAttribute('open')!== '')await details.locator('summary').click();
    const tableRows=details.locator('tbody tr');assert.equal(await tableRows.count(),274);
    assert.equal(await tableRows.first().innerText(),`2004-01\t${record.time.rows[0].display}`);
    assert.equal(await tableRows.last().innerText(),`2026-10 · incomplete month\t${record.time.rows.at(-1).display}`);
    assert.match(await dialog.innerText(),/2004-01-01 — 2026-10-19/);assert.match(await dialog.innerText(),/Data source: Google Trends/);assert.match(await dialog.innerText(),/exported 2026-10-20/);
    await details.locator('summary').click();await dialog.evaluate(d=>d.scrollTop=0);
    if(width===1440)await page.screenshot({path:`outputs/trends-published/${record.geography||'worldwide'}-all.png`});
    for(const [period,count] of [['10 years',118],['20 years',238]]){
     await dialog.getByRole('button',{name:period,exact:true}).click();await details.locator('summary').click();assert.equal(await tableRows.count(),count);await details.locator('summary').click();
    }
   }
   await dialog.getByLabel('Search geography').selectOption('AU');await dialog.getByRole('button',{name:'All available',exact:true}).click();await dialog.evaluate(d=>d.scrollTop=0);await page.screenshot({path:`outputs/trends-published/australia-${width}.png`});
   await dialog.getByLabel('Search type').selectOption('YouTube Search');assert.equal(await dialog.getByTestId('google-trends-line').count(),0);assert.match(await dialog.innerText(),/No Google Trends export has been published/);assert.doesNotMatch(await dialog.innerText(),/Google export access is currently unavailable/);
   await dialog.getByLabel('Search type').selectOption('Web Search');await dialog.getByTestId('google-trends-line').waitFor();
   await page.keyboard.press('Escape');assert.equal(await page.getByTestId('lab-report-line').count(),1);
   await page.getByLabel('Topic',{exact:true}).selectOption('Violent extremism');await page.getByRole('button',{name:'Violence, reporting & search interest',exact:false}).click();await page.getByRole('dialog').getByRole('heading',{name:'Historical search-interest data is awaiting publication.'}).waitFor();assert.equal(await page.getByTestId('google-trends-line').count(),0);
   assert.deepEqual(errors,[]);assert.deepEqual(google,[]);results.push({width,publishedSeries:3,sourceValuesVerified:822,windows:true,incompleteMonth:true,heroPreserved:true,noVisitorUploads:true,noGoogleRequests:true,errors});console.log('PASS published Google Trends',width);
  }finally{await page.evaluate(()=>document.querySelectorAll('video,audio').forEach(v=>v.pause())).catch(()=>{});await page.close();}
 }
 await writeFile('outputs/trends-published/results.json',JSON.stringify(results,null,2));
}finally{await browser.close();}
