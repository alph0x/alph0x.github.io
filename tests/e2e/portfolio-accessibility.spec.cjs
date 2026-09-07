/**
 * @fileoverview Accessibility gate for the recruiter shell and portfolio dialogs.
 */
const { test, expect } = require('@playwright/test');

test.setTimeout(180000);

test.describe('Portfolio accessibility shell', () => {
  test.skip(({ isMobile }) => !!isMobile, 'desktop dialog flow only');

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#start-screen')).toBeVisible({ timeout: 60000 });
  });

  test('exposes landmark navigation and keeps closed dialogs out of the accessibility tree', async ({ page }) => {
    await expect(page.getByRole('banner')).toHaveCount(1);
    await expect(page.getByRole('main')).toHaveCount(1);
    await expect(page.getByRole('contentinfo')).toHaveCount(1);
    await expect(page.getByRole('link', { name: 'Skip to portfolio content' })).toBeVisible();

    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.locator('.info-panel')).toHaveCount(4);
    await expect(page.locator('.info-panel[hidden][aria-hidden="true"]')).toHaveCount(4);
  });

  test('opens a dialog at its close control, contains focus, and restores its opener on Escape', async ({ page }) => {
    const opener = page.getByRole('button', { name: 'Contact', exact: true }).first();
    await opener.focus();
    await opener.press('Enter');

    const dialog = page.getByRole('dialog', { name: 'Contact' });
    const close = dialog.getByRole('button', { name: 'Close' });
    const github = dialog.getByRole('link', { name: 'github.com/alph0x' });
    await expect(dialog).toBeVisible();
    await expect(close).toBeFocused();

    await page.keyboard.press('Shift+Tab');
    await expect(github).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(close).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
  });

  test('labels AlphGPT controls and announces typing and replies without exposing chat history as a live region', async ({ page }) => {
    await page.evaluate(() => {
      window.__game.interaction.openPanel('panel-alphgpt');
    });

    const dialog = page.getByRole('dialog', { name: 'AlphGPT' });
    const input = dialog.getByLabel('Message AlphGPT');
    const send = dialog.getByRole('button', { name: 'Send message to AlphGPT' });
    const live = dialog.locator('#alphgpt-live');
    await expect(dialog).toBeVisible();
    await expect(input).toBeVisible();
    await expect(send).toBeVisible();
    await expect(live).toHaveAttribute('aria-live', 'polite');
    await expect(live).toHaveAttribute('aria-atomic', 'true');
    await expect(dialog.locator('#alphgpt-messages')).not.toHaveAttribute('aria-live');

    await page.evaluate(() => {
      window.__liveUpdates = [];
      const live = document.getElementById('alphgpt-live');
      new MutationObserver(() => window.__liveUpdates.push(live.textContent))
        .observe(live, { childList: true, subtree: true, characterData: true });
    });
    await input.fill('what do you do?');
    await send.click();
    await expect(live).toContainText('AlphGPT:', { timeout: 10000 });
    const liveUpdates = await page.evaluate(() => window.__liveUpdates);
    expect(liveUpdates).toContain('AlphGPT is typing');
    expect(liveUpdates.some((text) => text.includes('AlphGPT:'))).toBe(true);
  });

  test('keeps fallback dialogs contained in the keyboard focus cycle', async ({ page }) => {
    await page.evaluate(() => window.showImmersiveFallback(new Error('safe fallback test'), 'unknown'));

    const fallback = page.locator('#error-display');
    const opener = fallback.getByRole('button', { name: 'Contact', exact: true });
    await opener.focus();
    await opener.press('Enter');

    const dialog = page.getByRole('dialog', { name: 'Contact' });
    const close = dialog.getByRole('button', { name: 'Close' });
    const github = dialog.getByRole('link', { name: 'github.com/alph0x' });
    await expect(close).toBeFocused();

    await page.keyboard.press('Shift+Tab');
    await expect(github).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(close).toBeFocused();
  });
});
