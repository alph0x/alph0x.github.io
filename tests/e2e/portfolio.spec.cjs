/**
 * @fileoverview E2E tests for the interactive 3D portfolio.
 */

const { test, expect } = require('@playwright/test');

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

    const startScreen = page.locator('#start-screen');
    await expect(startScreen).toBeVisible({ timeout: 5000 });

    await page.screenshot({ path: 'tests/e2e/screenshots/01-start-screen.png' });

    await page.locator('#start-btn').click();
    await expect(startScreen).toBeHidden();

    await expect(page.locator('canvas')).toBeVisible();
    await page.waitForTimeout(500);
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
    await page.waitForSelector('canvas', { state: 'visible', timeout: 5000 });

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
