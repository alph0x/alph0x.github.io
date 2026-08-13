import * as THREE from 'three';
import { register } from '../registry.js';
import { makeStd, texMetal, texPlastic, texScreenGlow } from '../../assets/index.js';
import { makeBox, makePlane, makeRoundedBox, rootGroup } from '../../primitives.js';
import { loadGlb } from '../../assets/loader.js';
import type { FurnitureConfig } from '../../seed.js';

function buildMacBook(cfg: FurnitureConfig): { mesh: THREE.Group; type: string; panelId: string; label: string; room: string } {
  const [x, y, z] = cfg.position;
  const g = rootGroup(cfg);

  const aluminum = makeStd({ map: texMetal, color: 0xc0c0c8, roughness: 0.3, metalness: 0.6 });
  const dark = makeStd({ map: texPlastic, color: 0x1a1a1e, roughness: 0.7 });
  const keyMat = makeStd({ color: 0x111114, roughness: 0.8 });
  const screenGlow = new THREE.MeshBasicMaterial({ map: texScreenGlow });
  screenGlow.color.multiplyScalar(4); // crosses the 0.85 bloom threshold
  const trackpadMat = makeStd({ map: texMetal, color: 0xd0d0d8, roughness: 0.3, metalness: 0.5 });

  // 14" MacBook Pro footprint: 0.3126 × 0.2212 m, 15.5 mm thin
  const w = 0.3126;
  const d = 0.2212;
  const baseH = 0.014;
  const lidH = 0.007;

  // Rounded base (clamshell foot)
  g.add(makeRoundedBox(aluminum, [w, baseH, d], [0, baseH / 2, 0], 0.004, 2));

  // Keyboard area
  g.add(makeBox(dark, [w * 0.88, 0.002, d * 0.42], [0, baseH + 0.001, -d * 0.08]));

  // Keys as rounded strips
  for (let row = 0; row < 5; row++) {
    g.add(makeRoundedBox(keyMat, [w * 0.82, 0.003, 0.018], [0, baseH + 0.002, -d * 0.18 + row * 0.022], 0.002, 2));
  }

  // Trackpad
  g.add(makeRoundedBox(trackpadMat, [w * 0.28, 0.002, d * 0.22], [0, baseH + 0.001, d * 0.22], 0.002, 2));

  // Lid group
  const lidGroup = new THREE.Group();
  lidGroup.position.set(0, baseH, -d / 2);
  lidGroup.rotation.x = -Math.PI / 2 - 0.55;

  // Lid back
  lidGroup.add(makeRoundedBox(aluminum, [w, lidH, d], [0, lidH / 2, d / 2], 0.004, 2));
  // Bezel
  lidGroup.add(makeBox(dark, [w * 0.96, 0.002, d * 0.92], [0, -0.001, d / 2]));
  // Emissive screen plane
  lidGroup.add(makePlane(screenGlow, [w * 0.9, d * 0.85], [0, -0.002, d / 2]));

  g.add(lidGroup);

  // Keyboard backlight
  g.add(makeBox(new THREE.MeshBasicMaterial({ color: 0xffc98a, transparent: true, opacity: 0.06 }), [w * 0.82, 0.001, d * 0.38], [0, baseH + 0.003, -d * 0.08]));
  // Desk reflection
  g.add(makeBox(new THREE.MeshBasicMaterial({ color: 0xffc98a, transparent: true, opacity: 0.12 }), [w, 0.001, d * 0.6], [0, 0.001, d * 0.15]));

  return { mesh: g, type: 'terminal', panelId: 'panel-alphgpt', label: 'MACBOOK', room: 'APT' };
}

export async function loadMacBook(cfg: FurnitureConfig): Promise<{ mesh: THREE.Group; type: string; panelId: string; label: string; room: string }> {
  const inner = await loadGlb('/assets/models/macbook.glb');

  // Normalize by measured bounds: the source GLB is ~2.7 units wide with its
  // origin near the model center, so a raw position.set() both renders it
  // ~3× too large and sinks the base through the desk. Scale to a real
  // 14" MacBook Pro footprint (0.3126 m) and rest the base on cfg.position.y.
  const box = new THREE.Box3().setFromObject(inner);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);
  const s = 0.3126 / size.x;
  inner.scale.set(s, s, s);
  inner.position.set(-center.x * s, -box.min.y * s, -center.z * s);

  // The wrapper owns placement: the level builder sets position/rotation on it.
  const group = new THREE.Group();
  group.add(inner);
  const [x, y, z] = cfg.position;
  group.position.set(x, y, z);
  group.rotation.y = cfg.rotation ?? 0;

  return { mesh: group, type: 'terminal', panelId: 'panel-alphgpt', label: 'MACBOOK', room: 'APT' };
}

register('macBook', buildMacBook);
