// Shader pieces for the elbow (heat map on the corroded wall) and the particles.
import * as THREE from 'three'

/**
 * MeshStandardMaterial + two per-vertex channels:
 *  aHeat 0..1 — how much of the original wall is gone (≥0.46 means thinner than
 *               the 0.180 in retirement limit) → amber → ember → white-hot
 *  aHot  0..1 — closeness to the failure point on the outside skin (crack glow)
 */
export function makeElbowMaterial() {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0.78, roughness: 0.38, envMapIntensity: 1.15 })
  const u = { uHeatGain: { value: 1.3 }, uCrack: { value: 0 } }
  m.userData.u = u
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u)
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aHeat;\nattribute float aHot;\nattribute float aCut;\nvarying float vHeat;\nvarying float vHot;\nvarying float vCut;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvHeat = aHeat;\nvHot = aHot;\nvCut = aCut;')
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
uniform float uHeatGain;
uniform float uCrack;
varying float vHeat;
varying float vHot;
varying float vCut;
vec3 heatRamp(float h) {
  vec3 a = vec3(0.91, 0.62, 0.22);
  vec3 b = vec3(1.0, 0.30, 0.08);
  vec3 c = vec3(1.0, 0.85, 0.66);
  return h < 0.82 ? mix(a, b, smoothstep(0.45, 0.82, h)) : mix(b, c, smoothstep(0.82, 1.0, h));
}`)
      .replace('#include <color_fragment>', `#include <color_fragment>
// the cut faces carry the full heat map; the inner skin only hints at it
float hm = smoothstep(0.30, 1.0, vHeat) * mix(0.1, 0.9, vCut);
diffuseColor.rgb = mix(diffuseColor.rgb, heatRamp(vHeat) * 0.5, hm);`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
roughnessFactor = mix(roughnessFactor, 0.8, smoothstep(0.3, 1.0, vHeat));`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
totalEmissiveRadiance += heatRamp(vHeat) * pow(smoothstep(mix(0.8, 0.42, vCut), 1.0, vHeat), 1.5) * uHeatGain * mix(0.35, 1.0, vCut);
totalEmissiveRadiance += vec3(1.0, 0.40, 0.10) * pow(vHot, 2.0) * uCrack;`)
  }
  return m
}

/** Release jet: scroll-scrubbed, so every particle's path is a pure function of uT. */
export function makeBurstMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uT: { value: 0 }, uIgnite: { value: 0 }, uPixel: { value: 600 }, uMaxPx: { value: 120 }, uFade: { value: 1 } },
    vertexShader: /* glsl */ `
      uniform float uT; uniform float uPixel; uniform float uIgnite; uniform float uMaxPx;
      attribute vec3 aDir; attribute float aSpeed; attribute float aSeed; attribute float aSize; attribute float aKind;
      varying float vA; varying float vKind; varying float vAge; varying float vSeed;
      void main() {
        float start = fract(aSeed * 3.71) * 0.38;
        float a = clamp((uT - start) / (1.0 - start), 0.0, 1.0);
        float k = 3.4;
        float dist = aSpeed * (1.0 - exp(-k * a)) / (1.0 - exp(-k));
        // after ignition the cloud balloons into a fireball
        vec3 p = position + aDir * dist * (6.5 + uIgnite * 3.5 * (1.0 - aKind));
        float wob = (aKind < 0.5 ? 0.55 : 0.25) * a;
        p += vec3(sin(a * 6.0 + aSeed * 40.0), cos(a * 5.0 + aSeed * 31.0), sin(a * 4.0 + aSeed * 17.0)) * wob;
        p.y += a * a * (aKind < 0.5 ? 2.2 : 0.6) * (1.0 + uIgnite);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        float grow = aKind < 0.5 ? mix(0.6, 3.6 + uIgnite * 1.6, a) : mix(1.2, 0.35, a);
        // capped size keeps the overdraw (and the GPU bill) bounded; unborn particles are skipped
        gl_PointSize = a <= 0.0 ? 0.0 : min(aSize * grow * uPixel / -mv.z, uMaxPx);
        vA = step(0.0001, a) * smoothstep(0.0, 0.06, a) * (1.0 - smoothstep(0.55, 1.0, a));
        vKind = aKind; vAge = a; vSeed = aSeed;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uIgnite; uniform float uFade;
      varying float vA; varying float vKind; varying float vAge; varying float vSeed;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        float soft = smoothstep(0.5, 0.0, d);
        vec3 cold = vec3(0.62, 0.70, 0.76);
        vec3 fire = mix(vec3(1.0, 0.48, 0.14), vec3(0.75, 0.12, 0.03), smoothstep(0.1, 0.9, vAge));
        vec3 col; float alpha;
        if (vKind < 0.5) {
          col = mix(cold, fire * 1.15, uIgnite);
          alpha = soft * soft * mix(0.06, 0.05, uIgnite);
        } else {
          col = vec3(1.0, 0.58, 0.24) * 2.2;
          alpha = soft * 0.95;
        }
        gl_FragColor = vec4(col, alpha * vA * uFade);
      }`,
  })
}

/** Slow ember dust that fills the void around the model. */
export function makeDustMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uPixel: { value: 600 }, uAmt: { value: 1 } },
    vertexShader: /* glsl */ `
      uniform float uTime; uniform float uPixel;
      attribute float aSeed; attribute float aSize;
      varying float vA;
      void main() {
        vec3 p = position;
        p.y = mod(p.y + uTime * (0.10 + aSeed * 0.22) + 7.0, 14.0) - 7.0;
        p.x += sin(uTime * 0.3 + aSeed * 20.0) * 0.45;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = aSize * uPixel / -mv.z;
        vA = 0.35 + 0.65 * abs(sin(uTime * (0.5 + aSeed) + aSeed * 30.0));
      }`,
    fragmentShader: /* glsl */ `
      uniform float uAmt;
      varying float vA;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d);
        gl_FragColor = vec4(vec3(1.0, 0.52, 0.22) * 1.5, a * a * vA * uAmt);
      }`,
  })
}

/** Big soft glow plane behind the model; brightens when the fire starts. */
export function makeBackdropMaterial() {
  return new THREE.ShaderMaterial({
    depthWrite: false,
    uniforms: { uGlow: { value: 0.35 }, uFire: { value: 0 } },
    vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform float uGlow; uniform float uFire; varying vec2 vUv;
      void main() {
        // the camera only ever sees the middle ~quarter of this plane
        float r = length((vUv - vec2(0.52, 0.53)) * vec2(1.5, 1.0));
        float g = exp(-r * r * 160.0);
        // colours are authored in sRGB and converted, because the composer works in linear
        vec3 base = pow(vec3(0.043, 0.039, 0.035), vec3(2.2));
        vec3 warm = pow(mix(vec3(0.20, 0.09, 0.05), vec3(0.42, 0.11, 0.03), uFire), vec3(2.2));
        gl_FragColor = vec4(base + warm * g * (uGlow + uFire * 0.9), 1.0);
      }`,
  })
}
