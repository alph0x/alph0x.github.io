import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { buildMiniSchnauzer } from '../docs/js/furniture/builders/mini-schnauzer.js';
import { syncPetToThreeJS } from '../docs/js/infrastructure/pet-renderer.js';

function makeMockPet(overrides = {}) {
  return {
    breathScale: 1.0,
    tailRotationZ: 0.2,
    tailRotationY: 0,
    earLRotationZ: -0.2,
    earRRotationZ: -0.2,
    headRotation: 0,
    position: { x: 0, y: 0, z: 0 },
    bodyRotation: 0,
    ...overrides,
  };
}

describe('Pet light tracking', () => {
  it('backLight world position moves with breathing scale', () => {
    const result = buildMiniSchnauzer({ position: [0, 0, 0], rotation: 0 });
    const mesh = result.mesh;

    const body = mesh.getObjectByName('body');
    const light = body.getObjectByName('backLight');
    expect(light).toBeDefined();
    expect(light).not.toBeNull();

    const worldPos = new THREE.Vector3();

    // Calm breathing
    syncPetToThreeJS(makeMockPet({ breathScale: 1.0 }), mesh, { x: 0, y: 0, z: 0 });
    light.getWorldPosition(worldPos);
    const yCalm = worldPos.y;

    // Excited breathing
    syncPetToThreeJS(makeMockPet({ breathScale: 1.025 }), mesh, { x: 0, y: 0, z: 0 });
    light.getWorldPosition(worldPos);
    const yExcited = worldPos.y;
    expect(yExcited).toBeGreaterThan(yCalm);

    // Deep exhale
    syncPetToThreeJS(makeMockPet({ breathScale: 0.985 }), mesh, { x: 0, y: 0, z: 0 });
    light.getWorldPosition(worldPos);
    const yExhale = worldPos.y;
    expect(yExhale).toBeLessThan(yCalm);
  });
});
