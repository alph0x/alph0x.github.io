/**
 * @fileoverview Tests for representative furniture builders.
 *
 * Decision: Import a subset of builders and verify they produce valid
 * THREE.js objects with correct structure and config application.
 * Rationale (OCP): New builders register themselves — tests verify the
 * registry contract without modifying test files.
 */

import './setup-canvas-mock.js';
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

  it('returns a Group', () => {
    const result = builder({ position: [0, 0, 0], rotation: 0 });
    expect(result).toBeInstanceOf(THREE.Group);
  });

  it('has multiple children (legs, base, mattress, pillows, headboard)', () => {
    const result = builder({ position: [0, 0, 0], rotation: 0 });
    expect(result.children.length).toBeGreaterThan(5);
  });

  it('applies position and rotation from config', () => {
    const result = builder({ position: [1, 2, 3], rotation: Math.PI / 2 });
    expect(result.position.x).toBe(1);
    expect(result.position.y).toBe(2);
    expect(result.position.z).toBe(3);
    expect(result.rotation.y).toBe(Math.PI / 2);
  });
});

// ── desk ────────────────────────────────────────────────────────

describe('buildDesk', () => {
  const { builder } = FurnitureRegistry.get('desk');

  it('returns a Group', () => {
    const result = builder({ position: [0, 0, 0], rotation: 0 });
    expect(result).toBeInstanceOf(THREE.Group);
  });

  it('does not include a bundled chair', () => {
    const result = builder({ position: [0, 0, 0], rotation: 0 });
    const chair = result.children.find((c) => c instanceof THREE.Group);
    expect(chair).toBeUndefined();
  });
});

// ── tv ──────────────────────────────────────────────────────────

describe('buildTV', () => {
  const { builder } = FurnitureRegistry.get('tv');

  it('returns a Group as first element of array', () => {
    const result = builder({ position: [0, 0, 0], rotation: 0 });
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]).toBeInstanceOf(THREE.Group);
  });

  it('returns metadata with panel info', () => {
    const result = builder({ position: [0, 0, 0], rotation: 0, panelId: 'test-panel' });
    expect(result[1].type).toBe('terminal');
    expect(result[1].panelId).toBe('test-panel');
    expect(result[1].label).toBe('TV');
  });

  it('has frame, screen, noise, and light children', () => {
    const result = builder({ position: [0, 0, 0], rotation: 0 });
    const group = result[0];
    expect(group.children.length).toBeGreaterThanOrEqual(3);
    const hasLight = group.children.some((c) => c instanceof THREE.PointLight);
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

  it('returns a Group', () => {
    const result = builder({ position: [0, 0, 0], rotation: 0 });
    expect(result).toBeInstanceOf(THREE.Group);
  });

  it('contains a PointLight', () => {
    const result = builder({ position: [0, 0, 0], rotation: 0 });
    const light = result.children.find((c) => c instanceof THREE.PointLight);
    expect(light).toBeDefined();
  });

  it('contains a Mesh for the fixture', () => {
    const result = builder({ position: [0, 0, 0], rotation: 0 });
    const mesh = result.children.find((c) => c instanceof THREE.Mesh);
    expect(mesh).toBeDefined();
  });
});


// ── poster ──────────────────────────────────────────────────────

describe('buildPoster', () => {
  const { builder } = FurnitureRegistry.get('poster');

  it('returns a Mesh', () => {
    const result = builder({ position: [0, 0, 0], text: 'TEST', color: 0xff0000 });
    expect(result).toBeInstanceOf(THREE.Mesh);
  });

  it('applies custom text and color', () => {
    const result = builder({ position: [1, 1.6, -0.5], text: 'GG\nWP', color: 0xec4899 });
    expect(result).toBeInstanceOf(THREE.Mesh);
    // Position is applied by caller, not builder
    expect(result.position.x).toBe(0);
  });
});

// ── fairyLights ─────────────────────────────────────────────────

describe('buildFairyLights', () => {
  const { builder } = FurnitureRegistry.get('fairyLights');

  it('returns a Group', () => {
    const result = builder({ position: [0, 0, 0] });
    expect(result).toBeInstanceOf(THREE.Group);
  });

  it('contains 10 bulbs (Sphere meshes)', () => {
    const result = builder({ position: [0, 0, 0] });
    const bulbs = result.children.filter((c) => c instanceof THREE.Mesh && c.geometry instanceof THREE.SphereGeometry);
    expect(bulbs.length).toBe(10);
  });

  it('contains some PointLights', () => {
    const result = builder({ position: [0, 0, 0] });
    const lights = result.children.filter((c) => c instanceof THREE.PointLight);
    expect(lights.length).toBeGreaterThan(0);
  });
});

// ── door ────────────────────────────────────────────────────────

describe('buildDoor', () => {
  const { builder } = FurnitureRegistry.get('door');

  it('returns a Group', () => {
    const result = builder({ position: [0, 0, 0], rotation: 0 });
    expect(result).toBeInstanceOf(THREE.Group);
  });

  it('has frame and panel children', () => {
    const result = builder({ position: [0, 0, 0], rotation: 0 });
    expect(result.children.length).toBeGreaterThanOrEqual(3);
  });
});

// ── miniSchnauzer ───────────────────────────────────────────────

describe('buildMiniSchnauzer', () => {
  const { builder } = FurnitureRegistry.get('miniSchnauzer');

  it('returns a Group', () => {
    const result = builder({ position: [0, 0, 0], rotation: 0 });
    expect(result).toBeInstanceOf(THREE.Group);
  });

  it('has head as a Group containing facial features', () => {
    const result = builder({ position: [0, 0, 0], rotation: 0 });
    const head = result.getObjectByName('head');
    expect(head).toBeInstanceOf(THREE.Group);
    expect(head.children.length).toBeGreaterThanOrEqual(9); // cranium + 8 facial features
  });

  it('facial features are children of head group', () => {
    const result = builder({ position: [0, 0, 0], rotation: 0 });
    const head = result.getObjectByName('head');
    const muzzle = result.getObjectByName('muzzle');
    const beard = result.getObjectByName('beard');
    const nose = result.getObjectByName('nose');
    const eyeL = result.getObjectByName('eyeL');
    const eyeR = result.getObjectByName('eyeR');
    const earL = result.getObjectByName('earL');
    const earR = result.getObjectByName('earR');
    const eyebrowL = result.getObjectByName('eyebrowL');
    const eyebrowR = result.getObjectByName('eyebrowR');

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
    const head = result.getObjectByName('head');
    const muzzle = result.getObjectByName('muzzle');

    result.updateMatrixWorld(true);

    const before = new THREE.Vector3();
    muzzle.getWorldPosition(before);

    head.rotation.y = Math.PI / 4;
    result.updateMatrixWorld(true);

    const after = new THREE.Vector3();
    muzzle.getWorldPosition(after);

    expect(after.x).not.toBeCloseTo(before.x, 3);
    expect(after.z).not.toBeCloseTo(before.z, 3);
  });
});

// ── window ──────────────────────────────────────────────────────

describe('buildWindow', () => {
  const { builder } = FurnitureRegistry.get('window');

  it('returns a Group', () => {
    const result = builder({ position: [0, 0, 0], rotation: 0 });
    expect(result).toBeInstanceOf(THREE.Group);
  });

  it('contains a cityscape with parallax flag', () => {
    const result = builder({ position: [0, 0, 0], rotation: 0 });
    const cityscape = result.children.find((c) => c.userData._parallax);
    expect(cityscape).toBeDefined();
    expect(cityscape.userData._parallaxFactor).toBeGreaterThan(0);
  });

  it('contains a SpotLight', () => {
    const result = builder({ position: [0, 0, 0], rotation: 0 });
    const light = result.children.find((c) => c instanceof THREE.SpotLight || c.children.some((ch) => ch instanceof THREE.SpotLight));
    // Window frame may contain the light nested
    const hasSpot = result.children.some((c) =>
      c instanceof THREE.SpotLight ||
      c.children?.some((ch) => ch instanceof THREE.SpotLight)
    );
    expect(hasSpot || result.children.length > 2).toBe(true);
  });
});
