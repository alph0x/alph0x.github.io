import { describe, it, expect, vi } from 'vitest';
import * as THREE from 'three';

vi.mock('three/addons/loaders/GLTFLoader.js', () => ({
  GLTFLoader: class {
    load(_path, _onLoad, _onProgress, onError) {
      queueMicrotask(() => onError(new Error('network down')));
    }
  },
}));

import { createMockGlbGroup } from './helpers/mock-glb.js';

describe('external asset loaders', () => {
  it('createMockGlbGroup returns a valid THREE.Group', () => {
    const mock = createMockGlbGroup();
    expect(mock).toBeInstanceOf(THREE.Group);
    expect(mock.children.length).toBe(1);
    expect(mock.children[0]).toBeInstanceOf(THREE.Mesh);
  });

  it('loadMacBook rejects with the specific loader error when fetch fails', async () => {
    const { loadMacBook } = await import('../docs/js/furniture/builders/macbook.js');
    await expect(loadMacBook({ position: [0, 0, 0] })).rejects.toThrow('network down');
  });
});
