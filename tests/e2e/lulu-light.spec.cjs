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
    test.setTimeout(60000);

    await page.goto('/');

    // Wait for full game bootstrap including scene and pet.
    await page.waitForFunction(
      () => window.__scene !== undefined && window.__game !== undefined && window.__game.worldState?.pet?.mesh !== null,
      { timeout: 30000 }
    );

    // Helper to find pet body and backLight inside the scene
    const findPetBody = () => page.evaluate(() => {
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

    const petInfo = await findPetBody();
    expect(petInfo).not.toBeNull();
    expect(petInfo.lightLocalY).toBeCloseTo(0.09, 2);

    const scale1 = petInfo.bodyScaleY;

    // Wait for breathing animation to progress using a conditional poll
    // instead of a fixed sleep.  This tolerates slow / throttled rAF.
    await page.waitForFunction(
      (initialScale) => {
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
        const scale = findBody(scene);
        if (scale === null) return false;
        // Breathing should have diverged from the initial scale
        return Math.abs(scale - initialScale) > 0.0003;
      },
      scale1,
      { timeout: 10000 }
    );

    // Screenshot for visual reference
    await page.screenshot({ path: 'tests/e2e/screenshots/lulu-light-tracking.png' });

    const realErrors = filterKnownErrors(page.errors);
    expect(realErrors).toHaveLength(0);
  });
});
