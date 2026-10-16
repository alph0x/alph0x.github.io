/**
 * @fileoverview Interaction validation suite — E-key per interactable, panel
 * open/close flows, AlphGPT terminal mode. Fails if the panelId flow breaks
 * again (it silently broke for months once).
 */
const { test, expect } = require('@playwright/test');
const os = require('node:os');

// Camera poses that put each interactable first on the center ray.
// Free camera pre-ENTER (the game loop doesn't own it yet).
// Only furniture with a panel is actionable: interaction.ts filters raycasts
// to `!!panelId`, so unmapped items (bed, desk, …) never show a prompt.
// macBook look updated for the Ghibli room layout (seed in core.ts).
const TARGETS = [
  { type: 'macBook', label: 'MACBOOK', pos: [1.5, 1.5, -0.55], look: [0.773, 0.931, -1.387] },
];

async function boot(page, navigationOptions) {
  await page.goto('/', navigationOptions);
  await page.waitForFunction(
    () => window.__game !== undefined && window.__camera !== undefined
      && window.__game.worldState?.room?.interactables?.length > 0,
    undefined,
    { timeout: 60000 }
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

  test('prompt shows [E] name for every actionable interactable', async ({ page }) => {
    test.setTimeout(90000);
    await boot(page);

    for (const t of TARGETS) {
      await aim(page, t.pos, t.look);
      const text = await promptText(page);
      expect(text, `prompt while aiming at ${t.type}`).toBe(`[E] ${t.label}`);
    }
  });

  test('macBook carries panel-alphgpt through the data flow', async ({ page }) => {
    test.setTimeout(60000);
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

  test.describe('Terminal command response', () => {
    test.describe.configure({ timeout: 125000 });
    const diagnostics = new WeakMap();
    const botSelector = '#alphgpt-messages > .chat-msg-bot:not(.chat-typing)';

    test.afterEach(async ({}, testInfo) => {
      const state = diagnostics.get(testInfo) ?? { activePhase: 'setup', setupDurationMs: 'unknown' };
      console.log('[terminal-e2e]', JSON.stringify({
        event: 'summary',
        ...state,
        project: testInfo.project.name,
        retry: testInfo.retry,
        status: testInfo.status,
        errors: testInfo.errors.map(({ message, stack }) => ({ message, stack })),
        tracePolicy: testInfo.project.use.trace,
        attachmentsAtHook: testInfo.attachments.map(({ name, path }) => ({ name, path })),
      }));
    });

    test('AlphGPT terminal answers a command', async ({ page }, testInfo) => {
      const state = {
        activePhase: 'setup',
        activeAction: 'body started',
        setupDurationMs: 'unknown',
        runtime: process.version,
        host: { platform: os.platform(), release: os.release(), arch: os.arch(), hostname: os.hostname() },
        browser: page.context().browser()?.version() ?? 'unknown',
        viewport: page.viewportSize(),
        traceCapture: 'not exposed by public APIs during the case; inspect runner artifacts',
      };
      diagnostics.set(testInfo, state);
      const phase = async (name, timeout, work) => {
        state.activePhase = name;
        const started = performance.now();
        console.log('[terminal-e2e]', JSON.stringify({ event: 'phase-start', phase: name, timeout }));
        try {
          const result = await test.step(name, work, { timeout });
          console.log('[terminal-e2e]', JSON.stringify({ event: 'phase-end', phase: name, durationMs: performance.now() - started }));
          return result;
        } catch (error) {
          console.log('[terminal-e2e]', JSON.stringify({
            event: 'phase-error', phase: name, action: state.activeAction,
            durationMs: performance.now() - started, message: error.message,
          }));
          throw error;
        }
      };
      const heartbeat = () => page.evaluate(() => ({
        frame: window.__game.renderer.info.render.frame,
        prevTime: window.__game.prevTime,
      }));

      const bootHeartbeat = await phase('Real game boot', 60000, async () => {
        const glbStatuses = [];
        const observeModel = response => {
          if (new URL(response.url()).pathname.endsWith('/assets/models/macbook.glb')) {
            glbStatuses.push(response.status());
          }
        };
        page.on('response', observeModel);
        try {
          state.activeAction = 'navigation and game readiness';
          await boot(page, { timeout: 60000 });
          state.activeAction = 'real MacBook and renderer fixture';
          const fixture = await page.evaluate(() => {
            const game = window.__game;
            const macBook = game.worldState.room.interactables.find(i => i.type === 'macBook');
            const scene = macBook?.mesh.children[0];
            let meshes = 0;
            scene?.traverse(node => { if (node.isMesh) meshes += 1; });
            const context = game.renderer.getContext();
            let renderer = { identity: 'unknown', reason: 'WEBGL_debug_renderer_info unavailable' };
            try {
              const extension = context.getExtension('WEBGL_debug_renderer_info');
              if (extension) renderer = {
                identity: context.getParameter(extension.UNMASKED_RENDERER_WEBGL),
                vendor: context.getParameter(extension.UNMASKED_VENDOR_WEBGL),
              };
            } catch (error) {
              renderer = { identity: 'unknown', reason: String(error) };
            }
            return {
              webdriver: navigator.webdriver,
              panelId: macBook?.panelId,
              rootChildren: macBook?.mesh.children.length,
              sceneType: scene?.type,
              meshes,
              composer: !!game.composer,
              renderer,
              dpr: window.devicePixelRatio,
              pixelRatio: game.renderer.getPixelRatio(),
              shadows: game.renderer.shadowMap.enabled,
            };
          });
          state.fixture = { ...fixture, glbStatuses };
          console.log('[terminal-e2e]', JSON.stringify({ event: 'fixture', ...state.fixture }));
          expect(glbStatuses, 'real MacBook GLB response').toContain(200);
          expect(fixture.webdriver).toBe(false);
          expect(fixture.panelId).toBe('panel-alphgpt');
          expect(fixture.rootChildren).toBe(1);
          expect(fixture.sceneType).toBe('Group');
          expect(fixture.meshes, 'loaded GLTF scene has rendered meshes').toBeGreaterThan(0);
          expect(fixture.composer, 'desktop effects remain active').toBe(true);
          const initial = await heartbeat();
          state.activeAction = 'render frame and game-loop heartbeat';
          await page.waitForFunction(({ frame, prevTime }) =>
            window.__game.renderer.info.render.frame >= frame + 2
              && window.__game.prevTime > prevTime,
          initial, { timeout: 60000 });
          return await heartbeat();
        } finally {
          page.off('response', observeModel);
        }
      });
      state.bootHeartbeat = bootHeartbeat;

      const input = page.locator('#alphgpt-input');
      const { before, openHeartbeat } = await phase('Open terminal through E and zoom', 30000, async () => {
        const mac = TARGETS.find(t => t.type === 'macBook');
        state.activeAction = 'aim and actionable prompt';
        await aim(page, mac.pos, mac.look);
        expect(await promptText(page)).toBe(`[E] ${mac.label}`);
        expect(await page.evaluate(() => {
          const target = document.activeElement;
          return !['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName) && !target?.isContentEditable;
        }), 'E must reach the game, not a typing target').toBe(true);
        state.activeAction = 'real E key and terminal zoom';
        await page.keyboard.press('e');
        await page.waitForSelector('#panel-alphgpt.active.terminal-mode', { timeout: 30000 });
        expect(await page.evaluate(() => window.__camera.position.toArray()), 'terminal zoom moved the camera').not.toEqual(mac.pos);
        state.activeAction = 'ready terminal input and prior bot count';
        await input.waitFor({ state: 'visible', timeout: 30000 });
        await expect(input).toBeEnabled({ timeout: 30000 });
        return { before: await page.locator(botSelector).count(), openHeartbeat: await heartbeat() };
      });
      state.openHeartbeat = openHeartbeat;

      await phase('Send help', 20000, async () => {
        state.activeAction = 'fill terminal input';
        await input.fill('help', { timeout: 15000 });
        state.activeAction = 'submit help through Enter';
        await input.press('Enter', { timeout: 5000 });
      });

      await phase('Fresh bot command response with active render', 10000, async () => {
        state.activeAction = 'new bot help, clear and exit with advancing renderer and game loop';
        const responseBaseline = await heartbeat();
        state.responseBaseline = responseBaseline;
        await expect.poll(() => page.evaluate(({ selector, before, frame, prevTime }) => {
          const freshBots = Array.from(document.querySelectorAll(selector)).slice(before);
          const answered = freshBots.some(node => {
            const body = node.lastElementChild?.textContent ?? '';
            return /^\s*help\b/im.test(body) && /^\s*clear\b/im.test(body) && /^\s*exit\b/im.test(body);
          });
          const game = window.__game;
          return answered && game.renderer.info.render.frame > frame && game.prevTime > prevTime;
        }, { selector: botSelector, before, ...responseBaseline }), {
          timeout: 10000,
          message: 'a newly appended bot body must list help, clear and exit while the real renderer advances',
        }).toBe(true);
        state.replyHeartbeat = await heartbeat();
      });
    });
  });

  test('E on unmapped furniture opens no panel', async ({ page }) => {
    test.setTimeout(60000);
    await boot(page);

    // Bed has no panel → not actionable → no prompt and E is a no-op.
    // Aim straight at its box center from the room centre.
    await aim(page, [-0.1, 1.4, 0.2], [-1.255, 0.6, -1.04]);
    expect(await promptText(page)).toBeNull();

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
