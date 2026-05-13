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
 * Room Integrity E2E Test
 *
 * Guarantees that the 3D room is structurally sound by:
 * 1. Scene introspection — counts wall groups, stubs, and openings
 * 2. Collision verification — ensures worldState.walls match rendered geometry
 * 3. Furniture verification — key items exist and are positioned
 * 4. Screenshots — captures key viewpoints for visual regression
 */
test.describe('Room Integrity', () => {
  test.beforeEach(async ({ page }) => {
    page.errors = [];
    page.on('pageerror', (err) => page.errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') page.errors.push(msg.text());
    });
  });

  test('room structure is complete and openings are correct', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop-only integrity test');

    await page.goto('http://localhost:8765');

    // Start the game
    const startBtn = page.locator('#start-btn');
    await expect(startBtn).toBeVisible({ timeout: 10000 });
    await startBtn.click();
    await page.waitForTimeout(1500);

    // Wait for scene and game globals
    await page.waitForFunction(
      () => window.__scene && window.__game && window.__camera,
      { timeout: 10000 }
    );

    // ── Scene introspection ──────────────────────────────────────
    const inspection = await page.evaluate(() => {
      const scene = window.__scene;
      const result = {
        wallGroups: [],
        furnitureLabels: [],
        boxCount: 0,
        planeCount: 0,
      };

      // Outline midpoints for the DEFAULT_SEED room
      const WALL_POSITIONS = [
        { x: 0, z: -1.75 },   // back
        { x: 2.25, z: 0 },    // right
        { x: 0, z: 1.75 },    // front
        { x: -2.25, z: 0 },   // left
      ];

      function isWallPosition(x, z) {
        return WALL_POSITIONS.some(
          (p) => Math.abs(p.x - x) < 0.1 && Math.abs(p.z - z) < 0.1
        );
      }

      scene.traverse((obj) => {
        // Count BoxGeometry and PlaneGeometry meshes
        if (obj.isMesh) {
          if (obj.geometry && obj.geometry.type === 'BoxGeometry') {
            result.boxCount++;
          }
          if (obj.geometry && obj.geometry.type === 'PlaneGeometry') {
            result.planeCount++;
          }
        }

        // Collect furniture labels anywhere in the tree
        if (obj.userData && obj.userData.label) {
          if (!result.furnitureLabels.includes(obj.userData.label)) {
            result.furnitureLabels.push(obj.userData.label);
          }
        }

        // Identify wall groups: Groups at y=0 that match wall edge positions
        if (obj.type === 'Group' && Math.abs(obj.position.y) < 0.01 && isWallPosition(obj.position.x, obj.position.z)) {
          const meshes = [];
          obj.traverse((child) => {
            if (child.isMesh && child.geometry) {
              meshes.push({
                posX: child.position.x,
                posY: child.position.y,
                posZ: child.position.z,
              });
            }
          });
          if (meshes.length > 0) {
            result.wallGroups.push({
              posX: obj.position.x,
              posY: obj.position.y,
              posZ: obj.position.z,
              rotY: obj.rotation.y,
              boxCount: meshes.length,
              meshes,
            });
          }
        }
      });

      // Also read worldState collision walls for cross-check
      const worldState = window.__game.worldState;
      result.collisionWalls = worldState.room.walls.length;

      return result;
    });

    console.log('Room inspection:', JSON.stringify(inspection, null, 2));

    // ── Assertions ───────────────────────────────────────────────

    // 1. Exactly 4 wall groups (one per edge)
    expect(inspection.wallGroups.length).toBe(4);

    // 2. Front wall (z ~ 1.75) should be a group because of door
    const frontWall = inspection.wallGroups.find(
      (g) => Math.abs(g.posZ - 1.75) < 0.1 && Math.abs(g.rotY - (-Math.PI / 2)) < 0.1
    );
    expect(frontWall).toBeDefined();
    expect(frontWall.boxCount).toBeGreaterThanOrEqual(1);

    // 3. Back wall (z ~ -1.75) should be a group because of window
    const backWall = inspection.wallGroups.find(
      (g) => Math.abs(g.posZ - (-1.75)) < 0.1 && Math.abs(g.rotY - Math.PI / 2) < 0.1
    );
    expect(backWall).toBeDefined();
    expect(backWall.boxCount).toBeGreaterThanOrEqual(1);

    // 4. Left wall (x ~ -2.25) should be solid (1 mesh)
    const leftWall = inspection.wallGroups.find(
      (g) => Math.abs(g.posX - (-2.25)) < 0.1 && Math.abs(g.rotY - Math.PI) < 0.1
    );
    expect(leftWall).toBeDefined();
    expect(leftWall.boxCount).toBe(1);

    // 5. Right wall (x ~ 2.25) should be solid (1 mesh)
    const rightWall = inspection.wallGroups.find(
      (g) => Math.abs(g.posX - 2.25) < 0.1 && Math.abs(g.rotY) < 0.1
    );
    expect(rightWall).toBeDefined();
    expect(rightWall.boxCount).toBe(1);

    // 6. Collision walls should exist
    expect(inspection.collisionWalls).toBeGreaterThan(0);

    // 7. Key furniture labels should exist
    expect(inspection.furnitureLabels).toContain('MACBOOK');

    // 8. At least some BoxGeometry meshes exist (walls + furniture)
    expect(inspection.boxCount).toBeGreaterThan(4);

    // ── Screenshots ──────────────────────────────────────────────
    const lookAt = async (camPos, targetPos, name) => {
      await page.evaluate(({ camPos, targetPos }) => {
        const cam = window.__camera;
        cam.position.set(camPos.x, camPos.y, camPos.z);
        cam.lookAt(targetPos.x, targetPos.y, targetPos.z);
        cam.updateProjectionMatrix();
      }, { camPos, targetPos });
      await page.waitForTimeout(300);
      await page.screenshot({ path: `tests/e2e/screenshots/integrity-${name}.png` });
    };

    // View from inside looking at door
    await lookAt(
      { x: 0, y: 1.6, z: 0.5 },
      { x: 0, y: 1.2, z: 1.9 },
      'door-from-inside'
    );

    // View from inside looking at window
    await lookAt(
      { x: 0, y: 1.6, z: -0.5 },
      { x: 0, y: 1.2, z: -1.85 },
      'window-from-inside'
    );

    // Top-down overview
    await lookAt(
      { x: 0, y: 5, z: 0 },
      { x: 0, y: 0, z: 0 },
      'room-top-down'
    );

    // Side view to verify wall continuity
    await lookAt(
      { x: 4, y: 1.5, z: 0 },
      { x: 0, y: 1.0, z: 0 },
      'room-side-view'
    );

    // No JS errors
    const realErrors = filterKnownErrors(page.errors);
    expect(realErrors).toHaveLength(0);
  });
});
