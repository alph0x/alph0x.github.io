const { test, expect } = require('@playwright/test');

/**
 * Visual inspection test — positions camera at key viewpoints to capture
 * screenshots of furniture and detect visual artifacts.
 * Desktop only — the 3D portfolio is not available on mobile.
 */

test.describe('Visual Inspection', () => {
  test('inspect laptop lid and room artifacts from multiple angles', async ({ page, isMobile }) => {
    test.skip(isMobile, '3D portfolio only available on desktop');

    const errors = [];
    page.on('pageerror', e => {
      if (!e.message.includes('Pointer Lock') && !e.message.includes('pointer lock')) {
        errors.push(e.message);
      }
    });

    await page.goto('http://localhost:8765');

    // Wait for start screen and click ENTER
    const startBtn = page.locator('#start-btn');
    await expect(startBtn).toBeVisible({ timeout: 10000 });
    await startBtn.click();
    await page.waitForTimeout(1500);

    // Inject accessor for Three.js scene objects
    await page.waitForFunction(() => window.__scene && window.__camera, { timeout: 10000 });

    // Helper: position camera and look at target
    const lookAt = async (camPos, targetPos, name) => {
      await page.evaluate(({ camPos, targetPos }) => {
        const cam = window.__camera;
        cam.position.set(camPos.x, camPos.y, camPos.z);
        cam.lookAt(targetPos.x, targetPos.y, targetPos.z);
        cam.updateProjectionMatrix();
      }, { camPos, targetPos });
      await page.waitForTimeout(300);
      await page.screenshot({ path: `tests/e2e/screenshots/inspect-${name}.png` });
    };

    // ── View 1: Laptop from front-right (eye level) ──
    await lookAt(
      { x: 1.8, y: 1.3, z: -0.6 },
      { x: 1.05, y: 0.85, z: -1.4 },
      'laptop-front-right'
    );

    // ── View 2: Laptop from front (face-on to screen) ──
    await lookAt(
      { x: 1.05, y: 1.1, z: -0.7 },
      { x: 1.05, y: 0.9, z: -1.4 },
      'laptop-front'
    );

    // ── View 3: Laptop from side (profile of lid angle) ──
    await lookAt(
      { x: 1.8, y: 1.0, z: -1.4 },
      { x: 1.05, y: 0.82, z: -1.4 },
      'laptop-side-profile'
    );

    // ── View 4: Lulú close-up ──
    await lookAt(
      { x: -0.2, y: 1.4, z: -0.3 },
      { x: -0.7, y: 0.89, z: -0.9 },
      'lulu-closeup'
    );

    // ── View 5: TV from couch/bed area ──
    await lookAt(
      { x: -0.5, y: 1.3, z: -0.5 },
      { x: 1.35, y: 1.4, z: 1.65 },
      'tv-from-bed'
    );

    // ── View 6: Wide room overview ──
    await lookAt(
      { x: 0, y: 3.5, z: 0 },
      { x: 0, y: 0, z: 0 },
      'room-overview'
    );

    // ── JavaScript inspection: verify scene objects ──
    const inspection = await page.evaluate(() => {
      const scene = window.__scene;
      const result = {
        macBook: null,
        lulu: null,
        debugBoxes: [],
        hardcodedLights: [],
        interactables: []
      };

      // Find MacBook group
      scene.traverse((obj) => {
        if (obj.type === 'Group') {
          let hasMacBookLabel = false;
          obj.traverse((child) => {
            if (child.userData && child.userData.label === 'MACBOOK') hasMacBookLabel = true;
          });
          if (hasMacBookLabel && !result.macBook) {
            result.macBook = {
              position: { x: obj.position.x, y: obj.position.y, z: obj.position.z },
              rotation: { x: obj.rotation.x, y: obj.rotation.y, z: obj.rotation.z },
            };
            // Find lid group
            obj.traverse((child) => {
              if (child.type === 'Group' && Math.abs(child.rotation.x) > 0.5) {
                result.macBook.lidRotationX = child.rotation.x;
                result.macBook.lidRotationXDeg = (child.rotation.x * 180 / Math.PI).toFixed(1);
              }
            });
          }
        }

        // Find debug boxes
        if (obj.name === 'debugBox') {
          result.debugBoxes.push({
            parentName: obj.parent ? obj.parent.name : null,
            position: { x: obj.position.x, y: obj.position.y, z: obj.position.z }
          });
        }

        // Find hardcoded lights (not from furniture system)
        if (obj.isLight && obj.parent === scene) {
          result.hardcodedLights.push({
            type: obj.type,
            position: { x: obj.position.x, y: obj.position.y, z: obj.position.z }
          });
        }

        // Collect interactable labels
        if (obj.userData && obj.userData.label && !result.interactables.includes(obj.userData.label)) {
          result.interactables.push(obj.userData.label);
        }
      });

      return result;
    });

    console.log('Scene inspection:', JSON.stringify(inspection, null, 2));

    // Assertions
    expect(inspection.macBook).not.toBeNull();
    expect(inspection.macBook.lidRotationX).not.toBeNull();
    // Lid should be open ~125°: rotation.x ≈ -2.12 rad
    expect(Math.abs(inspection.macBook.lidRotationX - (-2.1208))).toBeLessThan(0.1);

    // No debug boxes should remain
    expect(inspection.debugBoxes).toHaveLength(0);

    expect(errors).toHaveLength(0);
  });
});
