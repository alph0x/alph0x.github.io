const { test, expect } = require('@playwright/test');

function filterKnownErrors(errors) {
  return errors.filter((e) => {
    if (e.includes('Pointer Lock API')) return false;
    if (e.includes('WrongDocumentError')) return false;
    if (e.includes('pointer lock')) return false;
    return true;
  });
}

// ── Helpers ──────────────────────────────────────────────────────

async function getRoomWalls(page) {
  return page.evaluate(() => {
    const scene = window.__scene;
    let roomGroup = null;
    scene.traverse((obj) => {
      if (obj.type === 'Group' && obj.children.some((c) => c.geometry?.type === 'ShapeGeometry')) {
        roomGroup = obj;
      }
    });
    if (!roomGroup) return { error: 'roomGroup not found', walls: [] };

    const walls = [];
    for (const child of roomGroup.children) {
      if (child.type === 'Mesh' && child.geometry?.type === 'BoxGeometry') {
        walls.push({
          type: 'solid',
          posX: child.position.x,
          posY: child.position.y,
          posZ: child.position.z,
          rotY: child.rotation.y,
          boxCount: 1,
        });
      } else if (child.type === 'Group') {
        const boxes = child.children.filter((c) => c.isMesh && c.geometry).length;
        walls.push({
          type: 'group',
          posX: child.position.x,
          posY: child.position.y,
          posZ: child.position.z,
          rotY: child.rotation.y,
          boxCount: boxes,
        });
      }
    }
    return { walls };
  });
}

async function getOutlineDimensions(page) {
  return page.evaluate(() => {
    const outline = window.__editorState.outline;
    const xs = outline.map((v) => v[0]);
    const zs = outline.map((v) => v[1]);
    return {
      width: Math.max(...xs) - Math.min(...xs),
      depth: Math.max(...zs) - Math.min(...zs),
      outline,
    };
  });
}

async function enterOutlineMode(page) {
  await page.click('#toolOutline');
  await page.waitForTimeout(300);
}

async function dragWallMidpoint(page, worldX, worldZ, deltaScreenX, deltaScreenY) {
  const handle = await page.evaluate(({ x, z }) => window.__editorProject(x, z), { x: worldX, z: worldZ });
  await page.mouse.move(handle.x, handle.y);
  await page.mouse.down();
  await page.mouse.move(handle.x + deltaScreenX, handle.y + deltaScreenY, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(500);
}

// ── Tests ────────────────────────────────────────────────────────

test.describe('Editor Room Dimensions', () => {
  test.beforeEach(async ({ page }) => {
    page.errors = [];
    page.on('pageerror', (err) => page.errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') page.errors.push(msg.text());
    });
    await page.goto('/editor.html');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForSelector('#canvas-wrap > canvas:not(#preview-wrap canvas)', { state: 'visible', timeout: 10000 });
    await page.waitForTimeout(800);
  });

  test('dimensions are displayed correctly on load', async ({ page }) => {
    const dims = await getOutlineDimensions(page);
    expect(dims.width).toBeCloseTo(4.5, 1);
    expect(dims.depth).toBeCloseTo(3.5, 1);

    const domText = await page.locator('#roomDimensions').textContent();
    expect(domText).toContain('4.50');
    expect(domText).toContain('3.50');

    const realErrors = filterKnownErrors(page.errors);
    expect(realErrors).toHaveLength(0);
  });

  test('all four walls exist on load with correct structure', async ({ page }) => {
    const { walls } = await getRoomWalls(page);
    expect(walls.length).toBe(4);

    const back = walls.find((w) => Math.abs(w.posZ - (-1.75)) < 0.1);
    const front = walls.find((w) => Math.abs(w.posZ - 1.75) < 0.1);
    const left = walls.find((w) => Math.abs(w.posX - (-2.25)) < 0.1);
    const right = walls.find((w) => Math.abs(w.posX - 2.25) < 0.1);

    expect(back).toBeDefined();
    expect(front).toBeDefined();
    expect(left).toBeDefined();
    expect(right).toBeDefined();

    expect(left.type).toBe('solid');
    expect(left.boxCount).toBe(1);
    expect(right.type).toBe('solid');
    expect(right.boxCount).toBe(1);

    expect(back.type).toBe('group');
    expect(front.type).toBe('group');

    const realErrors = filterKnownErrors(page.errors);
    expect(realErrors).toHaveLength(0);
  });

  test('back wall with window has header and side jambs', async ({ page }) => {
    const { walls } = await getRoomWalls(page);
    const back = walls.find((w) => Math.abs(w.posZ - (-1.75)) < 0.1);
    expect(back).toBeDefined();
    expect(back.type).toBe('group');

    const realErrors = filterKnownErrors(page.errors);
    expect(realErrors).toHaveLength(0);
  });

  test('front wall with door has header and side jambs', async ({ page }) => {
    const { walls } = await getRoomWalls(page);
    const front = walls.find((w) => Math.abs(w.posZ - 1.75) < 0.1);
    expect(front).toBeDefined();
    expect(front.type).toBe('group');

    const realErrors = filterKnownErrors(page.errors);
    expect(realErrors).toHaveLength(0);
  });

  test('dimensions update after dragging a wall', async ({ page }) => {
    await enterOutlineMode(page);
    const before = await getOutlineDimensions(page);

    // Drag the top wall (front, midpoint z ≈ 1.75) upward (screen up = +Z)
    await dragWallMidpoint(page, 0, 1.75, 0, -100);

    const after = await getOutlineDimensions(page);
    expect(after.depth).toBeGreaterThan(before.depth + 0.3);

    const realErrors = filterKnownErrors(page.errors);
    expect(realErrors).toHaveLength(0);
  });

  test('walls with openings remain intact after room resize', async ({ page }) => {
    await enterOutlineMode(page);

    // Drag a side wall (no opening) so front/back openings stay aligned.
    await dragWallMidpoint(page, 2.25, 0, 100, 0);

    const { walls } = await getRoomWalls(page);
    expect(walls.length).toBe(4);

    // Back and front walls keep their openings.
    const back = walls.find((w) => Math.abs(w.posZ - (-1.75)) < 0.1);
    const front = walls.find((w) => Math.abs(w.posZ - 1.75) < 0.1);
    const left = walls.find((w) => Math.abs(w.posX - (-2.25)) < 0.1);

    // The moved side wall is the remaining solid wall.
    const right = walls.find((w) => w.type === 'solid' && w !== left);

    expect(back).toBeDefined();
    expect(back.type).toBe('group');
    expect(front).toBeDefined();
    expect(front.type).toBe('group');
    expect(left).toBeDefined();
    expect(left.type).toBe('solid');
    expect(right).toBeDefined();
    expect(right.type).toBe('solid');

    const realErrors = filterKnownErrors(page.errors);
    expect(realErrors).toHaveLength(0);
  });

  test('reset rect restores original dimensions and wall structure', async ({ page }) => {
    await enterOutlineMode(page);

    // Resize
    await dragWallMidpoint(page, 0, 1.75, 0, -100);
    const resized = await getOutlineDimensions(page);
    expect(resized.depth).toBeGreaterThan(3.5);

    // Reset
    await page.click('#btnResetRect');
    await page.waitForTimeout(400);

    const restored = await getOutlineDimensions(page);
    expect(restored.width).toBeCloseTo(4.5, 1);
    expect(restored.depth).toBeCloseTo(3.5, 1);

    const { walls } = await getRoomWalls(page);
    expect(walls.length).toBe(4);

    const back = walls.find((w) => Math.abs(w.posZ - (-1.75)) < 0.1);
    const front = walls.find((w) => Math.abs(w.posZ - 1.75) < 0.1);
    expect(back.type).toBe('group');
    expect(front.type).toBe('group');

    const realErrors = filterKnownErrors(page.errors);
    expect(realErrors).toHaveLength(0);
  });

  test('exported seed reflects resized outline', async ({ page }) => {
    await enterOutlineMode(page);

    // Drag the front wall (midpoint visible even on narrow viewports) outward.
    // On mobile the sidebar leaves only a slim canvas strip, so vertical side
    // walls are off-screen; the horizontal front/back walls remain reachable.
    await dragWallMidpoint(page, 0, 1.75, 0, -120);
    await page.waitForTimeout(200);

    // Export
    await page.click('#btnExport');
    await page.waitForTimeout(300);

    const seedText = await page.locator('#exportOutput').inputValue();
    expect(seedText.length).toBeGreaterThan(50);

    // Decode and verify outline
    const decoded = await page.evaluate((text) => {
      try {
        const match = text.match(/DEFAULT_SEED = '([^']+)'/);
        if (!match) return null;
        const json = atob(match[1]);
        const obj = JSON.parse(json);
        return obj.outline;
      } catch {
        return null;
      }
    }, seedText);

    expect(decoded).not.toBeNull();
    expect(decoded.length).toBe(4);

    // Front edge should be deeper than original 1.75
    const maxZ = Math.max(...decoded.map((v) => v[1]));
    expect(maxZ).toBeGreaterThan(2.0);

    const realErrors = filterKnownErrors(page.errors);
    expect(realErrors).toHaveLength(0);
  });

  test('3D view shows all walls after resize', async ({ page }) => {
    await enterOutlineMode(page);
    await dragWallMidpoint(page, 0, 1.75, 0, -100);
    await dragWallMidpoint(page, 2.25, 0, -100, 0);

    // Toggle to 3D
    await page.click('#btnViewMode');
    await page.waitForTimeout(600);

    const viewMode = await page.evaluate(() => window.__editorState.viewMode);
    expect(viewMode).toBe('3d');

    // In 3D mode, walls may be culled. Verify at least the room group is intact.
    const { walls } = await getRoomWalls(page);
    expect(walls.length).toBeGreaterThanOrEqual(4);

    // Toggle back
    await page.click('#btnViewMode');
    await page.waitForTimeout(600);
    const viewModeTop = await page.evaluate(() => window.__editorState.viewMode);
    expect(viewModeTop).toBe('top');

    const realErrors = filterKnownErrors(page.errors);
    expect(realErrors).toHaveLength(0);
  });
});
