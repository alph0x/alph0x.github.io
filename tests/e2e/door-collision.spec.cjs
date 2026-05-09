const { test, expect } = require('@playwright/test');

function filterKnownErrors(errors) {
  return errors.filter((e) => {
    if (e.includes('Pointer Lock API')) return false;
    if (e.includes('WrongDocumentError')) return false;
    if (e.includes('pointer lock')) return false;
    return true;
  });
}

test.describe('Door Collision', () => {
  test.beforeEach(async ({ page }) => {
    page.errors = [];
    page.on('pageerror', (err) => page.errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') page.errors.push(msg.text());
    });
  });

  test('closed door blocks player movement', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(
      () => window.__scene !== undefined && window.__camera !== undefined && window.__game !== undefined,
      { timeout: 10000 }
    );
    await page.waitForTimeout(800);

    const result = await page.evaluate(() => {
      const walls = window.__game.worldState.room.walls;
      // Find the door AABB (near front wall z ~ 1.75, centered at x ~ 0)
      const doorWall = walls.find(
        (w) => w.minX < 0.5 && w.maxX > -0.5 && w.minZ < 1.85 && w.maxZ > 1.6
      );
      if (!doorWall) return { found: false };

      // Check that a point at the door center collides (radius = 0.35)
      const x = 0;
      const z = 1.75;
      const radius = 0.35;
      const collides = walls.some(
        (w) => x > w.minX - radius && x < w.maxX + radius && z > w.minZ - radius && z < w.maxZ + radius
      );

      return { found: true, collides, doorWall };
    });

    expect(result.found).toBe(true);
    expect(result.collides).toBe(true);

    const realErrors = filterKnownErrors(page.errors);
    expect(realErrors).toHaveLength(0);
  });
});
