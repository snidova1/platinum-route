import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawn, execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(import.meta.url);
let playwright;
for (const base of ['D:/Claude', process.env.PLAYWRIGHT_ROOT || 'D:/Hermes-Profile-Import/home/celeng/.hermes/cache/scratch/leonida-browser']) {
  try { playwright = require(require.resolve('playwright', { paths: [base] })); break; } catch {}
}
if (!playwright) throw new Error('Install Playwright outside app/ and set PLAYWRIGHT_ROOT to its parent.');
const port = 8094;
const origin = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['serve.ts','--port',String(port)], { cwd: root, stdio: 'pipe' });
await new Promise((done,fail) => { server.stdout.once('data',done); server.once('error',fail); server.once('exit',code=>fail(new Error(`Server exit ${code}`))); });
const browser = await playwright.chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const context = await browser.newContext({ viewport: { width:1280, height:800 }, deviceScaleFactor:1 });
const page = await context.newPage();
const errors = [];
const requests = [];
page.on('pageerror',error=>errors.push(error.message));
page.on('request',request=>requests.push(request.url()));
const output = resolve(root, process.argv[2] || 'screenshots');
mkdirSync(output,{recursive:true});
const sampleEarned = [2,15,35];
async function open() {
  await page.goto(origin);
  await page.waitForSelector('body[data-ready=true]');
}
async function screenshot(name) {
  const path = resolve(output,name);
  await page.screenshot({path,type:'jpeg',quality:87,fullPage:false});
  assert(statSync(path).size <= 262144, `Oversize screenshot: ${name}`);
  console.log(`${name}: ${statSync(path).size} bytes`);
}
try {
  await open();
  const data = JSON.parse(readFileSync(resolve(root,'app/data/trophies.json'),'utf8')).trophies;
  const starter = JSON.parse(execFileSync('git',['show','b80e994:app/data/trophies.json'],{cwd:root,encoding:'utf8'})).trophies;
  assert.equal(data.length,55);
  for (const t of data) {
    const original = starter.find(o=>o.id===t.id);
    assert(original);
    for (const key of ['name','description','grade']) assert.equal(t[key],original[key],`Official ${key} changed for ${t.id}`);
    assert(t.guide.split(/[.!?](?:\s|$)/).filter(Boolean).length >= 2);
    assert(t.sources.length && t.guide.includes('Per ') || t.guide.includes('From the official description'));
  }
  assert.equal(data.filter(t=>t.hidden).length,28);
  assert.equal(await page.locator('.trophy-row').count(),55);
  assert.equal(await page.getByText('Story trophy protected',{exact:true}).count(),12);
  await page.locator('[data-earn="2"]').first().check();
  await page.reload();
  await page.waitForSelector('body[data-ready=true]');
  assert(await page.locator('[data-earn="2"]').first().isChecked());
  assert.equal(await page.getByText('Just Like Paradise',{exact:true}).count(),1);
  await page.locator('[data-kind=collectible]').click();
  assert.equal(await page.locator('.trophy-row').count(),5);
  await page.locator('[data-kind=missable]').click();
  assert.equal(await page.locator('.trophy-row').count(),1);
  await page.locator('[data-kind=all]').click();
  await page.locator('#hidden').uncheck();
  assert.equal(await page.locator('.trophy-row').count(),28);
  await page.locator('#hidden').check();
  await page.locator('#earned').uncheck();
  assert.equal(await page.locator('.trophy-row').count(),54);
  await page.locator('#earned').check();
  await page.locator('#grade').selectOption('silver');
  assert.equal(await page.locator('.trophy-row').count(),6);
  await page.locator('#grade').selectOption('all');
  await page.locator('#search').fill('Collectible Card');
  assert.equal(await page.locator('.trophy-row').count(),1);
  await page.locator('#search').fill('no-such-trophy');
  assert(await page.locator('.empty').isVisible());
  await page.locator('#clear-filters').click();
  await page.locator('#spoilers').uncheck();
  assert.equal(await page.getByText('Story trophy protected',{exact:true}).count(),0);
  await page.locator('#spoilers').check();
  await page.locator('[data-reveal="3"]').click();
  assert(await page.getByRole('button',{name:'Paradise Lost',exact:true}).isVisible());
  await page.locator('#import').setInputFiles({name:'test.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({app:'leonida-route',version:1,earned:sampleEarned,spoilers:true}))});
  await page.waitForFunction(()=>document.getElementById('progress').textContent==='3 / 55');
  assert.equal(await page.locator('#progress').textContent(),'3 / 55');
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#export').click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  let chunks=[]; for await (const chunk of stream) chunks.push(chunk);
  const backup=JSON.parse(Buffer.concat(chunks).toString());
  assert.deepEqual(backup.earned,sampleEarned);
  await page.locator('#import').setInputFiles({name:'broken.json',mimeType:'application/json',buffer:Buffer.from('{invalid')});
  await page.waitForFunction(()=>document.getElementById('notice').textContent.includes('Import failed'));
  assert((await page.locator('#notice').textContent()).includes('Import failed'));
  assert.equal(await page.locator('#progress').textContent(),'3 / 55');
  await page.reload();
  await page.waitForSelector('body[data-ready=true]');
  await page.locator('[data-select="30"]').first().click();
  await page.evaluate(()=>window.scrollTo(0,0));
  await screenshot('1-tracker.jpg');
  await page.locator('#roadmap-tab').click();
  await page.evaluate(()=>window.scrollTo(0,245));
  await screenshot('2-roadmap.jpg');
  assert.equal(await page.locator('.route-stage').count(),4);
  assert.equal(await page.locator('.stage-content li').count(),55);
  await page.locator('#tracker-tab').click();
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.locator('[data-kind=missable]').click();
  await page.locator('[data-select="28"]').first().click();
  await page.evaluate(()=>window.scrollTo(0,225));
  await screenshot('3-missables.jpg');
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(()=>window.scrollTo(0,0));
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Mobile overflow');
  await page.screenshot({path:resolve(root,'tools/.capture-cache/mobile.jpg'),type:'jpeg',quality:80,fullPage:true});
  const external=requests.filter(url=>!url.startsWith(origin) && !url.startsWith('data:'));
  assert.deepEqual(external,[]);
  assert.deepEqual(errors,[]);
  const report={checks:'55 official strings, 28 hidden, persistence, kind/grade/search filters, empty state, spoiler toggle/reveal, import/export roundtrip, invalid import safety, 55 roadmap entries, 390px layout, no external requests, no JS errors',requests:[...new Set(requests)],screenshots:readdirSync(output).filter(f=>f.endsWith('.jpg'))};
  writeFileSync(resolve(root,'tools/.capture-cache/verification.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
} finally { await browser.close(); server.kill(); }
