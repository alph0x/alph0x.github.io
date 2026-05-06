import { buildNeonSign } from './neon-sign.js';
import { buildPoster } from './poster.js';
import { buildSteam } from './steam.js';
import { placeFairyLights } from './fairy-lights.js';
import { makeLight } from '../../primitives.js';

export function placeDecorations(scene, state, decorations) {
  for (const dec of decorations) {
    if (dec.type === 'neonSign') {
      const mesh = buildNeonSign(dec); mesh.position.set(...dec.position); scene.add(mesh); scene.add(makeLight(dec.color, 0.8, 5, dec.position));
    } else if (dec.type === 'poster') {
      const mesh = buildPoster(dec); mesh.position.set(...dec.position); scene.add(mesh);
    } else if (dec.type === 'steam') {
      const mesh = buildSteam(dec); scene.add(mesh);
      state.particles.push({ mesh, vx: (Math.random() - 0.5) * 0.01, vy: 0.015 + Math.random() * 0.01, vz: (Math.random() - 0.5) * 0.01, life: 1.0, isSteam: true });
    } else if (dec.type === 'fairyLights') {
      placeFairyLights(scene, dec);
    }
  }
}
