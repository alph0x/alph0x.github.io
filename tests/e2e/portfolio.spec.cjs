/**
 * @fileoverview E2E tests for the interactive 3D portfolio.
 */

const { test, expect } = require('@playwright/test');

const BOOT_TIMEOUT = process.env.CI ? 60000 : 10000;

require('@playwright/test').test.setTimeout(process.env.CI ? 180000 : 60000);

function filterKnownErrors(errors) {
  return errors.filter((e) => {
    // Pointer lock fails in headless/automated browsers — not a portfolio bug
    if (e.includes('Pointer Lock API')) return false;
    if (e.includes('WrongDocumentError')) return false;
    if (e.includes('pointer lock')) return false;
    return true;
  });
}

test.describe('Portfolio Desktop', () => {
  test.beforeEach(async ({ page }) => {
    page.errors = [];
    page.on('pageerror', (err) => page.errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') page.errors.push(msg.text());
    });
  });

  test('start screen loads and portfolio renders', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop-only test');
    await page.goto('/');

    // Wait for loading to finish and the start screen to appear.
    await page.locator('#loading').waitFor({ state: 'hidden', timeout: BOOT_TIMEOUT });
    const startScreen = page.locator('#start-screen');
    await expect(startScreen).toBeVisible({ timeout: BOOT_TIMEOUT });

    await page.screenshot({ path: 'tests/e2e/screenshots/01-start-screen.png' });

    await page.locator('#start-btn').click({ force: true });
    await expect(startScreen).toBeHidden();

    await expect(page.locator('canvas')).toBeVisible();
    await page.waitForFunction(() => window.__scene, { timeout: BOOT_TIMEOUT });
    // Let the first frames render before screenshotting
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    await page.screenshot({ path: 'tests/e2e/screenshots/02-room-desktop.png' });

    const realErrors = filterKnownErrors(page.errors);
    expect(realErrors).toHaveLength(0);
  });
});

test.describe('Portfolio Mobile', () => {
  test('touch controls are visible on mobile landscape', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile-only test');
    // Set mobile landscape viewport BEFORE navigating so initGame() detects it
    await page.setViewportSize({ width: 851, height: 393 });
    await page.goto('/');

    page.errors = [];
    page.on('pageerror', (err) => page.errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') page.errors.push(msg.text());
    });

    // Canvas should be visible (mobile skips start screen)
    await page.waitForSelector('canvas', { state: 'visible', timeout: BOOT_TIMEOUT });

    // Touch controls should exist
    const touchControls = page.locator('#touch-controls');
    await expect(touchControls).toBeVisible();

    // Interact button should exist
    const interactBtn = page.locator('#touch-interact');
    await expect(interactBtn).toBeVisible();

    await page.screenshot({ path: 'tests/e2e/screenshots/04-mobile-controls.png' });

    const realErrors = filterKnownErrors(page.errors);
    expect(realErrors).toHaveLength(0);
  });
});
