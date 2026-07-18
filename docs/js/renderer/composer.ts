/**
 * @fileoverview EffectComposer pipeline: RenderPass → bloom → SSAO → output → grade.
 * Low-end devices bypass the composer entirely (plain renderer.render).
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

export type GradedComposer = EffectComposer & { gradePass: ShaderPass };

// ponytail: same device heuristic as ScreenReflections — one definition, imported there later if VR-05 wants it
export function isLowEndDevice(): boolean {
  return (
    window.matchMedia('(max-width: 768px)').matches ||
    ('ontouchstart' in window && navigator.maxTouchPoints > 0)
  );
}

// Final grade: teal shadows / warm highlights + vignette + film grain, in display space.
const GradeShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    time: { value: 0 },
    vignetteStrength: { value: 0.42 },
    grainStrength: { value: typeof window !== 'undefined' && (window as unknown as { __snapshotMode?: boolean }).__snapshotMode ? 0 : 0.035 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float time;
    uniform float vignetteStrength;
    uniform float grainStrength;
    varying vec2 vUv;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7)) + time * 61.7) * 43758.5453);
    }

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      float lum = dot(color.rgb, vec3(0.299, 0.587, 0.114));

      // teal shadows / warm highlights split-tone
      vec3 shadowTint = vec3(0.96, 1.02, 1.06);
      vec3 highlightTint = vec3(1.06, 1.01, 0.95);
      color.rgb *= mix(shadowTint, highlightTint, smoothstep(0.12, 0.72, lum));

      // vignette
      float d = distance(vUv, vec2(0.5));
      color.rgb *= 1.0 - vignetteStrength * smoothstep(0.32, 0.82, d);

      // animated film grain
      color.rgb += (hash(vUv * 1024.0) - 0.5) * grainStrength;

      gl_FragColor = color;
    }
  `,
};

export function buildComposer(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
): GradedComposer {
  const size = renderer.getSize(new THREE.Vector2());
  const composer = new EffectComposer(renderer) as GradedComposer;

  composer.addPass(new RenderPass(scene, camera));

  // Threshold-driven bloom; VR-03's emissive materials will feed it.
  const bloom = new UnrealBloomPass(new THREE.Vector2(size.x, size.y), 0.4, 0.3, 0.85);
  composer.addPass(bloom);

  const ssao = new SSAOPass(scene, camera, size.x, size.y);
  ssao.kernelRadius = 4; // small radius: contact shading, not mud
  composer.addPass(ssao);

  // Tone mapping (ACES, exposure from renderer) + linear→sRGB, then grade in display space.
  composer.addPass(new OutputPass());

  const gradePass = new ShaderPass(GradeShader);
  composer.addPass(gradePass);
  composer.gradePass = gradePass;

  return composer;
}
