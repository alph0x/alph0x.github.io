/**
 * @fileoverview Atmosphere — room-scale fog, a fake-volumetric light shaft under
 * each window, and dust motes drifting inside it. Built once at level build; the
 * per-frame mote drift lives in systems/animation/dust.ts.
 */

import * as THREE from 'three';
import { ROOM_LAYOUT } from '../core.js';
import { makeTexture, rng } from '../assets/textures.js';
import { getInteriorOffset } from '../furniture/builders/wall-offset.js';
import { registerDust } from '../systems/animation/dust.js';
import type { TimeOfDayPreset } from './lighting.js';

const SHAFT_LEN = 2.0;
const DUST_COUNT = 200;

/** Soft radial sprite for a single dust mote. */
function moteTexture(): THREE.CanvasTexture {
  const tex = makeTexture(16, 16, (ctx, w, h) => {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const d = Math.hypot(x - (w - 1) / 2, y - (h - 1) / 2) / (w / 2);
        const a = Math.max(0, 1 - d);
        ctx.fillStyle = `rgba(255,255,255,${(a * a).toFixed(3)})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }, 'dust-mote');
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  return tex;
}

function buildWindowShaft(scene: THREE.Scene, position: number[], preset: TimeOfDayPreset): void {
  const [wx, wy, wz] = position as [number, number, number];
  // Inward wall normal via the wall-offset helper (its offset points inward).
  const off = getInteriorOffset(wx, wz, 1);
  const inv = 1 / (Math.hypot(off.x, off.z) || 1);
  const nx = off.x * inv;
  const nz = off.z * inv;
  // Match the window spotlight direction, tilted steeper so the shaft pools on
  // the floor ahead of the window instead of reaching the spawn camera.
  const dir = new THREE.Vector3(nx * 1.4, -1.0, nz * 1.4).normalize();
  const hinge = new THREE.Vector3(wx + nx * 0.2, wy + 0.25, wz + nz * 0.2);

  // Open square frustum, hinged at the window and widening toward the floor.
  // Fresnel-faded additive shader → soft silhouette from every viewing angle.
  const geo = new THREE.CylinderGeometry(0.9, 1.35, SHAFT_LEN, 4, 1, true);
  geo.rotateY(Math.PI / 4); // flat faces toward the room axes
  geo.translate(0, -SHAFT_LEN / 2, 0); // hinge the top edge at the window
  const shaft = new THREE.Mesh(geo, new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(preset.windowGlow.color) },
      uOpacity: { value: 0.6 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vNormalW;
      varying vec3 vViewW;
      varying float vAlong;
      void main() {
        vAlong = -position.y / ${SHAFT_LEN.toFixed(1)};
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vNormalW = normalize(mat3(modelMatrix) * normal);
        vViewW = cameraPosition - wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying vec3 vNormalW;
      varying vec3 vViewW;
      varying float vAlong;
      void main() {
        float v = clamp(vAlong, 0.0, 1.0);
        float ramp = min(1.0, v / 0.06); // soft hinge at the window
        float along = v < 0.45 ? 0.55 : 0.55 * (1.0 - (v - 0.45) / 0.55);
        float fresnel = pow(abs(dot(normalize(vNormalW), normalize(vViewW))), 1.5);
        float a = along * ramp * fresnel * uOpacity;
        gl_FragColor = vec4(uColor * a, a);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  }));
  shaft.position.copy(hinge);
  shaft.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir);
  shaft.renderOrder = 5;
  scene.add(shaft);

  // Dust motes, deterministic placement inside the shaft volume.
  const rand = rng(98765);
  const base = new Float32Array(DUST_COUNT * 3);
  const phase = new Float32Array(DUST_COUNT);
  const side = new THREE.Vector3(-nz, 0, nx);
  const p = new THREE.Vector3();
  for (let i = 0; i < DUST_COUNT; i++) {
    const t = 0.15 + rand() * (SHAFT_LEN - 0.45);
    p.copy(hinge)
      .addScaledVector(dir, t)
      .addScaledVector(side, (rand() * 2 - 1) * 0.75);
    p.y += (rand() * 2 - 1) * (0.25 + t * 0.22);
    p.y = Math.min(Math.max(p.y, 0.15), 2.45);
    base[i * 3] = p.x;
    base[i * 3 + 1] = p.y;
    base[i * 3 + 2] = p.z;
    phase[i] = rand() * Math.PI * 2;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(base.slice(), 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
    color: preset.windowGlow.color,
    size: 0.03,
    map: moteTexture(),
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
    fog: false,
  }));
  dust.userData._base = base;
  dust.userData._phase = phase;
  dust.renderOrder = 6;
  registerDust(dust);
  scene.add(dust);
}

export function setupAtmosphere(scene: THREE.Scene, preset: TimeOfDayPreset): void {
  // Fog tinted toward the dusk fill; near plane beyond the room diagonal so the
  // interior stays clear and the haze reads through the window over the city.
  const fogColor = new THREE.Color(0x1a1a2e).lerp(new THREE.Color(preset.fill.color), 0.45);
  scene.fog = new THREE.Fog(fogColor, 7, 42);

  for (const f of ROOM_LAYOUT.furniture || []) {
    if (f.type === 'window') buildWindowShaft(scene, f.position as number[], preset);
  }
}
