/**
 * @fileoverview E2E tests for the room layout editor.
 */

const { test, expect } = require('@playwright/test');

function filterKnownErrors(errors) {
  return errors.filter((e) => {
    if (e.includes('Pointer Lock API')) return false;
    if (e.includes('WrongDocumentError')) return false;
    if (e.includes('pointer lock')) return false;
    return true;
  });
}

test.describe('Editor E2E', () => {
  test.beforeEach(async ({ page }) => {
    page.errors = [];
    page.on('pageerror', (err) => page.errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') page.errors.push(msg.text());
    });
  });

  test('loads, zooms, and toggles 3D/top view', async ({ page }) => {
    await page.goto('/editor.html');

    // Wait for main canvas to appear (direct child of canvas-wrap, not the preview)
    await page.waitForSelector('#canvas-wrap > canvas', { state: 'visible', timeout: 8000 });

    // Wait for view mode button
    const viewBtn = page.locator('#btnViewMode');
    await expect(viewBtn).toBeVisible();

    // Screenshot 1: initial top view
    await page.screenshot({ path: 'tests/e2e/screenshots/editor-01-top-view.png' });

    // Zoom in (scroll wheel up on canvas)
    await page.mouse.move(640, 360);
    await page.mouse.wheel(0, -500);
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'tests/e2e/screenshots/editor-02-zoom-in.png' });

    // Zoom out (scroll wheel down on canvas)
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'tests/e2e/screenshots/editor-03-zoom-out.png' });

    // Toggle to 3D view
    await viewBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'tests/e2e/screenshots/editor-04-3d-view.png' });

    // Toggle back to top view
    await viewBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'tests/e2e/screenshots/editor-05-back-to-top.png' });

    const realErrors = filterKnownErrors(page.errors);
    expect(realErrors).toHaveLength(0);
  });
});
