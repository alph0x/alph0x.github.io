import * as THREE from 'three';
import { register } from '../registry.js';
import { makeStd } from '../../assets/index.js';
import { makeBox } from '../../primitives.js';

function buildMacBook(cfg) {
  const g = new THREE.Group();
  g.position.set(...cfg.position);
  g.rotation.y = cfg.rotation || 0;

  const aluminum = makeStd({ color: 0xc0c0c8 });
  const dark = makeStd({ color: 0x1a1a1e });
  const keyMat = makeStd({ color: 0x111114 });
  const screenGlow = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });

  const w = 0.36; // width
  const d = 0.25; // depth
  const baseH = 0.012;
  const lidH = 0.008;

  // Base
  const base = makeBox(aluminum, [w, baseH, d], [0, baseH / 2, 0]);
  g.add(base);

  // Keyboard area (inset dark rectangle)
  g.add(makeBox(dark, [w * 0.88, 0.002, d * 0.42], [0, baseH + 0.001, -d * 0.08]));

  // Keys (simplified as thin dark strips)
  for (let row = 0; row < 5; row++) {
    g.add(makeBox(keyMat, [w * 0.82, 0.003, 0.018], [0, baseH + 0.002, -d * 0.18 + row * 0.022]));
  }

  // Trackpad
  g.add(makeBox(aluminum, [w * 0.28, 0.002, d * 0.22], [0, baseH + 0.001, d * 0.22]));

  // Lid (screen assembly) — open at ~125° (laptop-in-use pose)
  const lidGroup = new THREE.Group();
  lidGroup.position.set(0, baseH, -d / 2);
  lidGroup.rotation.x = -Math.PI / 2 - 0.55; // ~125° open, tilted away from user

  // Lid back (aluminum)
  lidGroup.add(makeBox(aluminum, [w, lidH, d], [0, lidH / 2, d / 2]));
  // Screen bezel (black)
  lidGroup.add(makeBox(dark, [w * 0.96, 0.002, d * 0.92], [0, -0.001, d / 2]));
  // Screen glow (brighter, in-use)
  lidGroup.add(makeBox(screenGlow, [w * 0.9, 0.001, d * 0.85], [0, -0.002, d / 2]));

  g.add(lidGroup);

  // Keyboard backlight (subtle cyan glow under keys)
  g.add(makeBox(new THREE.MeshBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.06 }), [w * 0.82, 0.001, d * 0.38], [0, baseH + 0.003, -d * 0.08]));

  // Desk reflection light from screen
  g.add(makeBox(new THREE.MeshBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.12 }), [w, 0.001, d * 0.6], [0, 0.001, d * 0.15]));

  return { mesh: g, type: 'terminal', panelId: 'panel-alphgpt', label: 'MACBOOK', room: 'APT' };
}

register('macBook', buildMacBook);
