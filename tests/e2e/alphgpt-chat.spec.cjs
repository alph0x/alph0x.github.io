/**
 * @fileoverview AlphGPT NLU UI gate (G-03): natural EN+ES chat routing, the 4
 * suggestion chips wired through the same send path, and terminal-mode
 * responses. Asserts routing, not just "a message appeared" — the intent and
 * language come straight off the rendered bot reply.
 *
 * Uses Playwright over the real served document (vite 8765); no game boot
 * needed: the chat panel + askAlphGPT / processTerminalCommand run standalone
 * (alphgpt-context is a no-op when no provider has set it).
 */
const { test, expect } = require('@playwright/test');

// Deterministic, language-distinguishable marker phrases per intent (alphgpt.ts).
const ROUTING = [
  { prompt: 'what do you do?', marker: /GeoPagos/, lang: 'en' },
  { prompt: '¿en qué trabajas?', marker: /GeoPagos/, lang: 'es' },
  { prompt: 'hablas español?', marker: /Hablo español e inglés/, lang: 'es' },
  { prompt: 'what skills does he have?', marker: /Alfredo's core stack|React Native|Swift/, lang: 'en' },
  { prompt: '¿cómo lo contacto?', marker: /alfredop88@me.com|Buenos Aires/, lang: 'es' },
];

async function bootChat(page) {
  // Chat runs standalone; block the game bootstrap (vite serves source
  // app.ts) so the heavy WebGL boot never races the panel's DOM — under
  // parallel workers it exceeds the test timeout. Stub initGame to avoid a
  // misleading missing-export pageerror on the boot module.
  // `**/js/app.ts*`: vite serves the boot module as `/js/app.ts?t=<stamp>`
  // (cache-busting query suffix); a bare `app.ts` glob matches nothing and the
  // real WebGL boot silently races the panel — the Q-01 hang.
  await page.route('**/js/app.ts*', (route) => route.fulfill({
    status: 200,
    contentType: 'text/javascript',
    body: 'export async function initGame() { return null; }',
  }));
  await page.goto('/');
  // Wait for the module's welcome message: proves askAlphGPT wiring is live.
  await expect(page.locator('#alphgpt-messages .chat-msg-bot')).toHaveCount(1, { timeout: 30000 });
  // The start-screen overlay (z-index above the panel) intercepts pointer
  // events; hide it here, after load.
  await page.evaluate(() => {
    const start = document.getElementById('start-screen');
    if (start) start.style.display = 'none';
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'none';
    const panel = document.getElementById('panel-alphgpt');
    if (panel) {
      panel.hidden = false;
      panel.setAttribute('aria-hidden', 'false');
      panel.classList.add('active');
    }
  });
  await expect(page.locator('#panel-alphgpt')).toHaveClass(/active/);
}

async function send(page, text) {
  await page.fill('#alphgpt-input', text);
  // Enter, not click: the game's click-outside handler (registered at boot,
  // which races the panel activation) closes the panel on page-level clicks.
  await page.press('#alphgpt-input', 'Enter');
}

async function lastBotText(page) {
  const msgs = await page.locator('#alphgpt-messages .chat-msg-bot').all();
  const last = msgs.length ? msgs[msgs.length - 1] : null;
  return last ? (await last.innerText()) : '';
}

test.describe('AlphGPT NLU UI gate (G-03)', () => {
  // The chat panel is display:none on mobile portrait (index.html).
  test.skip(({ isMobile }) => !!isMobile, 'alphgpt chat is desktop-only');

  test.beforeEach(async ({ page }) => {
    // Production path: don't let Playwright's webdriver flag skip GLB loading.
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });
  });

  for (const c of ROUTING) {
    test(`routes natural ${c.lang} query '${c.prompt}' to the right answer`, async ({ page }) => {
      await bootChat(page);
      await send(page, c.prompt);
      await expect
        .poll(() => lastBotText(page), { timeout: 10000 })
        .toMatch(c.marker);
    });
  }

  test('each of the 4 suggestion chips answers in the query language', async ({ page }) => {
    await bootChat(page);
    const chips = await page.locator('#alphgpt-chips .chat-chip').count();
    expect(chips).toBe(4);

    const expectations = [
      { data: 'What are his skills?', en: /Alfredo's core stack/ },
      { data: '¿Cómo lo contacto?', es: /alfredop88@me.com/ },
      { data: 'Tell me a joke', both: /programador|query|computer|computer|dark mode|SQL/i },
      { data: '¿Qué hay en el cuarto?', es: /juego|cargado/i },
    ];
    for (const e of expectations) {
      await page.click(`#alphgpt-chips .chat-chip[data-prompt="${e.data}"]`);
      await expect
        .poll(() => lastBotText(page), { timeout: 10000 })
        .toMatch(e.en || e.es || e.both);
    }
  });

  test('chips and typed input share the same send path', async ({ page }) => {
    await bootChat(page);
    // Manual input renders a user bubble; a chip click must render one too,
    // through the same renderer (both go through sendMessage → appendMsg).
    await send(page, 'hello');
    await expect(page.locator('#alphgpt-messages .chat-msg-user')).toHaveCount(1);
    await expect(page.locator('#alphgpt-messages .chat-msg-bot')).toHaveCount(2, { timeout: 10000 });
    await page.click('#alphgpt-chips .chat-chip[data-prompt="What are his skills?"]');
    await expect(page.locator('#alphgpt-messages .chat-msg-user')).toHaveCount(2);
    await expect
      .poll(() => lastBotText(page), { timeout: 10000 })
      .toMatch(/Alfredo's core stack/);
  });

  test('terminal mode still routes commands', async ({ page }) => {
    await bootChat(page);
    // Vite rewrites the chat module's static import to /js/systems/alphgpt.ts?t=<stamp>;
    // module identity is the FULL url, so importing './js/systems/alphgpt.ts' bare would
    // load a second instance whose enterTerminalMode() never reaches sendMessage.
    // Import the exact URL the chat actually loaded instead.
    const modUrl = await page.evaluate(() =>
      performance.getEntriesByType('resource').map((r) => r.name).find((n) => n.includes('/js/systems/alphgpt.'))
    );
    await page.evaluate(async (url) => { (await import(url)).enterTerminalMode(); }, modUrl);
    await send(page, 'hablas español?');
    // Terminal-only observable: processTerminalCommand echoes the user text with '> '.
    // Without it this test would pass through the normal askAlphGPT path.
    await expect
      .poll(async () => {
        const users = await page.locator('#alphgpt-messages .chat-msg-user').all();
        const last = users.length ? await users[users.length - 1].innerText() : '';
        return last.replace(/\s+/g, ' ');
      }, { timeout: 10000 })
      .toMatch(/^you > hablas español\?$/i);
    await expect
      .poll(() => lastBotText(page), { timeout: 10000 })
      .toMatch(/Hablo español e inglés/);
    // enterTerminalMode starts a cursor-blink interval; tear it down explicitly
    // (same-URL import returns the cached instance).
    await page.evaluate(async (url) => {
      const m = await import(url);
      if (m.isTerminalMode()) m.exitTerminalMode();
    }, modUrl);
  });
});
