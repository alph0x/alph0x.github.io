const { test, expect } = require('@playwright/test');

function filterKnownErrors(errors) {
  return errors.filter((e) => {
    if (e.includes('Pointer Lock API')) return false;
    if (e.includes('WrongDocumentError')) return false;
    if (e.includes('pointer lock')) return false;
    return true;
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

async function dragWallMidpoint(page, worldX, worldZ, deltaScreenX, deltaScreenY) {
  const handle = await page.evaluate(({ x, z }) => window.__editorProject(x, z), { x: worldX, z: worldZ });
  await page.mouse.move(handle.x, handle.y);
  await page.mouse.down();
  await page.mouse.move(handle.x + deltaScreenX, handle.y + deltaScreenY, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(500);
}

test.describe('Editor view toggle + wall drag', () => {
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

  test('can drag a second wall after toggling 3D view and back', async ({ page }) => {
    // Enter outline mode and drag the front wall upward
    await page.click('#toolOutline');
    await page.waitForTimeout(300);

    const before = await getOutlineDimensions(page);
    await dragWallMidpoint(page, 0, 1.75, 0, -100);
    const afterFirst = await getOutlineDimensions(page);
    expect(afterFirst.depth).toBeGreaterThan(before.depth + 0.3);

    // Toggle to 3D and back to top (this used to orphan the OrbitControls reference)
    await page.click('#btnViewMode');
    await page.waitForTimeout(600);
    let viewMode = await page.evaluate(() => window.__editorState.viewMode);
    expect(viewMode).toBe('3d');

    await page.click('#btnViewMode');
    await page.waitForTimeout(600);
    viewMode = await page.evaluate(() => window.__editorState.viewMode);
    expect(viewMode).toBe('top');

    // Outline mode should still be active from before the toggle; no need to click again.
    // If it were inactive we would click, but clicking when active toggles it OFF.
    const activeTool = await page.evaluate(() => window.__editorState.activeTool);
    if (activeTool !== 'outline') {
      await page.click('#toolOutline');
      await page.waitForTimeout(300);
    }

    // Drag the back wall downward (different wall, static midpoint at z=-1.75)
    const beforeSecond = await getOutlineDimensions(page);
    await dragWallMidpoint(page, 0, -1.75, 0, 100);
    const afterSecond = await getOutlineDimensions(page);
    expect(afterSecond.depth).toBeGreaterThan(beforeSecond.depth + 0.3);

    const realErrors = filterKnownErrors(page.errors);
    expect(realErrors).toHaveLength(0);
  });

  test('controls are disabled during wall drag after multiple view toggles', async ({ page }) => {
    await page.click('#toolOutline');
    await page.waitForTimeout(300);

    // Toggle a few times to stress the controls reference
    for (let i = 0; i < 3; i++) {
      await page.click('#btnViewMode');
      await page.waitForTimeout(400);
      await page.click('#btnViewMode');
      await page.waitForTimeout(400);
    }

    // Ensure outline mode is active (it may have been toggled off by an earlier test interaction)
    const activeTool = await page.evaluate(() => window.__editorState.activeTool);
    if (activeTool !== 'outline') {
      await page.click('#toolOutline');
      await page.waitForTimeout(300);
    }

    const handle = await page.evaluate(({ x, z }) => window.__editorProject(x, z), { x: 0, z: 1.75 });
    await page.mouse.move(handle.x, handle.y);
    await page.mouse.down();

    // While dragging, controls should be disabled (camera should NOT pan/rotate)
    const controlsEnabled = await page.evaluate(() => {
      // InteractionManager disables the live controls instance on drag start
      // We can't directly access IM, but we can verify the camera does not move
      // when we move the mouse (if controls were live and enabled, OrbitControls
      // would change the camera position).
      const camBefore = window.__camera.position.clone();
      return { x: camBefore.x, y: camBefore.y, z: camBefore.z };
    });

    await page.mouse.move(handle.x, handle.y - 80, { steps: 5 });
    await page.waitForTimeout(200);

    const controlsAfter = await page.evaluate(() => {
      const camAfter = window.__camera.position.clone();
      return { x: camAfter.x, y: camAfter.y, z: camAfter.z };
    });

    // Camera should not have moved because controls are disabled during drag
    expect(controlsAfter.x).toBeCloseTo(controlsEnabled.x, 2);
    expect(controlsAfter.y).toBeCloseTo(controlsEnabled.y, 2);
    expect(controlsAfter.z).toBeCloseTo(controlsEnabled.z, 2);

    await page.mouse.up();
    await page.waitForTimeout(300);

    const realErrors = filterKnownErrors(page.errors);
    expect(realErrors).toHaveLength(0);
  });
});
