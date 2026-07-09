const { test, expect } = require('@playwright/test');

test.describe('visual snapshots', () => {
  test('index.html matches baseline', async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForLoadState('networkidle');
    // Wait for loading to finish and the start screen to appear.
    await page.locator('#start-screen').waitFor({ state: 'visible', timeout: 10000 });
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot('index.png');
  });

  test('index.html room view matches baseline', async ({ page }) => {
    await page.goto('/index.html?seed=eyJ2IjoxLCJyb29tIjp7IndpZHRoIjozLjUsImRlcHRoIjozLCJhbGxUaGlja25lc3MiOjAuMSwib3V0bGluZSI6W1stMS43NSwtMS41XSxbMS43NSwtMS41XSxbMS43NSwxLjVdLFstMS43NSwxLjVdXSwicGxheWVyU3Bhd24iOlswLDBdLCJsdWx1U3BhdyI6WzAuMywwLjddfSwiZnVybml0dXJlIjpbeyJ0eXBlIjoiYmVkIiwicG9zaXRpb24iOlstMS4yLDAuNSwtMC44XSwicm90YXRpb24iOjB9XX19');
    await page.waitForLoadState('networkidle');
    await page.locator('#start-screen').waitFor({ state: 'visible', timeout: 10000 });
    // Hide the start screen so the rendered room is visible.
    await page.addStyleTag({ content: '#start-screen, #hud, #crosshair, #prompt { display: none !important; }' });
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('room.png');
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
