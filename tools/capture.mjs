import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(import.meta.url);
const searchRoots = [process.env.PLAYWRIGHT_ROOT, root, 'D:/Claude'].filter(Boolean);
const { chromium } = require(require.resolve('playwright', { paths: searchRoots }));
const port = 8097;
const origin = `http://127.0.0.1:${port}`;
const destination = resolve(root, process.argv[2] ?? 'screenshots');
const server = spawn(process.execPath, ['serve.ts', '--port', String(port)], { cwd: root, stdio: ['ignore', 'pipe', 'inherit'] });
let browser;

try {
  await new Promise((ready, fail) => {
    const timeout = setTimeout(() => fail(Error('Local server did not start')), 5000);
    server.stdout.once('data', () => { clearTimeout(timeout); ready(); });
    server.once('error', fail);
    server.once('exit', code => { clearTimeout(timeout); fail(Error(`Local server exited (${code})`)); });
  });
  browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors = [];
  const outbound = [];
  page.on('pageerror', error => errors.push(error.message));
  await context.route('**/*', route => {
    const url = route.request().url();
    if (url.startsWith(origin + '/') || url.startsWith('file:')) return route.continue();
    outbound.push(url);
    return route.abort();
  });
  await mkdir(destination, { recursive: true });
  const shot = async name => {
    await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0, 0); });
    for (const quality of [94, 88, 81, 73, 63, 51]) {
      const bytes = await page.screenshot({ type: 'jpeg', quality, animations: 'disabled' });
      if (bytes.length > 256 * 1024) continue;
      await writeFile(resolve(destination, name), bytes);
      console.log(`${name}: ${bytes.length} bytes`);
      return;
    }
    throw Error(`JPEG exceeds gate: ${name}`);
  };
  const rows = page.locator('#trophy-list .trophy-row');
  await page.goto(origin);
  assert.equal(await rows.count(), 55);
  assert.equal(await page.locator('#trophy-list .masked').count(), 12);
  for (const id of [2, 30, 35, 16, 21]) await page.locator(`[data-earn="${id}"]`).check();
  await page.reload();
  assert.equal(await page.locator('#trophy-list input:checked').count(), 5);
  await shot('1-tracker.jpg');

  await page.locator('nav [data-view="settings"]').click();
  await page.locator('#spoiler-toggle').uncheck();
  await page.locator('nav [data-view="roadmap"]').click();
  assert.equal(await page.locator('[data-route-trophy]').count(), 55);
  assert.equal(await page.locator('.route-risk:visible').count(), 1);
  await shot('2-roadmap.jpg');
  await page.locator('[data-exit="2"]').click();
  assert.equal(await page.locator('#stops-2 [data-route-trophy]:visible').count(), 4);
  await page.locator('#stops-2 [data-route-trophy="30"]').click();
  assert.match(await page.locator('#guide h3').textContent(), /Touch My Deck/);

  await page.locator('nav [data-view="settings"]').click();
  await page.locator('#spoiler-toggle').check();
  await page.locator('nav [data-view="tracker"]').click();
  await page.locator('#kinds [data-kind="missable"]').click();
  assert.equal(await rows.count(), 1);
  await page.evaluate(() => window.scrollTo(0, 0));
  for (const link of await page.locator('#guide .citations a').all()) {
    const box = await link.boundingBox();
    assert.ok(box && box.y + box.height < 760, `Missable source link is too low: ${JSON.stringify(box)}`);
  }
  await shot('3-missables.jpg');

  await page.locator('nav [data-view="settings"]').click();
  const pending = page.waitForEvent('download');
  await page.locator('#export-save').click();
  const download = await pending;
  const exported = await readFile(await download.path());
  assert.deepEqual(JSON.parse(exported).earned, [2, 16, 21, 30, 35]);
  await page.locator('#save-file').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{') });
  await page.getByText(/current progress was kept/).waitFor();
  await page.locator('#save-file').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: exported });
  await page.getByText('Imported 5 earned trophies.').waitFor();
  await shot('4-export.jpg');

  await page.locator('nav [data-view="tracker"]').click();
  await page.locator('#kinds [data-kind="all"]').click();
  await page.locator('#grade').selectOption('silver');
  assert.equal(await rows.count(), 6);
  await page.locator('#grade').selectOption('all');
  await page.locator('#hidden-toggle').uncheck();
  assert.equal(await rows.count(), 27);
  await page.locator('#hidden-toggle').check();
  await page.locator('#earned-toggle').uncheck();
  assert.equal(await rows.count(), 50);
  await page.locator('#earned-toggle').check();
  await page.locator('#search').fill('paradise lost');
  assert.equal(await rows.count(), 0);
  await page.locator('#search').clear();
  await page.locator('[data-reveal="3"]').click();
  assert.match(await page.locator('[data-select="3"]').textContent(), /Paradise Lost/);
  for (const width of [768, 375]) {
    await page.setViewportSize({ width, height: 800 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Layout overflows at ${width}px`);
  }
  await context.setOffline(true);
  await page.goto(pathToFileURL(resolve(root, 'app/index.html')).href);
  assert.equal(await rows.count(), 55);
  assert.deepEqual(errors, []);
  assert.deepEqual(outbound, []);
  console.log('Browser checks passed: filters, spoiler, persistence, import/export, stage links, offline file launch, no outbound requests.');
} finally {
  try { await browser?.close(); } finally { server.kill(); }
}
