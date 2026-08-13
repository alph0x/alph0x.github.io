import { describe, it, expect, vi } from 'vitest';
import * as THREE from 'three';

vi.mock('three/addons/loaders/GLTFLoader.js', () => ({
  GLTFLoader: class {
    load(path, onLoad, _onProgress, onError) {
      if (path.includes('missing')) queueMicrotask(() => onError(new Error('404')));
      else queueMicrotask(() => onLoad({ scene: new THREE.Group() }));
    }
  },
}));

import { loadGlb } from '../docs/js/assets/loader.js';
import { createMockGlbGroup } from './helpers/mock-glb.js';

describe('loadGlb', () => {
  it('resolves with the parsed scene group on success', async () => {
    const group = await loadGlb('assets/models/ok.glb');
    expect(group).toBeInstanceOf(THREE.Group);
  });

  it('rejects with the loader error on failure', async () => {
    await expect(loadGlb('assets/models/missing.glb')).rejects.toThrow('404');
  });
});

describe('createMockGlbGroup', () => {
  it('returns a Group with one mesh', () => {
    const mock = createMockGlbGroup();
    expect(mock).toBeInstanceOf(THREE.Group);
    expect(mock.children.length).toBe(1);
  });
});
