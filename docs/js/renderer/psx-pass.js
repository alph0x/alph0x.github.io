import * as THREE from 'three';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

/**
 * PSX-style post-processing shader.
 * Very subtle — the low-res render target + NearestFilter already give the retro look.
 * Only adds a tiny bit of Bayer dithering.
 */
const PSXShader = {
  uniforms: {
    tDiffuse: { value: null },
    uResolution: { value: new THREE.Vector2(1, 1) },
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
    uniform vec2 uResolution;
    varying vec2 vUv;

    // 4x4 Bayer ordered dither matrix (0..15) scaled to -0.5..0.5
    float bayer(vec2 coord) {
      ivec2 c = ivec2(mod(coord, 4.0));
      int idx = c.x + c.y * 4;
      float val = 0.0;
      if (idx == 0)  val = 0.0;
      if (idx == 1)  val = 8.0;
      if (idx == 2)  val = 2.0;
      if (idx == 3)  val = 10.0;
      if (idx == 4)  val = 12.0;
      if (idx == 5)  val = 4.0;
      if (idx == 6)  val = 14.0;
      if (idx == 7)  val = 6.0;
      if (idx == 8)  val = 3.0;
      if (idx == 9)  val = 11.0;
      if (idx == 10) val = 1.0;
      if (idx == 11) val = 9.0;
      if (idx == 12) val = 15.0;
      if (idx == 13) val = 7.0;
      if (idx == 14) val = 13.0;
      if (idx == 15) val = 5.0;
      return (val / 16.0) - 0.5;
    }

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);

      // Extremely subtle dithering — adds texture without darkening
      color.rgb += bayer(gl_FragCoord.xy) * 0.003;

      gl_FragColor = color;
    }
  `,
};

export function createPSXPass() {
  const pass = new ShaderPass(PSXShader);
  return pass;
}
