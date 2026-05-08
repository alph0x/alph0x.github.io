const { test, expect } = require('@playwright/test');

/**
 * E2E test for wall edge axis-locking in the editor.
 * Horizontal edges (top/bottom walls) should only move vertically (Z).
 * Vertical edges (left/right walls) should only move horizontally (X).
 */

test.describe('Editor Wall Axis Lock', () => {
  test('horizontal wall only moves vertically, vertical wall only moves horizontally', async ({ page }, testInfo) => {
    // Edge-handle precision dragging requires a large canvas; skip on narrow viewports
    testInfo.skip(testInfo.project.name === 'Mobile Chrome', 'Desktop only: canvas too narrow for reliable handle hit-testing');
    await page.goto('http://localhost:8765/editor.html');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForSelector('#canvas-wrap > canvas:not(#preview-wrap canvas)', { state: 'visible', timeout: 10000 });
    await page.waitForTimeout(600);

    // Enter outline mode
    await page.click('#toolOutline');
    await page.waitForTimeout(300);

    // ── Helper: read outline ──
    const readOutline = () => page.evaluate(() => window.__editorState.outline);

    // ── Test 1: Horizontal wall (top edge, midpoint z ≈ 1.75) ──
    const beforeTop = await readOutline();

    // Try dragging horizontally → should NOT move
    let handle = await page.evaluate(() => window.__editorProject(0, 1.75));
    await page.mouse.move(handle.x, handle.y);
    await page.mouse.down();
    await page.mouse.move(handle.x + 120, handle.y, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(200);

    const afterTopHorizontal = await readOutline();
    // Z coordinates of top edge should be essentially unchanged
    expect(afterTopHorizontal[2][1]).toBeCloseTo(beforeTop[2][1], 1);
    expect(afterTopHorizontal[3][1]).toBeCloseTo(beforeTop[3][1], 1);

    // Now drag vertically → SHOULD move
    handle = await page.evaluate(() => window.__editorProject(0, 1.75));
    await page.mouse.move(handle.x, handle.y);
    await page.mouse.down();
    await page.mouse.move(handle.x, handle.y - 80, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(200);

    const afterTopVertical = await readOutline();
    // Top edge should have moved up (Z increased)
    expect(afterTopVertical[2][1]).toBeGreaterThan(beforeTop[2][1] + 0.3);
    expect(afterTopVertical[3][1]).toBeGreaterThan(beforeTop[3][1] + 0.3);
    // X coordinates should be essentially unchanged
    expect(afterTopVertical[2][0]).toBeCloseTo(beforeTop[2][0], 1);
    expect(afterTopVertical[3][0]).toBeCloseTo(beforeTop[3][0], 1);

    // ── Test 2: Vertical wall (right edge, midpoint x ≈ 2.25) ──
    // Reset to known rectangle so right-edge midpoint is predictable
    await page.click('#btnResetRect');
    await page.waitForTimeout(200);
    const beforeRight = await readOutline();

    // Try dragging vertically → should NOT move
    handle = await page.evaluate(() => window.__editorProject(2.25, 0));
    await page.mouse.move(handle.x, handle.y);
    await page.mouse.down();
    await page.mouse.move(handle.x, handle.y - 80, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(200);

    const afterRightVertical = await readOutline();
    // X coordinates of right edge should be essentially unchanged
    expect(afterRightVertical[1][0]).toBeCloseTo(beforeRight[1][0], 1);
    expect(afterRightVertical[2][0]).toBeCloseTo(beforeRight[2][0], 1);

    // Now drag horizontally → SHOULD move
    // Note: in top-down orthographic view with up=(0,0,1), screen-left corresponds to +X world.
    handle = await page.evaluate(() => window.__editorProject(2.25, 0));
    await page.mouse.move(handle.x, handle.y);
    await page.mouse.down();
    await page.mouse.move(handle.x - 100, handle.y, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(200);

    const afterRightHorizontal = await readOutline();
    // Right edge should have moved right (X increased)
    expect(afterRightHorizontal[1][0]).toBeGreaterThan(beforeRight[1][0] + 0.3);
    expect(afterRightHorizontal[2][0]).toBeGreaterThan(beforeRight[2][0] + 0.3);
    // Z coordinates should be essentially unchanged
    expect(afterRightHorizontal[1][1]).toBeCloseTo(beforeRight[1][1], 1);
    expect(afterRightHorizontal[2][1]).toBeCloseTo(beforeRight[2][1], 1);
  });
});
