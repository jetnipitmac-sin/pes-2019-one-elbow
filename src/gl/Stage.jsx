// The fixed WebGL stage. One "director" useFrame reads the scroll progress in
// `stage` and poses the camera, the two elbow halves, the release jet and the
// lights. Nothing here re-renders React while scrolling.
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer, PerformanceMonitor } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette, ToneMapping, SMAA } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { createElbow } from './elbowGeometry.js'
import { makeElbowMaterial, makeBurstMaterial, makeDustMaterial, makeBackdropMaterial } from './materials.js'
import { stage, seg, smooth } from '../lib/scroll.js'
import { glStore, useStore } from '../lib/store.js'
import { C } from '../lib/data.js'

// ------------------------------------------------------------------ choreography
// t = hero + manifesto + anatomy + rupture (each 0..1, in scroll order) → 0..4
const HOT = 'HOT'
const KEYS = [
  { t: 0.0, cam: [0.4, 0.6, 12.5], look: [-1.6, 0.35, 0], rot: [-0.45, 0.72, 0.62], gpos: [1.2, 0.85, 0], explode: 0 },
  { t: 1.0, cam: [0.0, 0.4, 15.5], look: [0, 0, 0], rot: [-0.25, -0.75, 0.35], gpos: [4.3, -0.2, -2.5], explode: 0 },
  { t: 1.7, cam: [0.0, 0.4, 15.5], look: [0, 0, 0], rot: [-0.2, -0.35, 0.3], gpos: [4.3, -0.2, -2.5], explode: 0 },
  { t: 2.0, cam: [-0.2, 0.1, 13.2], look: [-0.2, 0.1, 0], rot: [-0.06, 0.16, 0], gpos: [0.15, -0.15, 0], explode: 1 },
  { t: 2.4, cam: [-0.1, 0.2, 12.0], look: [-0.1, 0.2, 0], rot: [-0.06, 0.16, 0], gpos: [0.15, -0.15, 0], explode: 1 },
  { t: 2.88, cam: [0.2, -0.1, 4.8], look: HOT, off: [-0.75, 0, 0], rot: [-0.06, 0.16, 0], gpos: [0.15, -0.15, 0], explode: 1 },
  { t: 3.0, cam: [0.2, -0.1, 4.8], look: HOT, off: [-0.75, 0, 0], rot: [-0.06, 0.16, 0], gpos: [0.15, -0.15, 0], explode: 1 },
  { t: 3.22, cam: [1.5, 0.5, 10.2], look: [1.2, 0.6, 0], rot: [-0.24, 0.38, 0.06], gpos: [1.6, -0.4, 0], explode: 0 },
  { t: 4.0, cam: [2.0, 1.2, 14.5], look: [2.3, 1.9, 0], rot: [-0.24, 0.38, 0.06], gpos: [1.6, -0.4, 0], explode: 0 },
]
const EPI = { cam: [0, 0.2, 12.5], look: [0, 0, 0], rot: [-0.35, 0.6, 0.2], gpos: [2.4, -0.2, 0], explode: 0.42 }

const bump = (x, c, w) => Math.exp(-(((x - c) / w) ** 2))
const V = () => new THREE.Vector3()
const ZERO = [0, 0, 0]

function samplePose(t, hotWorld, out) {
  let i = 0
  while (i < KEYS.length - 2 && t > KEYS[i + 1].t) i++
  const a = KEYS[i], b = KEYS[i + 1]
  const k = smooth(seg(t, a.t, b.t))
  // a key aimed at the hot spot looks at it (shifted by `off` to leave room for the HUD)
  // and places the camera relative to that point; scratch vectors avoid per-frame garbage
  const aim = (key, v) => (key.look === HOT ? v.copy(hotWorld).add(out._tmp.fromArray(key.off || ZERO)) : v.fromArray(key.look))
  const place = (key, look, v) => (key.look === HOT ? v.copy(look).add(out._tmp.fromArray(key.cam)) : v.fromArray(key.cam))
  aim(a, out._la); aim(b, out._lb)
  place(a, out._la, out._ca); place(b, out._lb, out._cb)
  out.cam.lerpVectors(out._ca, out._cb, k)
  out.look.lerpVectors(out._la, out._lb, k)
  for (let j = 0; j < 3; j++) {
    out.rot[j] = a.rot[j] + (b.rot[j] - a.rot[j]) * k
    out.gpos[j] = a.gpos[j] + (b.gpos[j] - a.gpos[j]) * k
  }
  out.explode = a.explode + (b.explode - a.explode) * k
  return out
}

function Director() {
  const { camera, size, viewport } = useThree()
  const model = useMemo(createElbow, [])
  const mats = useMemo(() => ({ elbow: makeElbowMaterial(), burst: makeBurstMaterial(), dust: makeDustMaterial(), back: makeBackdropMaterial() }), [])
  const group = useRef(), front = useRef(), flash = useRef(), rim = useRef(), backdrop = useRef()

  const burstGeo = useMemo(() => {
    const n = 2400
    const pos = new Float32Array(n * 3), dir = new Float32Array(n * 3)
    const speed = new Float32Array(n), seed = new Float32Array(n), sizeA = new Float32Array(n), kind = new Float32Array(n)
    const o = model.hot.clone().addScaledVector(model.hotN, 0.04)
    const axis = model.hotN.clone().add(new THREE.Vector3(0, 0.1, 0.55)).normalize()
    const r = V()
    for (let i = 0; i < n; i++) {
      pos.set([o.x, o.y, o.z], i * 3)
      do r.set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1); while (r.lengthSq() > 1)
      const ember = Math.random() < 0.2
      const d = axis.clone().addScaledVector(r, ember ? 0.95 : 0.62).normalize()
      dir.set([d.x, d.y, d.z], i * 3)
      speed[i] = ember ? 0.5 + Math.random() * 0.9 : 0.25 + Math.random() ** 0.7 * 0.75
      seed[i] = Math.random()
      sizeA[i] = ember ? 0.05 + Math.random() * 0.05 : 0.35 + Math.random() * 0.55
      kind[i] = ember ? 1 : 0
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aDir', new THREE.BufferAttribute(dir, 3))
    g.setAttribute('aSpeed', new THREE.BufferAttribute(speed, 1))
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    g.setAttribute('aSize', new THREE.BufferAttribute(sizeA, 1))
    g.setAttribute('aKind', new THREE.BufferAttribute(kind, 1))
    return g
  }, [model])

  const dustGeo = useMemo(() => {
    const n = 650
    const pos = new Float32Array(n * 3), seed = new Float32Array(n), sizeA = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      pos.set([(Math.random() - 0.5) * 26, (Math.random() - 0.5) * 14, -12 + Math.random() * 16], i * 3)
      seed[i] = Math.random()
      sizeA[i] = 0.025 + Math.random() ** 3 * 0.09
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    g.setAttribute('aSize', new THREE.BufferAttribute(sizeA, 1))
    return g
  }, [])

  const cur = useMemo(() => ({ cam: new THREE.Vector3(0.4, 0.6, 16), look: new THREE.Vector3(-1.6, 0.35, 0), rot: [-0.5, 0.78, 0.22], gpos: [1.5, 0.15, 0], explode: 0 }), [])
  const tgt = useMemo(() => ({ cam: V(), look: V(), rot: [0, 0, 0], gpos: [0, 0, 0], explode: 0, _tmp: V(), _la: V(), _lb: V(), _ca: V(), _cb: V() }), [])
  const tmp = useMemo(() => ({ hot: V(), p: V() }), [])
  const frames = useRef(0)

  useFrame((state, dt) => {
    const s = stage
    const time = state.clock.elapsedTime
    const t = Math.min(4, s.hero + s.manifesto + s.anatomy + s.rupture)
    const epi = s.epilogue > 0.001
    const r = s.rupture

    // ---- where the hot spot is in the world (from last frame's transform)
    group.current.updateMatrixWorld()
    // the close-up frames the weld between the adjacent pipe and the bend, half way to the hot spot
    tmp.hot.copy(model.hot).lerp(model.weldA, 0.55).sub(model.center)
    group.current.localToWorld(tmp.hot)

    if (epi) {
      tgt.cam.fromArray(EPI.cam); tgt.look.fromArray(EPI.look)
      for (let j = 0; j < 3; j++) { tgt.rot[j] = EPI.rot[j]; tgt.gpos[j] = EPI.gpos[j] }
      tgt.rot[1] += time * 0.12
      tgt.explode = EPI.explode
    } else {
      samplePose(t, tmp.hot, tgt)
      if (t < 1.2) tgt.rot[1] += Math.sin(time * 0.25) * 0.14 * (1 - seg(t, 0.6, 1.2))
    }
    // portrait screens: pull side-placed poses to the centre and back the camera off
    const narrow = Math.min(1, size.width / size.height / 1.25)
    if (narrow < 1) {
      tgt.gpos[0] *= narrow
      tgt.look.x *= narrow
      tgt.cam.x *= narrow
      tgt.cam.z = tgt.look.z + (tgt.cam.z - tgt.look.z) * (1 + (1 - narrow) * 1.1)
    }
    // pointer parallax, strongest on the title screens
    const par = epi ? 1 : 1 - 0.75 * seg(t, 1.6, 2.2)
    tgt.cam.x += s.mouse.x * 0.45 * par
    tgt.cam.y += s.mouse.y * 0.28 * par

    const k = 1 - Math.exp(-dt * (epi ? 2.2 : 3.4))
    cur.cam.lerp(tgt.cam, k)
    cur.look.lerp(tgt.look, k)
    for (let j = 0; j < 3; j++) {
      cur.rot[j] += (tgt.rot[j] - cur.rot[j]) * k
      cur.gpos[j] += (tgt.gpos[j] - cur.gpos[j]) * k
    }
    cur.explode += (tgt.explode - cur.explode) * k

    // ---- camera (+ shake at the rupture and at ignition)
    const shake = epi ? 0 : 0.16 * bump(r, 0.31, 0.05) + 0.12 * bump(r, 0.6, 0.07)
    camera.position.set(
      cur.cam.x + Math.sin(time * 37) * shake,
      cur.cam.y + Math.cos(time * 41) * shake,
      cur.cam.z,
    )
    camera.lookAt(cur.look)

    // ---- the specimen
    group.current.position.set(...cur.gpos)
    group.current.rotation.set(...cur.rot)
    const e = smooth(Math.min(1, Math.max(0, cur.explode)))
    front.current.position.set(1.5 * e, 10 * e, 1.6 * e)
    front.current.rotation.set(-0.55 * e, 0, 0.12 * e)

    const year = epi || t >= 3 ? C.fail : t < 2 ? C.install : C.install + (C.fail - C.install) * seg(s.anatomy, 0.1, 0.84)
    model.setYear(year, e < 0.98)
    const u = mats.elbow.userData.u
    u.uHeatGain.value = epi ? 1.4 : 2.1
    u.uCrack.value = epi ? 0.3 : 7 * seg(r, 0.1, 0.3) * (1 - 0.6 * seg(r, 0.34, 0.6))

    // ---- release jet and fire
    const bt = epi ? 0 : seg(r, 0.3, 0.97)
    const ignite = epi ? 0 : seg(r, 0.56, 0.68)
    const px = size.height * viewport.dpr
    mats.burst.uniforms.uT.value = bt
    mats.burst.uniforms.uIgnite.value = ignite
    mats.burst.uniforms.uPixel.value = px * 0.55
    // unborn particles get gl_PointSize 0 in the shader, so they cost nothing before the release;
    // the points stay "visible" so their shader is compiled at load, not as a hitch mid-scroll
    mats.burst.uniforms.uMaxPx.value = px * 0.12
    mats.dust.uniforms.uTime.value = time
    mats.dust.uniforms.uPixel.value = px * 0.55
    mats.dust.uniforms.uAmt.value = 0.55 + 1.4 * ignite * (1 - seg(r, 0.9, 1))
    mats.back.uniforms.uFire.value = ignite * (1 - 0.5 * seg(r, 0.88, 1))
    mats.back.uniforms.uGlow.value = epi ? 0.5 : 0.45 + 0.4 * seg(r, 0.12, 0.3)

    tmp.p.copy(model.hot).sub(model.center)
    group.current.localToWorld(tmp.p)
    flash.current.position.copy(tmp.p)
    flash.current.intensity = epi ? 0 : 90 * bump(r, 0.315, 0.025) + 140 * bump(r, 0.6, 0.04) + 22 * ignite * (1 - seg(r, 0.86, 1))
    // the warm rim light reads as a false hot spot inside the cut-away, so dim it there
    const inAnatomy = seg(t, 1.8, 2.1) * (1 - seg(t, 2.95, 3.15))
    rim.current.intensity = (26 + 40 * ignite) * (1 - 0.85 * inAnatomy)

    // ---- DOM labels that hang off points of the model
    const W = size.width, H = size.height
    const place = (name, local) => {
      const el = s.anchors[name]
      if (!el) return
      tmp.p.copy(local).sub(model.center)
      group.current.localToWorld(tmp.p)
      tmp.p.project(camera)
      const x = (tmp.p.x * 0.5 + 0.5) * W, y = (-tmp.p.y * 0.5 + 0.5) * H
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`
    }
    if (!epi && t > 1.9 && t < 3.1) {
      place('hot', model.hot)
      place('pipe', model.pipeA)
      place('weld', model.weldIn)
    }

    if (++frames.current === 3) s.glReady = true
  })

  return (
    <>
      <mesh ref={backdrop} position={[0, 0, -14]} material={mats.back}>
        <planeGeometry args={[90, 60]} />
      </mesh>
      <group ref={group} scale={0.62}>
        <group position={[-model.center.x, -model.center.y, 0]}>
          <mesh geometry={model.back} material={mats.elbow} />
          <group ref={front}>
            <mesh geometry={model.front} material={mats.elbow} />
          </group>
          <points geometry={burstGeo} material={mats.burst} frustumCulled={false} />
        </group>
      </group>
      <points geometry={dustGeo} material={mats.dust} frustumCulled={false} />
      <pointLight ref={flash} color="#ff7a33" distance={30} decay={1.6} intensity={0} />
      <pointLight ref={rim} position={[4, 5, -6]} color="#ff6a2a" distance={40} decay={1.2} intensity={26} />
    </>
  )
}

/**
 * Drives the canvas at no more than ~60 fps. On 120 Hz screens the default loop
 * renders every refresh, which doubles the GPU work for no visible gain here.
 */
function FrameCap({ active }) {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => {
    if (!active) return
    let raf, last = 0
    const loop = (now) => {
      raf = requestAnimationFrame(loop)
      if (now - last >= 15) { last = now; invalidate() }
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [active, invalidate])
  return null
}

const MAX_DPR = Math.min(typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1, 1.5)

export default function Stage() {
  const active = useStore(glStore)
  const [dpr, setDpr] = useState(Math.min(MAX_DPR, 1.25))
  const [lost, setLost] = useState(false)
  const on = active && !lost
  return (
    <div className={`gl${on ? '' : ' off'}`} aria-hidden="true">
      <Canvas
        frameloop="demand"
        dpr={dpr}
        gl={{ antialias: false, powerPreference: 'high-performance', stencil: false }}
        camera={{ fov: 30, near: 0.1, far: 80, position: [0.4, 0.6, 16] }}
        onCreated={({ gl }) => {
          // if the GPU drops the context (memory pressure), hide the stage instead of leaving a broken canvas
          gl.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); setLost(true) })
        }}
      >
        <FrameCap active={on} />
        {on && (
          <PerformanceMonitor
            flipflops={3}
            onDecline={() => setDpr((d) => Math.max(0.75, +(d - 0.25).toFixed(2)))}
            onIncline={() => setDpr((d) => Math.min(MAX_DPR, +(d + 0.25).toFixed(2)))}
            onFallback={() => setDpr(0.75)}
          />
        )}
        <color attach="background" args={['#0b0a09']} />
        <fog attach="fog" args={['#0b0a09', 14, 34]} />
        <ambientLight intensity={0.12} />
        <directionalLight position={[-5, 7, 8]} intensity={1.5} color="#f3eee6" />
        <directionalLight position={[6, -3, 4]} intensity={0.35} color="#9fb4c8" />
        <Environment resolution={128} frames={1}>
          <Lightformer form="rect" intensity={2.2} position={[0, 6, 2]} rotation-x={Math.PI / 2} scale={[12, 3, 1]} />
          <Lightformer form="rect" intensity={1.4} position={[-7, 1, 3]} rotation-y={Math.PI / 2} scale={[2, 9, 1]} />
          <Lightformer form="rect" intensity={1.1} color="#ff7a3a" position={[7, 0, -2]} rotation-y={-Math.PI / 2} scale={[2, 9, 1]} />
          <Lightformer form="ring" intensity={0.8} position={[0, -4, 6]} scale={3} />
        </Environment>
        <Director />
        {/* no MSAA buffers (they were the biggest memory cost); SMAA smooths edges cheaply */}
        <EffectComposer multisampling={0} disableNormalPass>
          <Bloom mipmapBlur levels={6} intensity={0.9} luminanceThreshold={0.9} luminanceSmoothing={0.25} radius={0.62} />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          <Vignette offset={0.28} darkness={0.72} />
          <SMAA />
        </EffectComposer>
      </Canvas>
    </div>
  )
}
