const { test, expect } = require('@playwright/test');

function filterKnownErrors(errors) {
  return errors.filter((e) => {
    if (e.includes('Pointer Lock API')) return false;
    if (e.includes('WrongDocumentError')) return false;
    if (e.includes('pointer lock')) return false;
    return true;
  });
}

test.describe('Editor Camera Switch Selection', () => {
  test.beforeEach(async ({ page }) => {
    page.errors = [];
    page.on('pageerror', (err) => page.errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') page.errors.push(msg.text());
    });
  });

  test('can select furniture after switching camera mode', async ({ page }) => {
    await page.goto('/editor.html');
    await page.waitForSelector('#canvas-wrap > canvas', { state: 'visible', timeout: 10000 });
    await page.waitForTimeout(600);

    // Poll until the furniture manager global is available, then clear and place a sofa
    const placedId = await page.evaluate(async () => {
      for (let i = 0; i < 50; i++) {
        if (window.__furnitureManager) break;
        await new Promise((r) => setTimeout(r, 100));
      }
      if (!window.__furnitureManager) throw new Error('furnitureManager not exposed');
      window.__furnitureManager.clearAll();
      window.__furnitureManager.place('sofa', 0, 0, 0);
      return Array.from(window.__furnitureManager.meshMap.keys())[0];
    });
    expect(placedId).toBeDefined();
    await page.waitForTimeout(200);

    // Verify it's selected right after placement
    let selectedId = await page.evaluate(() => window.__editorState.selectedId);
    expect(selectedId).toBe(placedId);

    // Deselect
    await page.evaluate(() => window.__furnitureManager.select(null));
    selectedId = await page.evaluate(() => window.__editorState.selectedId);
    expect(selectedId).toBe(null);

    // ── Switch to 3D view ──
    const viewBtn = page.locator('#btnViewMode');
    await viewBtn.click();
    await page.waitForTimeout(600);

    // Get screen coordinates of the placed sofa and click it
    const screenPos = await page.evaluate(() => window.__editorProject(0, 0));
    await page.mouse.click(screenPos.x, screenPos.y);
    await page.waitForTimeout(200);

    // Assert sofa is selected in 3D view
    selectedId = await page.evaluate(() => window.__editorState.selectedId);
    expect(selectedId).toBe(placedId);

    // Deselect again
    await page.evaluate(() => window.__furnitureManager.select(null));

    // ── Switch back to top view ──
    await viewBtn.click();
    await page.waitForTimeout(600);

    // Click the sofa again in top view
    const screenPos2 = await page.evaluate(() => window.__editorProject(0, 0));
    await page.mouse.click(screenPos2.x, screenPos2.y);
    await page.waitForTimeout(200);

    // Assert sofa is still selected in top view
    selectedId = await page.evaluate(() => window.__editorState.selectedId);
    expect(selectedId).toBe(placedId);

    const realErrors = filterKnownErrors(page.errors);
    expect(realErrors).toHaveLength(0);
  });
});
