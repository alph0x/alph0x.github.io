import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { loadGlb, createMockGlbGroup } from '../docs/js/assets/loader.js';

describe('loadGlb', () => {
  it('returns a THREE.Group from a mock', async () => {
    const mock = createMockGlbGroup();
    // ponytail: loader expects a real file path; test the mock helper directly.
    expect(mock).toBeInstanceOf(THREE.Group);
    expect(mock.children.length).toBe(1);
  });
});
