// Parametric model of the failed part: a long-radius 90° elbow (NPS 8, Sch 40)
// welded between two straight pipe stubs, split lengthwise into a front and a
// back half so the wall can be shown in cross-section.
//
// Units: 1 = the pipe's outer radius (8.625 in / 2). The wall is drawn WALL_X
// times thicker than life so it is readable on screen; every thickness keeps its
// true ratio to the others (the elbow thins from 0.322 in to 0.011 in while the
// pipes beside it only lose ~0.02 in).
import * as THREE from 'three'
import { C } from '../lib/data.js'

export const R_OUT_IN = 8.625 / 2
export const WALL_X = 3
export const BEND_R = 12 / R_OUT_IN // long radius = 1.5 × NPS
export const PIPE_L = 2.6
const ELBOW_LEN = (BEND_R * Math.PI) / 2
const TOTAL = PIPE_L * 2 + ELBOW_LEN
const ADJ_2019 = (C.adj[0] + C.adj[1]) / 2
const NT = 34 // segments around each half
const WELDS = [PIPE_L, PIPE_L + ELBOW_LEN]

/** Where the wall ends up thinnest: middle of the bend, on the outside of the curve. */
const HOT_PHI = Math.PI / 4

function stations() {
  const s = []
  for (let i = 0; i <= 110; i++) s.push((i / 110) * TOTAL)
  for (const w of WELDS) for (let k = -9; k <= 9; k++) s.push(w + k * 0.016)
  s.sort((a, b) => a - b)
  const out = [s[0]]
  for (const v of s) if (v - out[out.length - 1] > 0.004) out.push(v)
  return out
}

function frame(s) {
  if (s < PIPE_L) return { c: [BEND_R, s - PIPE_L, 0], n: [1, 0, 0], t: [0, 1, 0], zone: 0, phi: 0 }
  if (s <= PIPE_L + ELBOW_LEN) {
    const phi = (s - PIPE_L) / BEND_R
    const cp = Math.cos(phi), sp = Math.sin(phi)
    return { c: [BEND_R * cp, BEND_R * sp, 0], n: [cp, sp, 0], t: [-sp, cp, 0], zone: 1, phi }
  }
  const d = s - PIPE_L - ELBOW_LEN
  return { c: [-d, BEND_R, 0], n: [0, 1, 0], t: [-1, 0, 0], zone: 2, phi: Math.PI / 2 }
}

const weldBump = (s) => WELDS.reduce((a, w) => a + 0.075 * Math.exp(-(((s - w) / 0.05) ** 2)), 0)
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a))

/** Relative local corrosion (0..1) — general thinning everywhere on the elbow plus a hot spot. */
function gRaw(phi, th) {
  const dphi = phi - HOT_PHI
  const dth = wrap(th)
  const spot = Math.exp(-((dphi * dphi) / (2 * 0.34 * 0.34) + (dth * dth) / (2 * 0.8 * 0.8)))
  const n = Math.sin(9.3 * phi + 3 * th + 1.3) * Math.sin(6.1 * phi - 5 * th) * 0.5 + Math.sin(17 * phi + 7 * th) * 0.25
  return 0.6 + 0.4 * spot + 0.05 * n
}
const pipeNoise = (s, th) => 0.88 + 0.12 * (0.5 + 0.5 * Math.sin(3.1 * s + 2 * th) * Math.cos(1.7 * s - 3 * th))

/** Wall thickness (inches, real) at fraction f of the 1973→2019 service life. */
function tInches(zone, g, f) {
  return zone === 1 ? C.t0 - (C.t0 - C.tmin) * f * g : C.t0 - (C.t0 - ADJ_2019) * f * g
}

const COLS = {
  outerPipe: new THREE.Color('#8f959d'),
  outerElbow: new THREE.Color('#9d968c'),
  inner: new THREE.Color('#3b342e'),
  cut: new THREE.Color('#b9bcbd'),
}

function buildHalf(th0, th1, S, frames, gmax) {
  const P = [], N = [], Col = [], Heat = [], Hot = [], Cut = [], I = []
  // per-vertex data needed to recompute the inner radius every year
  const dyn = { cx: [], cy: [], cz: [], ux: [], uy: [], uz: [], rOut: [], g: [], zone: [], inner: [], heat: [] }
  const thetas = Array.from({ length: NT + 1 }, (_, j) => th0 + ((th1 - th0) * j) / NT)
  const hotC = frame(PIPE_L + HOT_PHI * BEND_R)

  const radial = (fr, th) => {
    const ct = Math.cos(th), st = Math.sin(th)
    return [ct * fr.n[0], ct * fr.n[1], ct * fr.n[2] + st]
  }
  const tangW = (fr, th) => {
    const ct = Math.cos(th), st = Math.sin(th)
    return [-st * fr.n[0], -st * fr.n[1], -st * fr.n[2] + ct]
  }
  const gOf = (i, th) => {
    const fr = frames[i]
    return fr.zone === 1 ? Math.min(1, gRaw(fr.phi, th) / gmax) : pipeNoise(S[i], th)
  }
  const add = (i, th, inner, nrm, col, showHeat, cut = 0) => {
    Cut.push(cut)
    const fr = frames[i]
    const u = radial(fr, th)
    const rOut = 1 + weldBump(S[i])
    dyn.cx.push(fr.c[0]); dyn.cy.push(fr.c[1]); dyn.cz.push(fr.c[2])
    dyn.ux.push(u[0]); dyn.uy.push(u[1]); dyn.uz.push(u[2])
    dyn.rOut.push(rOut); dyn.g.push(gOf(i, th)); dyn.zone.push(fr.zone)
    dyn.inner.push(inner ? 1 : 0); dyn.heat.push(showHeat ? 1 : 0)
    P.push(fr.c[0] + u[0] * rOut, fr.c[1] + u[1] * rOut, fr.c[2] + u[2] * rOut)
    N.push(nrm[0], nrm[1], nrm[2])
    Col.push(col.r, col.g, col.b)
    Heat.push(0)
    // proximity to the hot spot on the outside skin (for the crack glow before rupture)
    const p = [fr.c[0] + u[0], fr.c[1] + u[1], fr.c[2] + u[2]]
    const hp = [hotC.c[0] + hotC.n[0], hotC.c[1] + hotC.n[1], 0]
    const d2 = (p[0] - hp[0]) ** 2 + (p[1] - hp[1]) ** 2 + (p[2] - hp[2]) ** 2
    Hot.push(inner ? 0 : Math.exp(-d2 / 0.18))
    return P.length / 3 - 1
  }
  const R = S.length
  const W = NT + 1

  // outer skin
  let base = P.length / 3
  for (let i = 0; i < R; i++) for (const th of thetas) add(i, th, false, radial(frames[i], th), frames[i].zone === 1 ? COLS.outerElbow : COLS.outerPipe, false)
  for (let i = 0; i < R - 1; i++) for (let j = 0; j < NT; j++) {
    const a = base + i * W + j, b = a + 1, c = a + W, d = c + 1
    I.push(a, c, b, b, c, d)
  }
  // inner skin (faces the pipe axis)
  base = P.length / 3
  for (let i = 0; i < R; i++) for (const th of thetas) { const u = radial(frames[i], th); add(i, th, true, [-u[0], -u[1], -u[2]], COLS.inner, true) }
  for (let i = 0; i < R - 1; i++) for (let j = 0; j < NT; j++) {
    const a = base + i * W + j, b = a + 1, c = a + W, d = c + 1
    I.push(a, b, c, b, d, c)
  }
  // the two lengthwise cut faces — this is where the wall thickness shows
  for (const [th, sign] of [[th0, -1], [th1, 1]]) {
    const outs = [], ins = []
    for (let i = 0; i < R; i++) {
      const w = tangW(frames[i], th)
      const nrm = [w[0] * sign, w[1] * sign, w[2] * sign]
      outs.push(add(i, th, false, nrm, COLS.cut, true, 1))
      ins.push(add(i, th, true, nrm, COLS.cut, true, 1))
    }
    for (let i = 0; i < R - 1; i++) {
      const A = outs[i], B = outs[i + 1], Cc = ins[i + 1], D = ins[i]
      if (sign > 0) I.push(A, B, D, B, Cc, D)
      else I.push(A, D, B, B, D, Cc)
    }
  }
  // end caps (half annulus at each cut end of the specimen)
  for (const [i, sign] of [[0, -1], [R - 1, 1]]) {
    const t = frames[i].t
    const nrm = [t[0] * sign, t[1] * sign, t[2] * sign]
    const outs = [], ins = []
    for (const th of thetas) { outs.push(add(i, th, false, nrm, COLS.cut, true, 1)); ins.push(add(i, th, true, nrm, COLS.cut, true, 1)) }
    for (let j = 0; j < NT; j++) {
      const A = outs[j], B = outs[j + 1], Cc = ins[j + 1], D = ins[j]
      if (sign < 0) I.push(A, B, D, B, Cc, D)
      else I.push(A, D, B, B, D, Cc)
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3))
  geo.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(N), 3))
  geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(Col), 3))
  geo.setAttribute('aHeat', new THREE.BufferAttribute(new Float32Array(Heat), 1))
  geo.setAttribute('aHot', new THREE.BufferAttribute(new Float32Array(Hot), 1))
  geo.setAttribute('aCut', new THREE.BufferAttribute(new Float32Array(Cut), 1))
  geo.setIndex(I)
  const typed = {}
  for (const k in dyn) typed[k] = Float32Array.from(dyn[k])
  return { geo, dyn: typed }
}

/** Build both halves; `setYear(y)` moves the inner wall to where corrosion had taken it. */
export function createElbow() {
  const S = stations()
  const frames = S.map(frame)
  let gmax = 0
  for (let k = 0; k <= 400; k++) {
    const phi = (k / 400) * (Math.PI / 2)
    for (let j = 0; j < 90; j++) gmax = Math.max(gmax, gRaw(phi, (j / 90) * Math.PI * 2))
  }
  const front = buildHalf(0, Math.PI, S, frames, gmax)
  const back = buildHalf(Math.PI, Math.PI * 2, S, frames, gmax)
  const scale = WALL_X / R_OUT_IN

  front.last = -1
  back.last = -1
  /** Move the inner wall to `year`. The front half can be skipped while it is lifted out of view. */
  function setYear(year, withFront = true) {
    const f = Math.min(1, Math.max(0, (year - C.install) / (C.fail - C.install)))
    for (const half of withFront ? [front, back] : [back]) {
      if (Math.abs(f - half.last) < 1e-4) continue
      half.last = f
      const { dyn, geo } = half
      const pos = geo.attributes.position.array
      const heat = geo.attributes.aHeat.array
      const n = dyn.cx.length
      for (let v = 0; v < n; v++) {
        const t = tInches(dyn.zone[v], dyn.g[v], f)
        if (dyn.inner[v]) {
          const r = 1 - t * scale
          pos[v * 3] = dyn.cx[v] + dyn.ux[v] * r
          pos[v * 3 + 1] = dyn.cy[v] + dyn.uy[v] * r
          pos[v * 3 + 2] = dyn.cz[v] + dyn.uz[v] * r
        }
        heat[v] = dyn.heat[v] ? (C.t0 - t) / (C.t0 - C.tmin) : 0
      }
      geo.attributes.position.needsUpdate = true
      geo.attributes.aHeat.needsUpdate = true
    }
  }
  setYear(C.install)

  const hf = frame(PIPE_L + HOT_PHI * BEND_R)
  const hot = new THREE.Vector3(hf.c[0] + hf.n[0], hf.c[1] + hf.n[1], 0)
  const hotN = new THREE.Vector3(hf.n[0], hf.n[1], 0)
  // points the HUD labels hang from (outer skin, front side)
  // weldA (extrados) frames the close-up; the labels hang off the intrados cut edge,
  // which faces the empty inside corner of the L
  const weldA = new THREE.Vector3(BEND_R + 1, 0, 0)
  const weldIn = new THREE.Vector3(BEND_R - 1, 0, 0)
  const pipeA = new THREE.Vector3(BEND_R - 1, -PIPE_L * 0.5, 0)
  const center = new THREE.Vector3((BEND_R - PIPE_L) / 2 + 0.6, (BEND_R - PIPE_L) / 2 + 0.6, 0)
  return { front: front.geo, back: back.geo, setYear, hot, hotN, pipeA, weldA, weldIn, center }
}
