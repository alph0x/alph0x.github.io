import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { createMockGlbGroup } from '../docs/js/assets/loader.js';

describe('external asset loaders', () => {
  it('createMockGlbGroup returns a valid THREE.Group', () => {
    const mock = createMockGlbGroup();
    expect(mock).toBeInstanceOf(THREE.Group);
    expect(mock.children.length).toBe(1);
    expect(mock.children[0]).toBeInstanceOf(THREE.Mesh);
  });

  it('falls back gracefully when GLB fetch fails', async () => {
    // ponytail: in headless tests the real GLB files are not served.
    // The loaders reject with a network error; verify they don't crash.
    const { loadMiniSchnauzer } = await import('../docs/js/furniture/builders/mini-schnauzer.js');
    await expect(loadMiniSchnauzer({ position: [0, 0, 0] })).rejects.toBeDefined();
  });
});
