const { test, expect } = require('@playwright/test');

function filterKnownErrors(errors) {
  return errors.filter((e) => {
    if (e.includes('Pointer Lock API')) return false;
    if (e.includes('WrongDocumentError')) return false;
    if (e.includes('pointer lock')) return false;
    return true;
  });
}

test.describe('Lulu Head Tracking', () => {
  test.beforeEach(async ({ page }) => {
    page.errors = [];
    page.on('pageerror', (err) => page.errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') page.errors.push(msg.text());
    });
  });

  test('head follows camera position correctly', async ({ page }) => {
    test.setTimeout(60000);

    await page.goto('/');

    // Wait for full game bootstrap including pet model initialisation.
    // Under parallel load module fetch / WebGL setup can take >10 s.
    await page.waitForFunction(
      () => window.__scene !== undefined && window.__camera !== undefined && window.__game !== undefined && window.__game.worldState?.pet?.model !== null,
      { timeout: 30000 }
    );

    // Give the first animation frame(s) a chance to run
    await page.waitForTimeout(500);

    // Get Lulu's position and body rotation
    const petInfo = await page.evaluate(() => {
      const pet = window.__game.worldState.pet;
      return {
        x: pet.model.position.x,
        y: pet.model.position.y,
        z: pet.model.position.z,
        bodyRotation: pet.model.bodyRotation,
      };
    });

    console.log('Pet info:', petInfo);

    // In Three.js, rotation.y is counter-clockwise.
    // bodyRotation=0 means pet looks toward +X.
    // bodyRotation=π/2 means pet looks toward -Z.
    // bodyRotation=-π/2 means pet looks toward +Z.
    const forwardX = Math.cos(petInfo.bodyRotation);
    const forwardZ = -Math.sin(petInfo.bodyRotation);

    // Move camera in front of Lulu (2 units ahead)
    const frontPos = {
      x: petInfo.x + forwardX * 2,
      y: petInfo.y + 1,
      z: petInfo.z + forwardZ * 2,
    };

    await page.evaluate((pos) => {
      window.__camera.position.set(pos.x, pos.y, pos.z);
    }, frontPos);

    // Wait for head to converge to near-zero (camera directly in front)
    await page.waitForFunction(
      () => {
        const pet = window.__game?.worldState?.pet;
        if (!pet?.model) return false;
        return Math.abs(pet.model.headRotation) < 0.15;
      },
      { timeout: 8000 }
    );

    const headRotFront = await page.evaluate(() => {
      const pet = window.__game.worldState.pet;
      return pet?.model?.headRotation ?? null;
    });
    console.log('Head rotation when camera is in front:', headRotFront);
    expect(headRotFront).not.toBeNull();
    expect(Math.abs(headRotFront)).toBeLessThan(0.15);

    // Move camera to the left of Lulu (perpendicular to forward, left = +Z when forward=+X)
    // In Three.js, left of forward (1,0,0) is (0,0,1) = +Z
    // left vector = cross(up, forward) = cross((0,1,0), (forwardX,0,forwardZ)) = (forwardZ, 0, -forwardX)
    const leftX = forwardZ;
    const leftZ = -forwardX;
    const leftPos = {
      x: petInfo.x + leftX * 2,
      y: petInfo.y + 1,
      z: petInfo.z + leftZ * 2,
    };

    await page.evaluate((pos) => {
      window.__camera.position.set(pos.x, pos.y, pos.z);
    }, leftPos);

    await page.waitForFunction(
      () => {
        const pet = window.__game?.worldState?.pet;
        if (!pet?.model) return false;
        return pet.model.headRotation > 0.25;
      },
      { timeout: 8000 }
    );

    const headRotLeft = await page.evaluate(() => {
      const pet = window.__game.worldState.pet;
      return pet?.model?.headRotation ?? null;
    });
    console.log('Head rotation when camera is to the left:', headRotLeft);
    expect(headRotLeft).not.toBeNull();
    expect(headRotLeft).toBeGreaterThan(0.25);

    // Move camera to the right of Lulu
    const rightPos = {
      x: petInfo.x - leftX * 2,
      y: petInfo.y + 1,
      z: petInfo.z - leftZ * 2,
    };

    await page.evaluate((pos) => {
      window.__camera.position.set(pos.x, pos.y, pos.z);
    }, rightPos);

    await page.waitForFunction(
      () => {
        const pet = window.__game?.worldState?.pet;
        if (!pet?.model) return false;
        return pet.model.headRotation < -0.3;
      },
      { timeout: 8000 }
    );

    const headRotRight = await page.evaluate(() => {
      const pet = window.__game.worldState.pet;
      return pet?.model?.headRotation ?? null;
    });
    console.log('Head rotation when camera is to the right:', headRotRight);
    expect(headRotRight).not.toBeNull();
    expect(headRotRight).toBeLessThan(-0.3);

    const realErrors = filterKnownErrors(page.errors);
    expect(realErrors).toHaveLength(0);
  });
});
