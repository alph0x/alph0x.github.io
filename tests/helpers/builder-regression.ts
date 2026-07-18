/**
 * Visual regression helper for furniture builders.
 * Builds a mesh from config, round-trips through seed serialization, and compares AABBs.
 */

import * as THREE from 'three';
import { FurnitureRegistry } from '../../docs/js/furniture/registry.js';
import { extractMeshFromResult } from '../../docs/js/primitives.js';
import { serializeLayout, deserializeSeed, DEFAULT_MAT, type FurnitureConfig } from '../../docs/js/seed.js';

const DEFAULT_OUTLINE = [
  [-2.25, -1.75],
  [2.25, -1.75],
  [2.25, 1.75],
  [-2.25, 1.75],
];

interface RegressionResult {
  before: THREE.Box3;
  after: THREE.Box3;
  minDelta: number;
  maxDelta: number;
}

export function buildAndRoundTrip(type: string, config: FurnitureConfig): RegressionResult {
  const entry = FurnitureRegistry.get(type);
  if (!entry) throw new Error(`Unknown furniture type: ${type}`);

  const meshBefore = extractMeshFromResult(entry.builder(config));
  if (!meshBefore) throw new Error(`Builder for ${type} returned no mesh`);
  const before = new THREE.Box3().setFromObject(meshBefore);

  const placed = [{ type, config }];
  const seed = serializeLayout({
    outline: DEFAULT_OUTLINE,
    placed,
    playerSpawn: { x: 0, z: 0 },
    luluSpawn: { x: 0.3, z: 0.7 },
    mat: DEFAULT_MAT,
  });

  const data = deserializeSeed(seed);
  const rebuiltCfg = data.furniture[0];
  if (!rebuiltCfg) throw new Error(`Seed round-trip failed for ${type}`);

  const entryAfter = FurnitureRegistry.get(rebuiltCfg.type);
  if (!entryAfter) throw new Error(`Unknown furniture type after round-trip: ${rebuiltCfg.type}`);
  const meshAfter = extractMeshFromResult(entryAfter.builder(rebuiltCfg));
  if (!meshAfter) throw new Error(`Builder for ${type} returned no mesh after round-trip`);
  const after = new THREE.Box3().setFromObject(meshAfter);

  return {
    before,
    after,
    minDelta: before.min.distanceTo(after.min),
    maxDelta: before.max.distanceTo(after.max),
  };
}

export function expectRoundTripStable(
  type: string,
  config: FurnitureConfig,
  tolerance = 0.001
): RegressionResult {
  const result = buildAndRoundTrip(type, config);
  if (result.minDelta > tolerance || result.maxDelta > tolerance) {
    throw new Error(
      `Builder ${type} AABB changed after seed round-trip: minDelta=${result.minDelta}, maxDelta=${result.maxDelta}`
    );
  }
  return result;
}
