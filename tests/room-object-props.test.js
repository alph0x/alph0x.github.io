import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { FurnitureRegistry } from '../docs/js/furniture/registry.js';
import '../docs/js/furniture/builders/book-stack.js';
import '../docs/js/furniture/builders/shoes.js';
import '../docs/js/furniture/builders/rug.js';
import '../docs/js/furniture/builders/fairy-lights.js';
import '../docs/js/furniture/builders/poster.js';
import '../docs/js/furniture/builders/desk-chair.js';
const build = (type, options = {}) => FurnitureRegistry.get(type).builder({ position: [0, 0, 0], ...options }).mesh;
const meshes = root => { const out = []; root.traverse(o => { if (o.isMesh) out.push(o); }); return out; };

describe('small room object construction', () => {
  it('chair back upholstery covers the structural support from the front', () => {
    const chair = build('deskChair');
    chair.updateMatrixWorld(true);
    for (const y of [0.74, 0.77, 0.79]) {
      const ray = new THREE.Raycaster(new THREE.Vector3(0, y, 1), new THREE.Vector3(0, 0, -1));
      const first = ray.intersectObject(chair, true)[0];
      expect(first?.object.material.color.getHex()).toBe(0x9a7256);
    }
  });
  it('books expose inset pages with covers while preserving stack height and count', () => {
    const stack = build('bookStack', { count: 5 });
    expect(stack.children).toHaveLength(5);
    expect(new THREE.Box3().setFromObject(stack).max.y).toBeCloseTo(.151, 6);
    for (const book of stack.children) {
      const parts = meshes(book);
      expect(parts.length).toBeGreaterThanOrEqual(2);
      expect(new Set(parts.map(p => p.material)).size).toBeGreaterThanOrEqual(2);
    }
  });
  it('shoes have continuously rounded uppers and soles grounded at zero', () => {
    const shoes = build('shoes');
    const soles = meshes(shoes).filter(m => m.name.startsWith('shoe-sole'));
    const uppers = meshes(shoes).filter(m => m.name.startsWith('shoe-upper'));
    expect(soles).toHaveLength(2);
    expect(uppers).toHaveLength(2);
    for (const sole of soles) expect(new THREE.Box3().setFromObject(sole).min.y).toBeCloseTo(0, 6);
    for (const upper of uppers) {
      expect(new Set(Array.from(upper.geometry.attributes.position.array).map(v => v.toFixed(5))).size).toBeGreaterThan(20);
      // The crown faces upward, so outside surfaces receive light and front-side rays.
      expect(upper.geometry.attributes.normal.getY(3 * 20)).toBeGreaterThan(0.8);
    }
  });
  it('rug renders its woven borders in one continuous surface, without floating overlay sheets', () => {
    const rug = build('rug');
    expect(meshes(rug)).toHaveLength(1);
    expect(meshes(rug)[0].geometry.attributes.color.count).toBeGreaterThan(4);
    const bounds = new THREE.Box3().setFromObject(rug);
    expect(bounds.max.x - bounds.min.x).toBeCloseTo(2.5, 6);
    expect(bounds.max.z - bounds.min.z).toBeCloseTo(1.8, 6);
  });
  it('fairy bulbs have sockets and preserve all four emitters', () => {
    const fairy = build('fairyLights');
    expect(meshes(fairy).filter(m => m.name.startsWith('bulb-socket'))).toHaveLength(10);
    const lights = fairy.children.filter(c => c.isPointLight);
    expect(lights).toHaveLength(4);
    for (const light of lights) { expect(light.intensity).toBe(.08); expect(light.distance).toBe(1.2); }
  });
  it('poster typography has sufficient resolution and opaque paper', () => {
    const poster = build('poster', { text: 'BUILD\nCREATE', color: 0xa85238 });
    expect(poster.material.map.image.width).toBeGreaterThanOrEqual(512);
    expect(poster.material.transparent).toBe(false);
    expect(new THREE.Box3().setFromObject(poster).max.x).toBeCloseTo(.28, 6);
  });
});
