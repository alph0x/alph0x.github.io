/**
 * @fileoverview E2E tests for the interactive 3D portfolio.
 */

const { test, expect } = require('@playwright/test');

const BOOT_TIMEOUT = process.env.CI ? 60000 : 10000;

// Enclosing budget: 180s regardless of CI. A full WebGL room boot under
// 5-worker contention exceeds a 60s local slice, and every wait here is a
// readiness predicate — a generous cap never causes a false pass, it only
// stops stressing the worker pool.
require('@playwright/test').test.setTimeout(180000);

function filterKnownErrors(errors) {
  return errors.filter((e) => {
    const normalized = e.toLowerCase();
    // Pointer lock fails in headless/automated browsers — not a portfolio bug
    if (normalized.includes('pointer lock')) return false;
    if (e.includes('WrongDocumentError')) return false;
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

    // Wait for actual boot readiness: game instanced and interactables populated.
    // Prefer this positive signal over #loading hiding — that's a consequence of
    // loading.ts's 8s safety timeout, not the readiness contract; a contended
    // boot may show the start screen late but never before ready.
    await page.waitForFunction(
      () => window.__game !== undefined && window.__game.worldState?.room?.interactables?.length > 0
    );
    const startScreen = page.locator('#start-screen');
    await expect(startScreen).toBeVisible();

    await page.screenshot({ path: 'tests/e2e/screenshots/01-start-screen.png' });

    await page.locator('#start-btn').click({ force: true });
    await expect(startScreen).toBeHidden();

    await expect(page.locator('canvas')).toBeVisible();
    await page.waitForFunction(() => window.__scene, { timeout: BOOT_TIMEOUT });
    // Let the first frames render before screenshotting
    await page.evaluate(() => new Promise((resolve) => {
      let frames = 0;
      // Bound the rAF wait: under 5-worker contention rAF in a parked tab can be
      // starved; a loaded canvas beats a hanging evaluate. Not a fixed sleep —
      // fires immediately when healthy.
      const timeout = setTimeout(() => resolve(true), 5000);
      const tick = () => {
        if (++frames >= 2) {
          clearTimeout(timeout);
          resolve(true);
        } else {
          requestAnimationFrame(tick);
        }
      };
      requestAnimationFrame(tick);
    }));
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
    // Wait for boot readiness first, then the gameplay canvas (no fixed timeout —
    // test-level 180s local / 180s CI enclosing budget already set at module top).
    await page.waitForFunction(
      () => window.__game !== undefined && window.__game.worldState?.room?.interactables?.length > 0
    );
    await expect(page.locator('canvas')).toBeVisible();

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
