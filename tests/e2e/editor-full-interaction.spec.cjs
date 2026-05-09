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
 * Full editor interaction E2E tests.
 *
 * Covers furniture manipulation (place, drag, rotate, delete),
 * undo/redo, 3D view mode, palette interaction, spawn placement,
 * and seed export.
 */
test.describe('Editor Full Interaction', () => {
  test.beforeEach(async ({ page }) => {
    page.errors = [];
    page.on('pageerror', (err) => page.errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') page.errors.push(msg.text());
    });
  });

  // ── Helpers ────────────────────────────────────────────────────

  async function ensureFurnitureManager(page) {
    await page.waitForFunction(() => window.__furnitureManager !== undefined, { timeout: 10000 });
  }

  async function clearAndPlace(page, type, x, z, rot = 0) {
    return page.evaluate(({ type, x, z, rot }) => {
      window.__furnitureManager.clearAll();
      window.__furnitureManager.place(type, x, z, rot);
      const id = Array.from(window.__furnitureManager.meshMap.keys())[0];
      return { id, item: window.__editorState.placed[0] };
    }, { type, x, z, rot });
  }

  async function getPlacedCount(page) {
    return page.evaluate(() => window.__editorState.placed.length);
  }

  async function getSelectedId(page) {
    return page.evaluate(() => window.__editorState.selectedId);
  }

  // ── Furniture Drag ─────────────────────────────────────────────

  test('can drag furniture to a new position', async ({ page }) => {
    await page.goto('/editor.html');
    await page.waitForSelector('#canvas-wrap > canvas', { state: 'visible', timeout: 10000 });
    await page.waitForTimeout(600);
    await ensureFurnitureManager(page);

    // Place a bed at origin
    const { id } = await clearAndPlace(page, 'bed', 0, 0, 0);
    await page.waitForTimeout(200);

    // Get screen position of the bed
    const screenPos = await page.evaluate(() => window.__editorProject(0, 0));

    // Drag it to the right (+X direction on screen corresponds to world +X in top view)
    await page.mouse.move(screenPos.x, screenPos.y);
    await page.mouse.down();
    const targetScreen = await page.evaluate(() => window.__editorProject(1.5, 0));
    await page.mouse.move(targetScreen.x, targetScreen.y, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(300);

    // Verify new position via state
    const movedItem = await page.evaluate(() => {
      const p = window.__editorState.placed[0];
      return p ? { x: p.config.position[0], z: p.config.position[2] } : null;
    });

    expect(movedItem).not.toBeNull();
    expect(movedItem.x).toBeGreaterThan(1.0);
    expect(Math.abs(movedItem.z)).toBeLessThan(0.2);

    const realErrors = filterKnownErrors(page.errors);
    expect(realErrors).toHaveLength(0);
  });

  // ── Furniture Rotate ───────────────────────────────────────────

  test('can rotate furniture via button and R key', async ({ page }) => {
    await page.goto('/editor.html');
    await page.waitForSelector('#canvas-wrap > canvas', { state: 'visible', timeout: 10000 });
    await page.waitForTimeout(600);
    await ensureFurnitureManager(page);

    const { id } = await clearAndPlace(page, 'bed', 0, 0, 0);
    await page.waitForTimeout(200);

    // Rotate via button
    await page.click('#btnRotate');
    await page.waitForTimeout(200);

    let rot = await page.evaluate(() => {
      const p = window.__editorState.placed[0];
      return p ? p.config.rotation : null;
    });
    expect(rot).toBeCloseTo(Math.PI / 4, 2);

    // Rotate via R key
    await page.keyboard.press('r');
    await page.waitForTimeout(200);

    rot = await page.evaluate(() => {
      const p = window.__editorState.placed[0];
      return p ? p.config.rotation : null;
    });
    expect(rot).toBeCloseTo(Math.PI / 2, 2);

    const realErrors = filterKnownErrors(page.errors);
    expect(realErrors).toHaveLength(0);
  });

  // ── Furniture Delete ───────────────────────────────────────────

  test('can delete furniture via button and Delete key', async ({ page }) => {
    await page.goto('/editor.html');
    await page.waitForSelector('#canvas-wrap > canvas', { state: 'visible', timeout: 10000 });
    await page.waitForTimeout(600);
    await ensureFurnitureManager(page);

    await clearAndPlace(page, 'bed', 0, 0, 0);
    await page.waitForTimeout(200);
    expect(await getPlacedCount(page)).toBe(1);

    // Delete via button
    await page.click('#btnDelete');
    await page.waitForTimeout(200);
    expect(await getPlacedCount(page)).toBe(0);

    // Place again and delete via key
    await clearAndPlace(page, 'bed', 0, 0, 0);
    await page.waitForTimeout(200);
    expect(await getPlacedCount(page)).toBe(1);

    await page.keyboard.press('Delete');
    await page.waitForTimeout(200);
    expect(await getPlacedCount(page)).toBe(0);

    const realErrors = filterKnownErrors(page.errors);
    expect(realErrors).toHaveLength(0);
  });

  // ── Undo / Redo ────────────────────────────────────────────────

  test('undo and redo work for place, delete, move, rotate', async ({ page }) => {
    await page.goto('/editor.html');
    await page.waitForSelector('#canvas-wrap > canvas', { state: 'visible', timeout: 10000 });
    await page.waitForTimeout(600);
    await ensureFurnitureManager(page);

    // Clear any existing state
    await page.evaluate(() => window.__furnitureManager.clearAll());
    await page.waitForTimeout(200);

    // 1. Place
    await page.evaluate(() => {
      window.__furnitureManager.place('sofa', 0, 0, 0);
    });
    await page.waitForTimeout(200);
    expect(await getPlacedCount(page)).toBe(1);

    // Undo place
    await page.keyboard.down('Control');
    await page.keyboard.press('z');
    await page.keyboard.up('Control');
    await page.waitForTimeout(300);
    expect(await getPlacedCount(page)).toBe(0);

    // Redo place
    await page.keyboard.down('Control');
    await page.keyboard.press('y');
    await page.keyboard.up('Control');
    await page.waitForTimeout(300);
    expect(await getPlacedCount(page)).toBe(1);

    // 2. Rotate — ensure item is selected before rotating
    const selectedId = await page.evaluate(() => window.__editorState.selectedId);
    expect(selectedId).not.toBeNull();

    await page.click('#btnRotate');
    await page.waitForTimeout(300);
    let rot = await page.evaluate(() => window.__editorState.placed[0]?.config.rotation);
    expect(rot).toBeCloseTo(Math.PI / 4, 2);

    // Undo rotate
    await page.keyboard.down('Control');
    await page.keyboard.press('z');
    await page.keyboard.up('Control');
    await page.waitForTimeout(300);
    rot = await page.evaluate(() => window.__editorState.placed[0]?.config.rotation);
    expect(rot).toBeCloseTo(0, 2);

    // 3. Delete
    await page.click('#btnDelete');
    await page.waitForTimeout(300);
    expect(await getPlacedCount(page)).toBe(0);

    // Undo delete
    await page.keyboard.down('Control');
    await page.keyboard.press('z');
    await page.keyboard.up('Control');
    await page.waitForTimeout(300);
    expect(await getPlacedCount(page)).toBe(1);

    // Redo delete
    await page.keyboard.down('Control');
    await page.keyboard.press('y');
    await page.keyboard.up('Control');
    await page.waitForTimeout(300);
    expect(await getPlacedCount(page)).toBe(0);

    // 4. Move (via drag)
    await page.evaluate(() => window.__furnitureManager.place('sofa', 0, 0, 0));
    await page.waitForTimeout(300);
    const screenPos = await page.evaluate(() => window.__editorProject(0, 0));
    await page.mouse.move(screenPos.x, screenPos.y);
    await page.mouse.down();
    const targetScreen = await page.evaluate(() => window.__editorProject(1.0, 0));
    await page.mouse.move(targetScreen.x, targetScreen.y, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(400);

    let pos = await page.evaluate(() => {
      const p = window.__editorState.placed[0];
      return p ? { x: p.config.position[0], z: p.config.position[2] } : null;
    });
    expect(pos).not.toBeNull();
    expect(pos.x).toBeGreaterThan(0.5);

    // Undo move
    await page.keyboard.down('Control');
    await page.keyboard.press('z');
    await page.keyboard.up('Control');
    await page.waitForTimeout(300);

    pos = await page.evaluate(() => {
      const p = window.__editorState.placed[0];
      return p ? { x: p.config.position[0], z: p.config.position[2] } : null;
    });
    expect(pos).not.toBeNull();
    expect(Math.abs(pos.x)).toBeLessThan(0.1);

    const realErrors = filterKnownErrors(page.errors);
    expect(realErrors).toHaveLength(0);
  });

  // ── 3D View Mode ───────────────────────────────────────────────

  test('3D view mode toggles correctly', async ({ page }) => {
    await page.goto('/editor.html');
    await page.waitForSelector('#canvas-wrap > canvas', { state: 'visible', timeout: 10000 });
    await page.waitForTimeout(600);

    // Default is top view
    const viewMode = await page.evaluate(() => window.__editorState.viewMode);
    expect(viewMode).toBe('top');

    // Toggle to 3D
    const viewBtn = page.locator('#btnViewMode');
    await viewBtn.click();
    await page.waitForTimeout(600);

    const viewMode3d = await page.evaluate(() => window.__editorState.viewMode);
    expect(viewMode3d).toBe('3d');

    // Screenshot for visual reference
    await page.screenshot({ path: 'tests/e2e/screenshots/editor-3d-view-integrity.png' });

    // Toggle back to top
    await viewBtn.click();
    await page.waitForTimeout(600);

    const viewModeTop = await page.evaluate(() => window.__editorState.viewMode);
    expect(viewModeTop).toBe('top');

    const realErrors = filterKnownErrors(page.errors);
    expect(realErrors).toHaveLength(0);
  });

  // ── Palette Interaction ────────────────────────────────────────

  test('palette click shows preview, click again hides it', async ({ page }) => {
    await page.goto('/editor.html');
    await page.waitForSelector('#canvas-wrap > canvas', { state: 'visible', timeout: 10000 });
    await page.waitForTimeout(600);

    // Find first palette button (not a category header)
    const paletteBtn = page.locator('#palette button').first();
    await expect(paletteBtn).toBeVisible();

    // Click to activate tool
    await paletteBtn.click();
    await page.waitForTimeout(200);

    // Preview should be visible
    const previewWrap = page.locator('#preview-wrap');
    await expect(previewWrap).toBeVisible();

    // Active tool should reflect the palette selection
    const activeTool = await page.evaluate(() => window.__editorState.activeTool);
    expect(activeTool).toMatch(/^place:/);

    // Click again to deactivate
    await paletteBtn.click();
    await page.waitForTimeout(200);

    const activeTool2 = await page.evaluate(() => window.__editorState.activeTool);
    expect(activeTool2).toBeNull();

    const realErrors = filterKnownErrors(page.errors);
    expect(realErrors).toHaveLength(0);
  });

  // ── Spawn Placement ────────────────────────────────────────────

  test('can place player and lulu spawn points', async ({ page }) => {
    await page.goto('/editor.html');
    await page.waitForSelector('#canvas-wrap > canvas', { state: 'visible', timeout: 10000 });
    await page.waitForTimeout(600);

    // Activate player spawn tool
    await page.click('#toolPlayer');
    await page.waitForTimeout(200);

    // Click on canvas to place player spawn
    const canvasBox = await page.locator('#canvas-wrap > canvas').boundingBox();
    await page.mouse.click(canvasBox.x + canvasBox.width / 2, canvasBox.y + canvasBox.height / 2);
    await page.waitForTimeout(200);

    const playerSpawn = await page.evaluate(() => window.__editorState.playerSpawn);
    expect(playerSpawn).not.toBeNull();
    expect(typeof playerSpawn.x).toBe('number');
    expect(typeof playerSpawn.z).toBe('number');

    // Activate lulu spawn tool
    await page.click('#toolLulu');
    await page.waitForTimeout(200);

    // Click on canvas to place lulu spawn (offset slightly)
    await page.mouse.click(canvasBox.x + canvasBox.width / 2 + 50, canvasBox.y + canvasBox.height / 2 + 30);
    await page.waitForTimeout(200);

    const luluSpawn = await page.evaluate(() => window.__editorState.luluSpawn);
    expect(luluSpawn).not.toBeNull();
    expect(typeof luluSpawn.x).toBe('number');
    expect(typeof luluSpawn.z).toBe('number');

    const realErrors = filterKnownErrors(page.errors);
    expect(realErrors).toHaveLength(0);
  });

  // ── Export Seed ────────────────────────────────────────────────

  test('export button generates a valid seed string', async ({ page }) => {
    await page.goto('/editor.html');
    await page.waitForSelector('#canvas-wrap > canvas', { state: 'visible', timeout: 10000 });
    await page.waitForTimeout(600);
    await ensureFurnitureManager(page);

    // Place a couple of furniture items so seed has content
    await page.evaluate(() => {
      window.__furnitureManager.clearAll();
      window.__furnitureManager.place('bed', -1, 0, 0);
      window.__furnitureManager.place('desk', 1, 0, 0);
    });
    await page.waitForTimeout(200);

    // Click export
    await page.click('#btnExport');
    await page.waitForTimeout(300);

    // Read the export textarea
    const seedText = await page.locator('#exportOutput').inputValue();
    expect(seedText.length).toBeGreaterThan(50);
    expect(seedText).toContain('DEFAULT_SEED');

    // Verify it's valid base64 by trying to decode it
    const decoded = await page.evaluate((text) => {
      try {
        const match = text.match(/DEFAULT_SEED = '([^']+)'/);
        if (!match) return null;
        const json = atob(match[1]);
        const obj = JSON.parse(json);
        return { version: obj.v, itemCount: obj.f ? obj.f.length : 0 };
      } catch {
        return null;
      }
    }, seedText);

    expect(decoded).not.toBeNull();
    expect(decoded.version).toBe(2);
    expect(decoded.itemCount).toBeGreaterThanOrEqual(2);

    const realErrors = filterKnownErrors(page.errors);
    expect(realErrors).toHaveLength(0);
  });

  // ── Selection via Placed List ──────────────────────────────────

  test('clicking placed list item selects the furniture', async ({ page }) => {
    await page.goto('/editor.html');
    await page.waitForSelector('#canvas-wrap > canvas', { state: 'visible', timeout: 10000 });
    await page.waitForTimeout(600);
    await ensureFurnitureManager(page);

    await clearAndPlace(page, 'bed', 0, 0, 0);
    await page.waitForTimeout(200);

    // Deselect first
    await page.evaluate(() => window.__furnitureManager.select(null));
    expect(await getSelectedId(page)).toBeNull();

    // Click the first item in the placed list
    const listItem = page.locator('#placedList > div').first();
    await listItem.click();
    await page.waitForTimeout(200);

    expect(await getSelectedId(page)).not.toBeNull();

    const realErrors = filterKnownErrors(page.errors);
    expect(realErrors).toHaveLength(0);
  });
});
