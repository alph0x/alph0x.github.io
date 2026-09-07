import * as THREE from 'three';
import { rootGroup } from '../../primitives.js';
import { register } from '../registry.js';
import { makeStd } from '../../assets/index.js';
import type { FurnitureConfig } from '../../seed.js';

function buildMug(cfg: FurnitureConfig): { mesh: THREE.Group } {
  const g = rootGroup(cfg);
  const mugMat = makeStd({ color: 0x887766, roughness: 0.32, flatShading: false });
  mugMat.flatShading = false;
  // Closed ceramic cross-section: solid foot, recessed interior, rounded lip.
  const profile = [[0, -.025], [.022, -.025], [.027, -.022], [.029, -.016],
    [.030, .021], [.0295, .024], [.028, .025], [.0265, .024],
    [.026, .021], [.025, -.016], [.021, -.020], [0, -.020]];
  const cup = new THREE.Mesh(new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), 40), mugMat);
  cup.name = 'ceramic-cup'; cup.castShadow = cup.receiveShadow = true;
  g.add(cup);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(.015, .0035, 10, 32), mugMat);
  handle.scale.x = .8;
  handle.position.set(.035, .003, 0);
  handle.castShadow = true;
  g.add(handle);
  const drink = new THREE.Mesh(new THREE.CircleGeometry(.0258, 40), makeStd({ color: 0x392116, roughness: .22, flatShading: false }));
  drink.rotation.x = -Math.PI / 2;
  drink.position.y = .017;
  g.add(drink);
  return { mesh: g };
}
register('mug', buildMug);
