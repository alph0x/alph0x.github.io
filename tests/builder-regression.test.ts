/**
 * @fileoverview Visual regression baseline: ensure core builders are deterministic
 * and survive seed round-trip with identical AABBs.
 */

import { describe, it, expect } from 'vitest';
import '../docs/js/furniture/index.js';
import { expectRoundTripStable } from './helpers/builder-regression.js';

describe('Builder AABB regression', () => {
  it('bed survives seed round-trip', () => {
    expectRoundTripStable('bed', { type: 'bed', position: [0, 0, 0], rotation: 0 });
  });

  it('desk survives seed round-trip', () => {
    expectRoundTripStable('desk', { type: 'desk', position: [0, 0, 0], rotation: 0 });
  });

  it('nightstand survives seed round-trip', () => {
    expectRoundTripStable('nightstand', { type: 'nightstand', position: [0, 0, 0], rotation: 0 });
  });

  it('gamingPC survives seed round-trip', () => {
    expectRoundTripStable('gamingPC', { type: 'gamingPC', position: [0, 0, 0], rotation: 0 });
  });

  it('macBook survives seed round-trip', () => {
    expectRoundTripStable('macBook', { type: 'macBook', position: [0, 0, 0], rotation: 0 });
  });

  it('tv survives seed round-trip', () => {
    expectRoundTripStable('tv', { type: 'tv', position: [0, 0, 0], rotation: 0 });
  });

  it('monitor survives seed round-trip', () => {
    expectRoundTripStable('monitor', { type: 'monitor', position: [0, 0, 0], rotation: 0 });
  });

  it('ceilingLamp survives seed round-trip', () => {
    expectRoundTripStable('ceilingLamp', { type: 'ceilingLamp', position: [0, 2.5, 0], rotation: 0 });
  });
});
