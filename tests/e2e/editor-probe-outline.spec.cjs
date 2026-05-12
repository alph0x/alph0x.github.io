const { test, expect } = require('@playwright/test');

test('probe outline mode', async ({ page }) => {
  await page.goto('/editor.html');
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('#canvas-wrap > canvas:not(#preview-wrap canvas)', { state: 'visible', timeout: 10000 });
  await page.waitForTimeout(800);

  await page.click('#toolOutline');
  await page.waitForTimeout(300);

  const info = await page.evaluate(() => {
    const canvas = document.querySelector('#canvas-wrap > canvas:not(#preview-wrap canvas)');
    const rect = canvas.getBoundingClientRect();
    const handle = window.__editorProject(0, 1.75);
    return { rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height }, handle };
  });
  console.log('info:', info);

  // Move mouse to handle and click
  await page.mouse.move(info.handle.x, info.handle.y);
  await page.mouse.down();
  await page.mouse.move(info.handle.x, info.handle.y - 80, { steps: 5 });
  await page.mouse.up();
  await page.waitForTimeout(300);

  const after = await page.evaluate(() => window.__editorState.outline);
  console.log('outline after drag:', after);

  await page.screenshot({ path: 'tests/e2e/screenshots/probe-drag.png' });
});
