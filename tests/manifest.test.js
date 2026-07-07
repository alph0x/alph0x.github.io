import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const DOCS_ROOT = path.resolve(import.meta.dirname, '../docs');

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
  it('sw.js exists and registers event listeners', () => {
    const swPath = path.join(DOCS_ROOT, 'sw.js');
    const sw = fs.readFileSync(swPath, 'utf-8');

    expect(sw).toContain('self.addEventListener(\'install\'');
    expect(sw).toContain('self.addEventListener(\'activate\'');
    expect(sw).toContain('self.addEventListener(\'fetch\'');
    expect(sw).toContain('caches.open');
    expect(sw).toContain('event.respondWith');
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
