import * as THREE from 'three';
import { COLORS } from '../../core.js';
import { register } from '../registry.js';
import { M } from '../../assets/index.js';
import { makeBox, makeLight } from '../../primitives.js';
import type { FurnitureConfig } from '../../seed.js';

function buildTerminal(cfg: FurnitureConfig): { mesh: THREE.Group; type: string; panelId?: string; label: string; room: string } {
  const [x, y, z] = cfg.position;
  const group = new THREE.Group();
  group.position.set(x, y, z);
  const colorKey = cfg.color as unknown as string;
  const screenMat = colorKey === 'yellow' ? M.terminal : colorKey === 'pink' ? M.terminalPink : colorKey === 'cyan' ? M.terminalCyan : M.terminalGreen;
  // Desktop monitor proportions (~27")
  const w = 0.65, h = 0.42, d = 0.04;
  group.add(makeBox(screenMat, [w, h, d], [0, 0, 0]));
  const frameMat = new THREE.MeshBasicMaterial({ color: 0x1a1a1e });
  group.add(makeBox(frameMat, [w + 0.02, 0.015, d + 0.01], [0, h / 2 + 0.008, 0]));
  group.add(makeBox(frameMat, [w + 0.02, 0.015, d + 0.01], [0, -(h / 2 + 0.008), 0]));
  group.add(makeBox(frameMat, [0.015, h + 0.02, d + 0.01], [-(w / 2 + 0.008), 0, 0]));
  group.add(makeBox(frameMat, [0.015, h + 0.02, d + 0.01], [w / 2 + 0.008, 0, 0]));
  // Stand
  group.add(makeBox(frameMat, [0.06, 0.12, 0.04], [0, -(h / 2 + 0.07), -0.02]));
  group.add(makeBox(frameMat, [0.2, 0.01, 0.1], [0, -(h / 2 + 0.13), -0.02]));
  const lightColor = colorKey === 'yellow' ? COLORS.accent : colorKey === 'pink' ? COLORS.magenta : colorKey === 'cyan' ? COLORS.cyan : COLORS.green;
  group.add(makeLight(lightColor, 0.6, 3, [0, 0, 0.15]));
  return { mesh: group, type: 'terminal', panelId: cfg.panelId, label: 'TERMINAL', room: 'APT' };
}
register('terminal', buildTerminal);
