import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { FurnitureRegistry } from '../docs/js/furniture/registry.js';
import '../docs/js/furniture/builders/mug.js';
import '../docs/js/furniture/builders/floor-lamp.js';
import '../docs/js/furniture/builders/ceiling-lamp.js';
import '../docs/js/furniture/builders/macbook.js';

const build = (type, position = [0, 0, 0]) => {
  const root = FurnitureRegistry.get(type).builder({position, rotation: 0}).mesh;
  root.updateMatrixWorld(true);
  return root;
};
const hits = (root, origin, direction) => new THREE.Raycaster(new THREE.Vector3(...origin), new THREE.Vector3(...direction)).intersectObject(root, true);

describe('usable object construction', () => {
  it('mug has a recessed drink surface and a rim above it', () => {
    const mug = build('mug');
    const center = hits(mug, [.003, .1, .002], [0, -1, 0]);
    const rim = hits(mug, [-.028, .1, 0], [0, -1, 0]);
    expect(center.length).toBeGreaterThan(0);
    expect(rim.length).toBeGreaterThan(0);
    expect(rim[0].point.y - center[0].point.y).toBeGreaterThan(.004);
    expect(new THREE.Box3().setFromObject(mug).min.y).toBeCloseTo(-.025, 6);
  });
  it('ceiling shade has an open underside away from bulb and socket', () => {
    const lamp = build('ceilingLamp', [0, 2.7, 0]);
    expect(hits(lamp, [.15, 2.25, 0], [0, 1, 0])[0]?.point.y ?? 3).toBeGreaterThan(2.40);
  });
  it('ceiling bulb has a continuous socket down from its mount', () => {
    const lamp = build('ceilingLamp', [0, 2.7, 0]);
    expect(hits(lamp, [.05, 2.53, 0], [-1, 0, 0]).some(hit => Math.abs(hit.point.x) < .025)).toBe(true);
  });
  it('fallback screen lies flush with its lid instead of cutting through it', () => {
    const laptop = build('macBook');
    let screen;
    laptop.traverse(node => { if (node.geometry?.type === 'PlaneGeometry') screen = node; });
    expect(screen).toBeDefined();
    const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(screen.quaternion);
    expect(Math.abs(normal.y)).toBeCloseTo(1, 6);
  });
  it('lamp emitters retain their established local placement and intensity', () => {
    for (const [type, y, intensity] of [['floorLamp', 1.55, .6], ['ceilingLamp', -.38, 4]]) {
      const root = build(type); const lights = [];
      root.traverse(n => { if (n.isPointLight) lights.push(n); });
      expect(lights).toHaveLength(1);
      expect(lights[0].position.toArray()).toEqual([0, y, 0]);
      expect(lights[0].intensity).toBe(intensity);
    }
  });
});

import '../docs/js/furniture/builders/desk-chair.js';
import '../docs/js/furniture/builders/bookshelf.js';
import '../docs/js/furniture/builders/nightstand.js';

describe('furniture load paths', () => {
  it('chair spokes align with the radial path to grounded wheels', () => {
    const chair = build('deskChair');
    for (let i = 0; i < 5; i++) {
      const spoke = chair.getObjectByName(`chair-spoke-${i}`);
      const caster = chair.getObjectByName(`chair-caster-${i}`);
      expect(spoke).toBeDefined(); expect(caster).toBeDefined();
      const radial = caster.position.clone().setY(0).normalize();
      const axis = new THREE.Vector3(0, 0, 1).applyQuaternion(spoke.quaternion).normalize();
      expect(Math.abs(axis.dot(radial))).toBeCloseTo(1, 6);
      expect(new THREE.Box3().setFromObject(caster).min.y).toBeCloseTo(0, 6);
    }
  });
  it('leaning books rest on their shelf instead of penetrating it', () => {
    const shelf = build('bookshelf'); let checked = 0;
    shelf.traverse(book => {
      if (book.name !== 'shelf-book') return;
      const box = new THREE.Box3().setFromObject(book, true);
      expect(box.min.y).toBeCloseTo(book.userData.shelfY, 5); checked++;
    });
    expect(checked).toBeGreaterThan(0);
  });
  it('the drawer pull is centered on its drawer', () => {
    const handle = build('nightstand').getObjectByName('nightstand-drawer-handle');
    expect(handle).toBeDefined(); expect(handle.position.x).toBe(0);
  });
});

import '../docs/js/furniture/builders/door.js';
import '../docs/js/furniture/builders/poster.js';
import { ROOM_LAYOUT, DEFAULT_WALL_T } from '../docs/js/core.js';

describe('interior wall mounting', () => {
  it('door faces inward and clears a wall when its saved anchor is outside the wall', () => {
    const original = ROOM_LAYOUT.outline;
    ROOM_LAYOUT.outline = [[-2.25,-1.75],[2.25,-1.75],[2.25,1.75],[-2.25,1.75]];
    try {
      const door = build('door', [0,0,1.9]);
      const bound = new THREE.Box3().setFromObject(door, true);
      expect(bound.max.z).toBeLessThan(1.75 - DEFAULT_WALL_T / 2);
      const facing = new THREE.Vector3(0,0,1).applyQuaternion(door.children[0].quaternion);
      expect(facing.z).toBeLessThan(-.99);
    } finally { ROOM_LAYOUT.outline = original; }
  });
  it('poster paper and frame clear the interior face of the left wall', () => {
    const poster = build('poster');
    poster.position.set(-2.2,1.55,-1);poster.rotation.y=Math.PI/2;poster.updateMatrixWorld(true);
    expect(new THREE.Box3().setFromObject(poster,true).min.x).toBeGreaterThan(-2.25 + DEFAULT_WALL_T / 2);
  });
});
