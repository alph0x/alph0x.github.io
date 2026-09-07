/**
 * @fileoverview Recruiter-first entry path regression coverage.
 */
const { test, expect } = require('@playwright/test');

test.setTimeout(180000);

const ACTIONS = [
  { name: 'Profile', panel: 'panel-profile' },
  { name: 'Work', panel: 'panel-work' },
  { name: 'Contact', panel: 'panel-contact' },
];

function isExpectedPointerLockError(message) {
  return message.includes('PointerLockControls: Unable to use Pointer Lock API')
    || message.includes('not valid for pointer lock')
    || message.includes('Pointer Lock was denied');
}

test.describe('Recruiter entry path', () => {
  test.skip(({ isMobile }) => !!isMobile, 'desktop entry path only');

  test.beforeEach(async ({ page }) => {
    page.errors = [];
    page.on('pageerror', (error) => {
      if (!isExpectedPointerLockError(error.message)) page.errors.push(error.message);
    });
    page.on('console', (message) => {
      if (message.type() === 'error' && !isExpectedPointerLockError(message.text())) page.errors.push(message.text());
    });
    await page.goto('/');
    await expect(page.locator('#start-screen')).toBeVisible({ timeout: 60000 });
  });

  test('offers Profile, Work, Contact, and Step inside in keyboard order', async ({ page }) => {
    const actions = page.locator('#recruiter-actions button');
    const recruiterActions = page.locator('#recruiter-actions');
    await expect(actions).toHaveText(['Profile', 'Work', 'Contact', 'Step inside']);

    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Skip to portfolio content' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(recruiterActions.getByRole('button', { name: 'Profile', exact: true })).toBeFocused();
    await expect(recruiterActions.getByRole('button', { name: 'Profile', exact: true })).toHaveCSS('outline-width', '2px');

    await page.keyboard.press('Tab');
    await expect(recruiterActions.getByRole('button', { name: 'Work', exact: true })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(recruiterActions.getByRole('button', { name: 'Contact', exact: true })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(recruiterActions.getByRole('button', { name: 'Step inside', exact: true })).toBeFocused();
  });

  for (const { name, panel } of ACTIONS) {
    test(`${name} opens before immersive entry and returns to the start shell`, async ({ page }) => {
      await page.locator('#recruiter-actions').getByRole('button', { name, exact: true }).click();

      await expect(page.locator(`#${panel}`)).toHaveClass(/active/);
      await expect(page.locator('#start-screen')).toBeHidden();
      await expect.poll(() => page.evaluate(() => document.pointerLockElement)).toBeNull();

      await page.locator(`#${panel} .panel-close`).click();
      await expect(page.locator(`#${panel}`)).not.toHaveClass(/active/);
      await expect(page.locator('#start-screen')).toBeVisible();
      await expect.poll(() => page.evaluate(() => document.pointerLockElement)).toBeNull();
    });
  }

  test('Step inside remains the immersive option', async ({ page }) => {
    await page.locator('#recruiter-actions').getByRole('button', { name: 'Step inside', exact: true }).click();
    await expect(page.locator('#start-screen')).toBeHidden();
  });

  test.afterEach(async ({ page }) => {
    if (page.errors) expect(page.errors).toEqual([]);
  });
});

test('mobile portrait keeps the static resume fallback', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile-only test');
  await page.setViewportSize({ width: 393, height: 851 });
  await page.goto('/');

  await expect(page.locator('#mobile-resume')).toBeVisible();
  await expect(page.locator('#mobile-resume').getByText('Experience', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'alfredop88@me.com' })).toBeVisible();
  await expect(page.locator('#start-screen')).toBeHidden();
});
