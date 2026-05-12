const { test, expect } = require('@playwright/test');

test('debug drag in spec pattern', async ({ page }) => {
  await page.goto('/editor.html');
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('#canvas-wrap > canvas:not(#preview-wrap canvas)', { state: 'visible', timeout: 10000 });
  await page.waitForTimeout(800);

  await page.click('#toolOutline');
  await page.waitForTimeout(300);

  const dimsBefore = await page.locator('#roomDimensions').textContent();
  console.log('dims before:', dimsBefore);

  const handle = await page.evaluate(() => window.__editorProject(0, 1.75));
  console.log('handle:', handle);

  await page.mouse.move(handle.x, handle.y);
  await page.mouse.down();
  await page.mouse.move(handle.x, handle.y - 100, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(500);

  const dimsAfter = await page.locator('#roomDimensions').textContent();
  console.log('dims after:', dimsAfter);

  const outline = await page.evaluate(() => window.__editorState.outline);
  console.log('outline:', outline);
});
