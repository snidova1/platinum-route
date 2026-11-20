import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createAppServer } from '../serve.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const work = join(root, 'out', 'capture');
const manifest = JSON.parse(readFileSync(join(root, 'shots.json'), 'utf8'));
const viewport = { width: 1280, height: 800 };
const sampleEarned = [2, 16, 19, 20, 21, 31, 35, 41, 45, 53];
const require = createRequire(import.meta.url);

function findPlaywright() {
  const candidates = [
    process.env.PLAYWRIGHT_MODULE,
    'D:/Claude/node_modules/playwright',
    'D:/Claude/node_modules/playwright-core',
    'playwright',
    'playwright-core',
    join(root, 'out/browser/node_modules/playwright-core')
  ];
  for (const candidate of candidates.filter(Boolean)) {
    try {
      return require(candidate);
    } catch (error) {
      if (error.code !== 'MODULE_NOT_FOUND') throw error;
    }
  }
  throw new Error('Install playwright or playwright-core, or set PLAYWRIGHT_MODULE to its installed path.');
}

function chromePath() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
  ];
  return candidates.find(path => path && existsSync(path));
}

async function captureJpeg(page, filename) {
  for (const quality of [93, 87, 81, 75, 69]) {
    const image = await page.screenshot({ type: 'jpeg', quality });
    if (image.length <= 256 * 1024) {
      writeFileSync(join(root, 'screenshots', filename), image);
      console.log(filename + ' · ' + image.length + ' bytes');
      return;
    }
  }
  throw new Error(filename + ' exceeds 256 KiB');
}

async function exerciseTracker(page) {
  assert.equal(await page.locator('#trophy-list > li').count(), 55);
  assert.equal(await page.getByText('Just Like Paradise', { exact: true }).count(), 0);
  await page.locator('#search').fill('Gone Fishing');
  assert.equal(await page.locator('#trophy-list > li').count(), 0);
  await page.locator('#search').clear();
  await page.locator('[data-id="2"] .reveal-button').click();
  assert.equal(await page.locator('[data-id="2"] .trophy-name').textContent(), 'Just Like Paradise');
  await page.locator('[data-id="2"] .earned-check').check();
  await page.reload();
  await page.locator('[data-id="2"] .trophy-name').waitFor();
  assert.equal(await page.locator('[data-id="2"] .earned-check').isChecked(), true);
  await page.locator('#show-earned').uncheck();
  assert.equal(await page.locator('#trophy-list > li').count(), 54);
  await page.locator('#show-earned').check();
  await page.locator('#show-hidden').uncheck();
  assert.equal(await page.locator('#trophy-list > li').count(), 27);
  await page.locator('#show-hidden').check();
  await page.locator('#grade').selectOption('silver');
  assert.equal(await page.locator('#trophy-list > li').count(), 6);
  await page.locator('#grade').selectOption('all');
  await page.getByRole('button', { name: 'Export / import' }).click();
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export JSON' }).click();
  const download = await downloadEvent;
  const saved = JSON.parse(readFileSync(await download.path(), 'utf8'));
  assert.deepEqual(saved, { version: 1, earned: [2], spoilers: true });
  await page.locator('#backup-file').setInputFiles({
    name: 'bad.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"version":1,"earned":[999],"spoilers":false}')
  });
  await page.getByText('Your checklist is unchanged.', { exact: false }).waitFor();
  await page.locator('#backup-file').setInputFiles({
    name: 'demo.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ version: 1, earned: sampleEarned, spoilers: true }))
  });
  await page.getByText('Restored 10 earned trophies.').waitFor();
  await page.getByRole('button', { name: 'Tracker', exact: true }).click();
  assert.equal(await page.locator('#earned-total').textContent(), '10 / 55');
}

async function renderScreenshots(url) {
  const { chromium } = findPlaywright();
  const browser = await chromium.launch({ executablePath: chromePath(), headless: true });
  try {
    const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', request => {
      if (new URL(request.request().url()).origin === new URL(url).origin) return request.continue();
      errors.push('Unexpected request: ' + request.request().url());
      return request.abort();
    });
    await page.goto(url);
    await page.locator('#tracker').waitFor();
    await exerciseTracker(page);

    for (const shot of manifest) {
      if (shot.view === 'tracker') {
        await page.locator('[data-id="30"] .trophy-pick').click();
        assert.equal(await page.locator('#guide-name').textContent(), "Don't Touch My Deck");
        assert.equal(await page.locator('#field-guide .source-links a').count(), 3);
      } else if (shot.view === 'roadmap') {
        await page.getByRole('button', { name: 'Roadmap', exact: true }).click();
        assert.equal(await page.getByText('Story trophy shielded', { exact: true }).filter({ visible: true }).count(), 11);
        await page.locator('#route-spoilers').uncheck();
        const stops = new Set();
        for (const sign of await page.locator('.exit-sign').all()) {
          await sign.click();
          for (const name of await page.locator('.stop-copy strong').allTextContents()) stops.add(name);
        }
        assert.equal(stops.size, 55);
        await page.locator('.exit-sign').first().click();
      } else if (shot.view === 'missables') {
        await page.locator('#route-checkpoint').click();
        await page.locator('#spoilers').check();
        assert.equal(await page.locator('[data-kind="missable"]').getAttribute('aria-pressed'), 'true');
        assert.equal(await page.locator('#trophy-list > li').count(), 1);
      } else if (shot.view === 'settings') {
        await page.getByRole('button', { name: 'Export / import' }).click();
      }
      await captureJpeg(page, shot.file);
    }
    assert.deepEqual(errors, []);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('button', { name: 'Tracker', exact: true }).click();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    console.log('Verified filters, spoiler privacy, persistence, import/export, all roadmap stops, and mobile width.');
  } finally {
    await browser.close();
  }
}

async function detect(url) {
  const command = process.platform === 'win32' ? 'cmd.exe' : 'npx';
  const args = process.platform === 'win32'
    ? ['/d', '/c', 'npx', '--yes', 'impeccable', 'detect', url]
    : ['--yes', 'impeccable', 'detect', url];
  const child = spawn(command, args, { stdio: 'inherit', cwd: root });
  const [code] = await once(child, 'exit');
  if (code !== 0) throw new Error('Impeccable exited with code ' + code);
}

mkdirSync(work, { recursive: true });
process.env.TEMP = work;
process.env.TMP = work;
process.env.TMPDIR = work;
process.env.npm_config_cache ??= join(root, 'out', 'npm-cache');
process.env.IMPECCABLE_HOME ??= join(root, 'out', 'impeccable');
const server = createAppServer();
try {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const url = 'http://localhost:' + server.address().port + '/';
  if (process.argv.includes('--detect')) await detect(url);
  else await renderScreenshots(url);
} finally {
  server.close();
}
