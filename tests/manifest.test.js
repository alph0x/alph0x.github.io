import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const DOCS_ROOT = path.resolve(import.meta.dirname, '../docs/public');

describe('PWA manifest', () => {
  it('manifest.json is valid JSON with required fields', () => {
    const raw = fs.readFileSync(path.join(DOCS_ROOT, 'manifest.json'), 'utf-8');
    const manifest = JSON.parse(raw);

    expect(manifest.name).toBeTruthy();
    expect(manifest.short_name).toBeTruthy();
    expect(manifest.start_url).toBeTruthy();
    expect(manifest.display).toMatch(/standalone|fullscreen|minimal-ui/);
    expect(manifest.theme_color).toBeTruthy();
    expect(manifest.background_color).toBeTruthy();
    expect(manifest.icons).toBeInstanceOf(Array);
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2);

    for (const icon of manifest.icons) {
      expect(icon.src).toBeTruthy();
      expect(icon.sizes).toMatch(/^\d+x\d+$/);
      expect(icon.type).toBe('image/png');
      expect(fs.existsSync(path.join(DOCS_ROOT, icon.src))).toBe(true);
    }
  });
});

describe('PWA service worker', () => {
  it('registers install, activate, and fetch lifecycle handlers', async () => {
    const registered = [];
    vi.stubGlobal('self', {
      addEventListener: (type) => registered.push(type),
      skipWaiting: vi.fn(),
      location: { origin: 'http://localhost' },
      clients: { claim: vi.fn() },
    });

    await import('../docs/public/sw.js');
    vi.unstubAllGlobals();

    expect(registered).toEqual(['install', 'activate', 'fetch']);
  });
});

describe('PWA icons', () => {
  it('has required icon sizes', () => {
    const required = ['icon-192.png', 'icon-512.png', 'icon-32.png', 'apple-touch-icon.png'];
    for (const name of required) {
      expect(fs.existsSync(path.join(DOCS_ROOT, 'icons', name))).toBe(true);
    }
  });
});
