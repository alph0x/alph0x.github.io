import * as THREE from 'three';

/** Synchronous mock for unit tests — returns a Group with one Box mesh. */
export function createMockGlbGroup(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'MockGLB';
  g.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1)));
  return g;
}
