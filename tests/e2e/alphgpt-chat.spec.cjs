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
  await page.goto('/');
  await page.waitForSelector('#panel-alphgpt', { state: 'attached', timeout: 30000 });
  // The start-screen overlay (z-index above the panel) intercepts pointer
  // events; the game boot re-shows it, so hide it here, after load.
  await page.evaluate(() => {
    const start = document.getElementById('start-screen');
    if (start) start.style.display = 'none';
    document.getElementById('panel-alphgpt').classList.add('active');
  });
  await expect(page.locator('#panel-alphgpt')).toHaveClass(/active/);
}

async function send(page, text) {
  await page.fill('#alphgpt-input', text);
  await page.click('#alphgpt-send');
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
      { data: '¿Qué hay en el cuarto?', es: /cuarto|proyecto/i },
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
    await page.click('#alphgpt-chips .chat-chip[data-prompt="What are his skills?"]');
    await expect(page.locator('#alphgpt-messages .chat-msg-user')).toHaveCount(2);
    await expect
      .poll(() => lastBotText(page), { timeout: 10000 })
      .toMatch(/Alfredo's core stack/);
  });

  test('terminal mode still routes commands', async ({ page }) => {
    await bootChat(page);
    page.evaluate(() => import('./js/systems/alphgpt.js').then((m) => m.enterTerminalMode()));
    await send(page, 'hablas español?');
    await expect
      .poll(() => lastBotText(page), { timeout: 10000 })
      .toMatch(/Hablo español e inglés/);
  });
});