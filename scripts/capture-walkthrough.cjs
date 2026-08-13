const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT = process.argv[2] || path.join(__dirname, '..', 'docs', 'plans', 'ghibli-restyle', 'reports', 'walkthrough');
fs.mkdirSync(OUT, { recursive: true });

const BASE = 'http://localhost:8765';

async function shellShot(page, name, timeOfDay) {
  await page.goto(`${BASE}/${name}.html`, { waitUntil: 'networkidle' });
  if (name === 'index') {
    await page.locator('#start-screen').waitFor({ state: 'visible', timeout: 10000 });
    await page.addStyleTag({ content: '#start-screen, #hud, #crosshair, #prompt, .loading { display: none !important; }' });
    await page.waitForTimeout(500);
  } else if (name === 'editor') {
    await page.waitForFunction(() => Boolean(window.__editorSnapshotReady), { timeout: 10000 });
    await page.waitForTimeout(200);
  } else {
    await page.waitForTimeout(500);
  }
  await page.screenshot({ path: path.join(OUT, `${timeOfDay}-${name}.png`) });
}

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  for (const tod of ['morning', 'afternoon', 'night']) {
    const hour = tod === 'morning' ? '2026-06-22T08:00:00' : tod === 'afternoon' ? '2026-06-22T14:00:00' : '2026-06-22T22:00:00';
    const page = await context.newPage();
    await page.addInitScript((h) => { window.__TIME_OF_DAY_NOW__ = new Date(h); window.__snapshotMode = true; }, hour);
    for (const shell of ['index', 'editor', 'model-viewer']) {
      await shellShot(page, shell, tod);
    }
    await page.close();
  }
  await browser.close();
  console.log('screenshots in', OUT);
})();
