const { test, expect } = require('@playwright/test');

function filterKnownErrors(errors) {
  return errors.filter((e) => {
    if (e.includes('Pointer Lock API')) return false;
    if (e.includes('WrongDocumentError')) return false;
    if (e.includes('pointer lock')) return false;
    return true;
  });
}

const REPRESENTATIVE_MODELS = ['sofa', 'door', 'window', 'miniSchnauzer', 'macbook', 'tv'];

test.describe('Model Viewer', () => {
  test.beforeEach(async ({ page }) => {
    page.errors = [];
    page.on('pageerror', (err) => page.errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') page.errors.push(msg.text());
    });
  });

  test('loads sidebar and each representative model has geometry', async ({ page }) => {
    await page.goto('/model-viewer.html');
    await page.waitForSelector('#list .item', { state: 'visible', timeout: 10000 });
    await page.waitForTimeout(300);

    // Wait for scene global
    await page.waitForFunction(() => window.__scene !== undefined, { timeout: 10000 });

    for (const type of REPRESENTATIVE_MODELS) {
      // Click the sidebar item
      const item = page.locator('#list .item', { hasText: type });
      await expect(item).toBeVisible();
      await item.click();
      await page.waitForTimeout(300);

      // Verify via scene introspection that mesh loaded and has vertices
      const meshInfo = await page.evaluate(() => {
        const mesh = window.__currentMesh;
        if (!mesh) return null;
        let vertCount = 0;
        mesh.traverse((c) => {
          if (c.isMesh && c.geometry && c.geometry.attributes.position) {
            vertCount += c.geometry.attributes.position.count;
          }
        });
        return { vertCount, name: mesh.name || mesh.type };
      });

      expect(meshInfo).not.toBeNull();
      expect(meshInfo.vertCount).toBeGreaterThan(0);

      // Screenshot for visual reference
      await page.screenshot({ path: `tests/e2e/screenshots/model-viewer-${type}.png` });
    }

    const realErrors = filterKnownErrors(page.errors);
    expect(realErrors).toHaveLength(0);
  });
});
