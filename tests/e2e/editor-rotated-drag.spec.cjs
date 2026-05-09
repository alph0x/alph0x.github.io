const { test, expect } = require('@playwright/test');

function filterKnownErrors(errors) {
  return errors.filter((e) => {
    if (e.includes('Pointer Lock API')) return false;
    if (e.includes('WrongDocumentError')) return false;
    if (e.includes('pointer lock')) return false;
    return true;
  });
}

/**
 * Tests for dragging furniture after it has been rotated.
 * These cover a common class of bugs where rotation changes
 * world-space bounds and can affect drag offset or selection.
 */
test.describe('Editor Rotated Furniture Drag', () => {
  test.beforeEach(async ({ page }) => {
    page.errors = [];
    page.on('pageerror', (err) => page.errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') page.errors.push(msg.text());
    });
  });

  async function ensureFurnitureManager(page) {
    await page.waitForFunction(() => window.__furnitureManager !== undefined, { timeout: 10000 });
  }

  test('can drag furniture after rotating 90 degrees in top view', async ({ page }) => {
    await page.goto('/editor.html');
    await page.waitForSelector('#canvas-wrap > canvas', { state: 'visible', timeout: 10000 });
    await page.waitForTimeout(600);
    await ensureFurnitureManager(page);

    // Clear and place a bed at origin
    await page.evaluate(() => {
      window.__furnitureManager.clearAll();
      window.__furnitureManager.place('bed', 0, 0, 0, 0);
    });
    await page.waitForTimeout(300);

    // Rotate 90°
    await page.evaluate(() => {
      const id = window.__editorState.placed[0].id;
      window.__furnitureManager.select(id);
      window.__furnitureManager.rotateSelected(90);
    });
    await page.waitForTimeout(300);

    const rot = await page.evaluate(() => window.__editorState.placed[0].config.rotation);
    expect(rot).toBeCloseTo(Math.PI / 2, 2);

    // Get screen position of the bed and drag it to the right (+X)
    const screenPos = await page.evaluate(() => window.__editorProject(0, 0));
    await page.mouse.move(screenPos.x, screenPos.y);
    await page.mouse.down();
    const targetScreen = await page.evaluate(() => window.__editorProject(1.5, 0));
    await page.mouse.move(targetScreen.x, targetScreen.y, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(400);

    // Verify new position
    const pos = await page.evaluate(() => {
      const p = window.__editorState.placed[0];
      return p ? { x: p.config.position[0], z: p.config.position[2] } : null;
    });

    expect(pos).not.toBeNull();
    expect(pos.x).toBeGreaterThan(1.0);
    expect(Math.abs(pos.z)).toBeLessThan(0.2);

    // Rotation should be preserved after drag
    const rotAfter = await page.evaluate(() => window.__editorState.placed[0].config.rotation);
    expect(rotAfter).toBeCloseTo(Math.PI / 2, 2);

    const realErrors = filterKnownErrors(page.errors);
    expect(realErrors).toHaveLength(0);
  });

  test('can drag furniture after rotating in 3D view', async ({ page }) => {
    await page.goto('/editor.html');
    await page.waitForSelector('#canvas-wrap > canvas', { state: 'visible', timeout: 10000 });
    await page.waitForTimeout(600);
    await ensureFurnitureManager(page);

    // Clear and place a bed (larger furniture ensures reliable raycast hits in 3D view)
    await page.evaluate(() => {
      window.__furnitureManager.clearAll();
      window.__furnitureManager.place('bed', 0, 0, 0, 0);
    });
    await page.waitForTimeout(300);

    // Rotate 45°
    await page.evaluate(() => {
      const id = window.__editorState.placed[0].id;
      window.__furnitureManager.select(id);
      window.__furnitureManager.rotateSelected(45);
    });
    await page.waitForTimeout(300);

    // Switch to 3D view
    await page.click('#btnViewMode');
    await page.waitForTimeout(600);

    // Get screen position of the bed in 3D view
    const screenPos = await page.evaluate(() => window.__editorProject(0, 0));

    // Drag it slightly in 3D view
    await page.mouse.move(screenPos.x, screenPos.y);
    await page.mouse.down();
    await page.mouse.move(screenPos.x + 100, screenPos.y + 50, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(400);

    // Switch back to top view to verify position changed
    await page.click('#btnViewMode');
    await page.waitForTimeout(600);

    const pos = await page.evaluate(() => {
      const p = window.__editorState.placed[0];
      return p ? { x: p.config.position[0], z: p.config.position[2] } : null;
    });

    expect(pos).not.toBeNull();
    // Position should have changed (not exactly at origin)
    const dist = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
    expect(dist).toBeGreaterThan(0.2);

    // Rotation should be preserved
    const rotAfter = await page.evaluate(() => window.__editorState.placed[0].config.rotation);
    expect(rotAfter).toBeCloseTo(Math.PI / 4, 2);

    const realErrors = filterKnownErrors(page.errors);
    expect(realErrors).toHaveLength(0);
  });

  test('outline stays visible and correct after rotate + drag', async ({ page }) => {
    await page.goto('/editor.html');
    await page.waitForSelector('#canvas-wrap > canvas', { state: 'visible', timeout: 10000 });
    await page.waitForTimeout(600);
    await ensureFurnitureManager(page);

    // Place a bed and select it
    await page.evaluate(() => {
      window.__furnitureManager.clearAll();
      window.__furnitureManager.place('bed', 0, 0, 0, 0);
    });
    await page.waitForTimeout(300);

    // Rotate 90°
    await page.evaluate(() => {
      const id = window.__editorState.placed[0].id;
      window.__furnitureManager.select(id);
      window.__furnitureManager.rotateSelected(90);
    });
    await page.waitForTimeout(300);

    // Verify outline exists and is visible
    const outlineVisible = await page.evaluate(() => {
      const item = window.__editorState.placed[0];
      if (!item || !item.mesh) return false;
      const outline = item.mesh.userData._outline;
      return outline && outline.material.opacity > 0;
    });
    expect(outlineVisible).toBe(true);

    // Drag
    const screenPos = await page.evaluate(() => window.__editorProject(0, 0));
    await page.mouse.move(screenPos.x, screenPos.y);
    await page.mouse.down();
    const targetScreen = await page.evaluate(() => window.__editorProject(1.0, 0));
    await page.mouse.move(targetScreen.x, targetScreen.y, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(400);

    // Outline should still be visible after drag
    const outlineVisibleAfter = await page.evaluate(() => {
      const item = window.__editorState.placed[0];
      if (!item || !item.mesh) return false;
      const outline = item.mesh.userData._outline;
      return outline && outline.material.opacity > 0;
    });
    expect(outlineVisibleAfter).toBe(true);

    const realErrors = filterKnownErrors(page.errors);
    expect(realErrors).toHaveLength(0);
  });
});
