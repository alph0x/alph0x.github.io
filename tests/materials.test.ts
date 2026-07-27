/**
 * @fileoverview P-04 toon material factory: M registry key set, toon conversion,
 * shared gradientMap singleton, MeshBasicMaterial entries unchanged (contract §3).
 */

import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { M, makeStd } from '../docs/js/assets/materials.js';

describe('M registry (contract §3)', () => {
  it('has exactly the 7 expected keys', () => {
    expect(Object.keys(M).sort()).toEqual(
      ['terminal', 'terminalPink', 'terminalCyan', 'terminalGreen', 'glowPurple', 'glowCyan', 'wood'].sort(),
    );
  });

  it('M.wood is a MeshToonMaterial (makeStd funnel)', () => {
    expect(M.wood).toBeInstanceOf(THREE.MeshToonMaterial);
  });

  it('makeStd instances share one gradientMap reference', () => {
    expect(makeStd({}).gradientMap).toBe(makeStd({}).gradientMap);
  });

  it('terminal/glow entries stay unlit MeshBasicMaterial', () => {
    for (const key of ['terminal', 'terminalPink', 'terminalCyan', 'terminalGreen', 'glowPurple', 'glowCyan']) {
      expect(M[key]).toBeInstanceOf(THREE.MeshBasicMaterial);
    }
  });
});
