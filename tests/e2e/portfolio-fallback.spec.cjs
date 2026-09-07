/**
 * @fileoverview Failure states keep the professional route usable without leaking engine details.
 */
const { test, expect } = require('@playwright/test');

test.setTimeout(60000);

const CASES = [
  { name: 'unknown browser rejection', kind: 'rejection', raw: 'UnknownError: browser details at engine.js:42' },
  { name: 'pointer lock denial', kind: 'pointer', raw: 'Pointer Lock denied by browser policy' },
  { name: 'WebGL construction failure', kind: 'webgl', raw: 'WebGLRenderer: Error creating WebGL context.' },
  { name: 'genuine application error', kind: 'app', raw: 'Unexpected app state at frame.ts:88' },
];

async function bootShell(page) {
  await page.route('**/js/app.ts*', (route) => route.fulfill({
    status: 200,
    contentType: 'text/javascript',
    body: 'export async function initGame() { return null; }',
  }));
  await page.goto('/');
}

async function injectFailure(page, failure) {
  await page.evaluate(({ kind, raw }) => {
    const error = kind === 'pointer'
      ? new DOMException(raw, 'NotAllowedError')
      : new Error(raw);
    if (kind === 'rejection') {
      window.dispatchEvent(new PromiseRejectionEvent('unhandledrejection', {
        promise: new Promise(() => {}),
        reason: error,
      }));
      return;
    }
    window.dispatchEvent(new ErrorEvent('error', { error, message: error.message }));
  }, failure);
}

async function expectSafeFallback(page, raw, retryable) {
  const fallback = page.locator('#error-display');
  await expect(fallback).toBeVisible();
  await expect(fallback).toContainText('The 3D room is unavailable');
  await expect(fallback).not.toContainText(raw);

  const profile = fallback.getByRole('button', { name: 'Profile', exact: true });
  await profile.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#panel-profile')).toHaveClass(/active/);
  await page.keyboard.press('Escape');
  await expect(fallback).toBeVisible();

  await expect(fallback.getByRole('button', { name: 'Work', exact: true })).toBeVisible();
  await expect(fallback.getByRole('button', { name: 'Contact', exact: true })).toBeVisible();
  if (retryable) await expect(fallback.getByRole('button', { name: 'Retry Enter Room', exact: true })).toBeVisible();
  else await expect(fallback.getByRole('button', { name: 'Retry Enter Room', exact: true })).toBeHidden();
}

for (const failure of CASES) {
  test(`${failure.name} keeps the fallback keyboard-operable and hides raw details`, async ({ page }) => {
    await bootShell(page);
    await injectFailure(page, failure);
    await expectSafeFallback(page, failure.raw, failure.kind === 'pointer');
  });
}

test('boot failure is safely presented by the module bootstrap boundary', async ({ page }) => {
  const raw = 'Boot failure: renderer private stack at app.ts:67';
  await page.route('**/js/app.ts*', (route) => route.fulfill({
    status: 200,
    contentType: 'text/javascript',
    body: `export async function initGame() { throw new Error(${JSON.stringify(raw)}); }`,
  }));
  await page.goto('/');
  await expectSafeFallback(page, raw, false);
});
