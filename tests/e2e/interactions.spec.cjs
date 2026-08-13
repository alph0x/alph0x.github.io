/**
 * @fileoverview Interaction validation suite — E-key per interactable, panel
 * open/close flows, AlphGPT terminal mode. Fails if the panelId flow breaks
 * again (it silently broke for months once).
 */
const { test, expect } = require('@playwright/test');

// Camera poses that put each interactable first on the center ray.
// Free camera pre-ENTER (the game loop doesn't own it yet).
const TARGETS = [
  { type: 'macBook', label: 'MACBOOK', pos: [1.5, 1.5, -0.55], look: [1.6, 1.0, -1.3] },
  { type: 'bed', label: 'Bed', pos: [-0.1, 1.4, 0.2], look: [-1.8, 0.45, -1.1] },
  { type: 'nightstand', label: 'Nightstand', pos: [-1.0, 1.3, 0.6], look: [-1.9, 0.5, 0.1] },
  { type: 'desk', label: 'Desk', pos: [0.9, 1.5, -0.2], look: [1.3, 0.7, -1.15] },
  { type: 'miniSchnauzer', label: 'Lulú', pos: [-0.1, 1.35, -0.85], look: [-0.85, 1.0, -0.85] },
  { type: 'ceilingLamp', label: 'Ceiling Lamp', pos: [0, 1.1, 0.9], look: [0, 2.7, 0] },
  { type: 'window', label: 'Window', pos: [0, 1.5, -0.4], look: [0, 1.5, -1.85] },
  { type: 'door', label: 'Door', pos: [0, 1.4, 0.3], look: [0, 1.0, 1.75] },
];

async function boot(page) {
  await page.goto('/');
  await page.waitForFunction(
    () => window.__game !== undefined && window.__camera !== undefined
      && window.__game.worldState?.room?.interactables?.length > 0,
    { timeout: 30000 }
  );
}

async function aim(page, pos, look) {
  await page.evaluate(({ pos, look }) => {
    const cam = window.__camera;
    cam.position.set(...pos);
    cam.lookAt(...look);
    cam.updateMatrixWorld(true);
    window.__game.interaction.updatePrompt();
  }, { pos, look });
}

async function promptText(page) {
  return page.evaluate(() => {
    const p = document.querySelector('#prompt');
    return p && p.classList.contains('active') ? p.textContent : null;
  });
}

test.describe('Interaction validation suite', () => {
  // Panels and the start screen are display:none on mobile portrait (index.html).
  test.skip(({ isMobile }) => !!isMobile, 'info panels are desktop-only');

  test.beforeEach(async ({ page }) => {
    // Force the production path: webdriver=true would skip GLB model loading,
    // and the GLB macBook nests meshes deeper than the procedural fallback.
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });
  });

  test('prompt shows [E] name for every interactable', async ({ page }) => {
    test.setTimeout(90000);
    await boot(page);

    for (const t of TARGETS) {
      await aim(page, t.pos, t.look);
      const text = await promptText(page);
      expect(text, `prompt while aiming at ${t.type}`).toBe(`[E] ${t.label}`);
    }
  });

  test('macBook carries panel-alphgpt through the data flow', async ({ page }) => {
    await boot(page);
    const panelId = await page.evaluate(() => {
      const m = window.__game.worldState.room.interactables.find((i) => i.type === 'macBook');
      return m?.panelId ?? null;
    });
    expect(panelId).toBe('panel-alphgpt');
  });

  test('E on macBook opens panel-alphgpt in terminal mode', async ({ page }) => {
    test.setTimeout(60000);
    await boot(page);

    const mac = TARGETS.find((t) => t.type === 'macBook');
    await aim(page, mac.pos, mac.look);
    await page.keyboard.press('e'); // real keydown through systems/input.ts

    await page.waitForSelector('#panel-alphgpt.active', { timeout: 30000 });
    await expect(page.locator('#panel-alphgpt')).toHaveClass(/terminal-mode/);
  });

  test('AlphGPT terminal answers a command', async ({ page }) => {
    test.setTimeout(60000);
    await boot(page);

    const mac = TARGETS.find((t) => t.type === 'macBook');
    await aim(page, mac.pos, mac.look);
    await page.keyboard.press('e');
    await page.waitForSelector('#panel-alphgpt.active', { timeout: 30000 });

    const before = await page.locator('#alphgpt-messages > *').count();
    await page.fill('#alphgpt-input', 'help');
    await page.keyboard.press('Enter');
    await expect.poll(
      () => page.locator('#alphgpt-messages > *').count(),
      { timeout: 10000 }
    ).toBeGreaterThan(before);
  });

  test('unmapped furniture shows a prompt but E opens no panel', async ({ page }) => {
    test.setTimeout(60000);
    await boot(page);

    const bed = TARGETS.find((t) => t.type === 'bed');
    await aim(page, bed.pos, bed.look);
    expect(await promptText(page)).toBe('[E] Bed');

    await page.keyboard.press('e');
    await page.waitForTimeout(1200); // longer than the terminal zoom
    await expect(page.locator('.info-panel.active')).toHaveCount(0);
  });

  test('panel closes via close button, Escape, and outside click', async ({ page }) => {
    test.setTimeout(240000); // 3 open/close cycles on a slow CI runner
    await boot(page);

    // Open directly: the close flows are the subject, not the aim raycast
    // (covered by the E-key tests above, and pointer-lock support varies
    // across headless environments, which would re-own the camera mid-test).
    const openPanel = async () => {
      await page.evaluate(() => window.__game.interaction.openPanel('panel-alphgpt'));
      await page.waitForSelector('#panel-alphgpt.active', { timeout: 30000 });
    };
    const expectClosed = async () => {
      await expect(page.locator('.info-panel.active')).toHaveCount(0);
      expect(await page.evaluate(() => window.__game.worldState.ui.isPanelOpen)).toBe(false);
    };

    // 1. Close button
    await openPanel();
    await page.evaluate(() => document.querySelector('#panel-alphgpt .panel-close').click());
    await expectClosed();

    // 2. Escape
    await openPanel();
    await page.keyboard.press('Escape');
    await expectClosed();

    // 3. Outside click (HUD is neither .info-panel nor CANVAS; it's
    // pointer-events:none, so dispatch the click directly — it bubbles to the
    // document handler all the same).
    await openPanel();
    await page.evaluate(() => document.getElementById('hud').click());
    await expectClosed();
  });

  test('after ENTER, opening a panel does not resurrect the start screen', async ({ page }) => {
    test.setTimeout(120000);
    await boot(page);

    await page.evaluate(() => document.getElementById('start-btn').click());
    await expect(page.locator('#start-screen')).toBeHidden();

    // Regression: openPanel used to unlock() before marking the panel active,
    // so loading.ts re-showed the start screen on top of the panel.
    await page.evaluate(() => window.__game.interaction.openPanel('panel-alphgpt'));
    await page.waitForSelector('#panel-alphgpt.active', { timeout: 30000 });
    await expect(page.locator('#start-screen')).toBeHidden();
  });
});
