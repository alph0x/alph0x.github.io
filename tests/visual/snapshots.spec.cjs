const { test, expect } = require('@playwright/test');

test.describe('visual snapshots', () => {
  test('index.html matches baseline', async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('index.png');
  });

  test('editor.html matches baseline', async ({ page }) => {
    await page.goto('/editor.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('editor.png');
  });

  test('model-viewer.html matches baseline', async ({ page }) => {
    await page.goto('/model-viewer.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('model-viewer.png');
  });

});
