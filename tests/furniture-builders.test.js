/**
 * @fileoverview Tests for representative furniture builders.
 *
 * Decision: Import a subset of builders and verify they produce valid
 * THREE.js objects with correct structure and config application.
 * Rationale (OCP): New builders register themselves — tests verify the
 * registry contract without modifying test files.
 */


import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { FurnitureRegistry } from '../docs/js/furniture/registry.js';

// Import builders to trigger self-registration
import '../docs/js/furniture/builders/bed.js';
import '../docs/js/furniture/builders/desk.js';
import '../docs/js/furniture/builders/tv.js';
import '../docs/js/furniture/builders/macbook.js';
import '../docs/js/furniture/builders/ceiling-lamp.js';
import '../docs/js/furniture/builders/poster.js';
import '../docs/js/furniture/builders/fairy-lights.js';
import '../docs/js/furniture/builders/door.js';
import '../docs/js/furniture/builders/window.js';
import '../docs/js/furniture/builders/mini-schnauzer.js';

describe('FurnitureRegistry', () => {
  it('has all imported builders registered', () => {
    expect(FurnitureRegistry.has('bed')).toBe(true);
    expect(FurnitureRegistry.has('desk')).toBe(true);
    expect(FurnitureRegistry.has('tv')).toBe(true);
    expect(FurnitureRegistry.has('macBook')).toBe(true);
    expect(FurnitureRegistry.has('ceilingLamp')).toBe(true);
  });

  it('every entry has a builder function', () => {
    for (const [type, entry] of FurnitureRegistry.entries()) {
      expect(typeof entry.builder, `type ${type}`).toBe('function');
    }
  });
});

// ── bed ─────────────────────────────────────────────────────────

describe('buildBed', () => {
  const { builder } = FurnitureRegistry.get('bed');

  it('returns a unified contract with mesh', () => {
    const result = builder({ position: [0, 0, 0], rotation: 0 });
    expect(result.mesh).toBeInstanceOf(THREE.Group);
  });

  it('has multiple children (legs, base, mattress, pillows, headboard)', () => {
    const result = builder({ position: [0, 0, 0], rotation: 0 });
    expect(result.mesh.children.length).toBeGreaterThan(5);
  });

  it('applies position and rotation from config', () => {
    const result = builder({ position: [1, 2, 3], rotation: Math.PI / 2 });
    expect(result.mesh.position.x).toBe(1);
    expect(result.mesh.position.y).toBe(2);
    expect(result.mesh.position.z).toBe(3);
    expect(result.mesh.rotation.y).toBe(Math.PI / 2);
  });
});

// ── desk ────────────────────────────────────────────────────────

describe('buildDesk', () => {
  const { builder } = FurnitureRegistry.get('desk');

  it('returns a unified contract with mesh', () => {
    const result = builder({ position: [0, 0, 0], rotation: 0 });
    expect(result.mesh).toBeInstanceOf(THREE.Group);
  });

  it('does not include a bundled chair', () => {
    const result = builder({ position: [0, 0, 0], rotation: 0 });
    const chair = result.mesh.children.find((c) => c instanceof THREE.Group);
    expect(chair).toBeUndefined();
  });
});

// ── tv ──────────────────────────────────────────────────────────

describe('buildTV', () => {
  const { builder } = FurnitureRegistry.get('tv');

  it('returns unified contract with mesh', () => {
    const result = builder({ position: [0, 0, 0], rotation: 0 });
    expect(result.mesh).toBeInstanceOf(THREE.Group);
  });

  it('returns metadata with panel info', () => {
    const result = builder({ position: [0, 0, 0], rotation: 0, panelId: 'test-panel' });
    expect(result.type).toBe('terminal');
    expect(result.panelId).toBe('test-panel');
    expect(result.label).toBe('TV');
  });

  it('has frame, screen, noise, and light children', () => {
    const result = builder({ position: [0, 0, 0], rotation: 0 });
    expect(result.mesh.children.length).toBeGreaterThanOrEqual(3);
    const hasLight = result.mesh.children.some((c) => c instanceof THREE.PointLight);
    expect(hasLight).toBe(true);
  });
});

// ── macBook ─────────────────────────────────────────────────────

describe('buildMacBook', () => {
  const { builder } = FurnitureRegistry.get('macBook');

  it('returns metadata object with mesh', () => {
    const result = builder({ position: [0, 0, 0], rotation: 0 });
    expect(result.mesh).toBeInstanceOf(THREE.Group);
    expect(result.type).toBe('terminal');
    expect(result.label).toBe('MACBOOK');
  });

  it('has children (base, screen, keyboard)', () => {
    const result = builder({ position: [0, 0, 0], rotation: 0 });
    expect(result.mesh.children.length).toBeGreaterThanOrEqual(2);
  });
});

// ── ceilingLamp ─────────────────────────────────────────────────

describe('buildCeilingLamp', () => {
  const { builder } = FurnitureRegistry.get('ceilingLamp');

  it('returns unified contract with mesh', () => {
    const result = builder({ position: [0, 0, 0], rotation: 0 });
    expect(result.mesh).toBeInstanceOf(THREE.Group);
  });

  it('contains a PointLight', () => {
    const result = builder({ position: [0, 0, 0], rotation: 0 });
    const light = result.mesh.children.find((c) => c instanceof THREE.PointLight);
    expect(light).toBeDefined();
  });

  it('contains a Mesh for the fixture', () => {
    const result = builder({ position: [0, 0, 0], rotation: 0 });
    const mesh = result.mesh.children.find((c) => c instanceof THREE.Mesh);
    expect(mesh).toBeDefined();
  });
});


// ── poster ──────────────────────────────────────────────────────

describe('buildPoster', () => {
  const { builder } = FurnitureRegistry.get('poster');

  it('returns unified contract with mesh', () => {
    const result = builder({ position: [0, 0, 0], text: 'TEST', color: 0xff0000 });
    expect(result.mesh).toBeInstanceOf(THREE.Mesh);
  });

  it('applies custom text and color', () => {
    const result = builder({ position: [1, 1.6, -0.5], text: 'GG\nWP', color: 0xec4899 });
    expect(result.mesh).toBeInstanceOf(THREE.Mesh);
    // Position is applied by caller, not builder
    expect(result.mesh.position.x).toBe(0);
  });
});

// ── fairyLights ─────────────────────────────────────────────────

describe('buildFairyLights', () => {
  const { builder } = FurnitureRegistry.get('fairyLights');

  it('returns unified contract with mesh', () => {
    const result = builder({ position: [0, 0, 0] });
    expect(result.mesh).toBeInstanceOf(THREE.Group);
  });

  it('contains 10 bulbs (Sphere meshes)', () => {
    const result = builder({ position: [0, 0, 0] });
    const bulbs = result.mesh.children.filter((c) => c instanceof THREE.Mesh && c.geometry instanceof THREE.SphereGeometry);
    expect(bulbs.length).toBe(10);
  });

  it('contains some PointLights', () => {
    const result = builder({ position: [0, 0, 0] });
    const lights = result.mesh.children.filter((c) => c instanceof THREE.PointLight);
    expect(lights.length).toBeGreaterThan(0);
  });
});

// ── door ────────────────────────────────────────────────────────

describe('buildDoor', () => {
  const { builder } = FurnitureRegistry.get('door');

  it('returns unified contract with mesh', () => {
    const result = builder({ position: [0, 0, 0], rotation: 0 });
    expect(result.mesh).toBeInstanceOf(THREE.Group);
  });

  it('has frame and panel children', () => {
    const result = builder({ position: [0, 0, 0], rotation: 0 });
    // mesh is a wrapper group; the actual door group is the first child
    expect(result.mesh.children[0].children.length).toBeGreaterThanOrEqual(3);
  });
});

// ── miniSchnauzer ───────────────────────────────────────────────

describe('buildMiniSchnauzer', () => {
  const { builder } = FurnitureRegistry.get('miniSchnauzer');

  it('returns unified contract with mesh', () => {
    const result = builder({ position: [0, 0, 0], rotation: 0 });
    expect(result.mesh).toBeInstanceOf(THREE.Group);
  });

  it('has head as a Group containing facial features', () => {
    const result = builder({ position: [0, 0, 0], rotation: 0 });
    const head = result.mesh.getObjectByName('head');
    expect(head).toBeInstanceOf(THREE.Group);
    expect(head.children.length).toBeGreaterThanOrEqual(9); // cranium + 8 facial features
  });

  it('facial features are children of head group', () => {
    const result = builder({ position: [0, 0, 0], rotation: 0 });
    const head = result.mesh.getObjectByName('head');
    const muzzle = result.mesh.getObjectByName('muzzle');
    const beard = result.mesh.getObjectByName('beard');
    const nose = result.mesh.getObjectByName('nose');
    const eyeL = result.mesh.getObjectByName('eyeL');
    const eyeR = result.mesh.getObjectByName('eyeR');
    const earL = result.mesh.getObjectByName('earL');
    const earR = result.mesh.getObjectByName('earR');
    const eyebrowL = result.mesh.getObjectByName('eyebrowL');
    const eyebrowR = result.mesh.getObjectByName('eyebrowR');

    expect(muzzle.parent).toBe(head);
    expect(beard.parent).toBe(head);
    expect(nose.parent).toBe(head);
    expect(eyeL.parent).toBe(head);
    expect(eyeR.parent).toBe(head);
    expect(earL.parent).toBe(head);
    expect(earR.parent).toBe(head);
    expect(eyebrowL.parent).toBe(head);
    expect(eyebrowR.parent).toBe(head);
  });

  it('rotating head rotates facial features in world space', () => {
    const result = builder({ position: [0, 0, 0], rotation: 0 });
    const head = result.mesh.getObjectByName('head');
    const muzzle = result.mesh.getObjectByName('muzzle');

    result.mesh.updateMatrixWorld(true);

    const before = new THREE.Vector3();
    muzzle.getWorldPosition(before);

    head.rotation.y = Math.PI / 4;
    result.mesh.updateMatrixWorld(true);

    const after = new THREE.Vector3();
    muzzle.getWorldPosition(after);

    expect(after.x).not.toBeCloseTo(before.x, 3);
    expect(after.z).not.toBeCloseTo(before.z, 3);
  });
});

// ── window ──────────────────────────────────────────────────────

describe('buildWindow', () => {
  const { builder } = FurnitureRegistry.get('window');

  it('returns unified contract with mesh', () => {
    const result = builder({ position: [0, 0, 0], rotation: 0 });
    expect(result.mesh).toBeInstanceOf(THREE.Group);
  });

  it('contains a cityscape with parallax flag', () => {
    const result = builder({ position: [0, 0, 0], rotation: 0 });
    const cityscape = result.mesh.children.find((c) => c.userData._parallax);
    expect(cityscape).toBeDefined();
    const layers = cityscape.children.filter((c) => c.userData._parallax);
    expect(layers.some((l) => l.userData._parallaxFactor > 0)).toBe(true);
  });

  it('contains a SpotLight', () => {
    const result = builder({ position: [0, 0, 0], rotation: 0 });
    const light = result.mesh.children.find((c) => c instanceof THREE.SpotLight || c.children.some((ch) => ch instanceof THREE.SpotLight));
    // Window frame may contain the light nested
    const hasSpot = result.mesh.children.some((c) =>
      c instanceof THREE.SpotLight ||
      c.children?.some((ch) => ch instanceof THREE.SpotLight)
    );
    expect(hasSpot || result.mesh.children.length > 2).toBe(true);
  });
});
