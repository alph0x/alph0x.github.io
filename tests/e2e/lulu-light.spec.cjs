const { test, expect } = require('@playwright/test');

function filterKnownErrors(errors) {
  return errors.filter((e) => {
    if (e.includes('Pointer Lock API')) return false;
    if (e.includes('WrongDocumentError')) return false;
    if (e.includes('pointer lock')) return false;
    return true;
  });
}

test.describe('Lulu Light in Game', () => {
  test.beforeEach(async ({ page }) => {
    page.errors = [];
    page.on('pageerror', (err) => page.errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') page.errors.push(msg.text());
    });
  });

  test('backLight exists and moves with breathing', async ({ page }) => {
    await page.goto('/');
    // Wait for scene to be exposed (renderer creates canvas and appends to body)
    await page.waitForFunction(() => window.__scene !== undefined, { timeout: 10000 });
    await page.waitForTimeout(1000);

    // Find the pet body and backLight
    const petInfo = await page.evaluate(() => {
      const scene = window.__scene;
      function findPet(root) {
        const stack = [root];
        while (stack.length > 0) {
          const obj = stack.pop();
          if (obj.name === 'body') {
            const light = obj.getObjectByName('backLight');
            if (light) return { bodyScaleY: obj.scale.y, lightLocalY: light.position.y };
          }
          if (obj.children) {
            for (let i = obj.children.length - 1; i >= 0; i--) {
              stack.push(obj.children[i]);
            }
          }
        }
        return null;
      }
      return findPet(scene);
    });

    expect(petInfo).not.toBeNull();
    expect(petInfo.lightLocalY).toBeCloseTo(0.09, 2);

    const scale1 = petInfo.bodyScaleY;

    // Wait for breathing animation to progress
    await page.waitForTimeout(600);

    const scale2 = await page.evaluate(() => {
      const scene = window.__scene;
      function findBody(root) {
        const stack = [root];
        while (stack.length > 0) {
          const obj = stack.pop();
          if (obj.name === 'body' && obj.getObjectByName('backLight')) {
            return obj.scale.y;
          }
          if (obj.children) stack.push(...obj.children);
        }
        return null;
      }
      return findBody(scene);
    });

    expect(scale2).not.toBeNull();
    // Breathing animation should have changed body.scale.y
    expect(Math.abs(scale2 - scale1)).toBeGreaterThan(0.0003);

    // Screenshot for visual reference
    await page.screenshot({ path: 'tests/e2e/screenshots/lulu-light-tracking.png' });

    const realErrors = filterKnownErrors(page.errors);
    expect(realErrors).toHaveLength(0);
  });
});
