import * as THREE from 'three';
import { register } from '../registry.js';
import { M, makeStd } from '../../assets/index.js';
import { makeBox, makeCylinder, makeRoundedBox } from '../../primitives.js';

function buildDesk(cfg) {
  const g = new THREE.Group(); g.position.set(...cfg.position); g.rotation.y = cfg.rotation;

  const metal = makeStd({ color: 0x4a4a55, roughness: 0.4, metalness: 0.6 });
  const woodDark = makeStd({ color: 0x3a2a20, roughness: 0.85 });
  const led = M.glowCyan;

  // tabletop with edge thickness
  g.add(makeRoundedBox(M.wood, [1.8, 0.06, 0.9], [0, 0.8, 0], 0.03, 2));
  g.add(makeBox(woodDark, [1.78, 0.02, 0.88], [0, 0.77, 0]));

  // tapered metal legs with feet
  for (const lx of [-0.8, 0.8]) {
    g.add(makeCylinder(metal, [0.03, 0.02, 0.78], [lx, 0.39, 0], 8));
    g.add(makeBox(metal, [0.2, 0.04, 0.4], [lx, 0.02, 0]));
  }
  // back crossbar
  g.add(makeBox(metal, [1.6, 0.04, 0.04], [0, 0.3, -0.4]));

  // drawer block
  g.add(makeRoundedBox(M.wood, [0.5, 0.4, 0.8], [0.5, 0.6, 0], 0.03, 2));
  // drawer front gap
  g.add(makeBox(woodDark, [0.44, 0.12, 0.02], [0.5, 0.62, 0.41]));
  // drawer handle
  g.add(makeBox(makeStd({ color: 0x888899, roughness: 0.3, metalness: 0.7 }), [0.12, 0.02, 0.02], [0.5, 0.62, 0.43]));

  // LED strip glow under back edge
  g.add(makeBox(led, [1.5, 0.02, 0.04], [0, 0.74, -0.4]));
  // keyboard mat
  g.add(makeBox(makeStd({ color: 0x2a2a30, roughness: 0.8 }), [0.6, 0.03, 0.2], [-0.2, 0.84, 0.15]));

  return { mesh: g };
}
register('desk', buildDesk);
