import { describe, it, expect, vi } from 'vitest';

// Behavior-level check: import sw.js with stubbed worker globals and drive the
// install handler, instead of grepping source text.
// ponytail: SHELL_ASSETS is not exported (classic worker script) — stubbing the
// SW runtime is the smallest behavioral seam that needs no source change.
describe('service worker assets', () => {
  it('precaches the app shell including both GLB models on install', async () => {
    const listeners = {};
    const cacheAdds = [];
    vi.stubGlobal('self', {
      addEventListener: (type, fn) => { listeners[type] = fn; },
      skipWaiting: vi.fn(),
      location: { origin: 'http://localhost' },
      clients: { claim: vi.fn() },
    });
    vi.stubGlobal('caches', {
      open: vi.fn(async () => ({ addAll: async (assets) => cacheAdds.push(...assets) })),
    });

    await import('../docs/public/sw.js');

    expect(typeof listeners.install).toBe('function');
    await listeners.install({ waitUntil: (p) => p });
    vi.unstubAllGlobals();

    expect(cacheAdds).toContain('/assets/models/lulu.glb');
    expect(cacheAdds).toContain('/assets/models/macbook.glb');
  });
});
