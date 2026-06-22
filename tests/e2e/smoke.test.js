import { test, expect } from '@playwright/test';

function captureErrors(page) {
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  return errors;
}

test.describe('smoke', () => {
  test('index.html loads without console errors', async ({ page }) => {
    const errors = captureErrors(page);
    await page.goto('/');
    expect(errors).toEqual([]);
  });

  test('editor.html loads without console errors', async ({ page }) => {
    const errors = captureErrors(page);
    await page.goto('/editor.html');
    expect(errors).toEqual([]);
  });
});
