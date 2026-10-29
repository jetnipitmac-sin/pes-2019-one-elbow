// Smooth scroll (Lenis) driving GSAP ScrollTrigger, plus one mutable `stage`
// object the WebGL loop reads every frame (no React re-render per scroll tick).
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)
// a phone's address bar showing/hiding must not re-measure (and jump) the page
ScrollTrigger.config({ ignoreMobileResize: true })

export const stage = {
  // 0..1 progress of each WebGL chapter, written by ScrollTriggers in the sections
  hero: 0, // 0 at the top, 1 when the hero has scrolled away
  manifesto: 0,
  anatomy: 0,
  rupture: 0,
  epilogue: 0,
  mouse: { x: 0, y: 0 },
  velocity: 0,
  glReady: false,
  anchors: {}, // name -> DOM element positioned on a projected 3D point
}

export let lenis = null
const params = new URLSearchParams(location.search)
export const STILL = params.has('still')

export function initScroll() {
  if (lenis) return lenis
  // a reload always starts at the top (and the intro), never restored half way down a pinned chapter
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
  if (!params.has('at')) window.scrollTo(0, 0)
  lenis = new Lenis({ lerp: STILL ? 1 : 0.085, wheelMultiplier: 0.95, smoothWheel: !STILL })
  lenis.on('scroll', (e) => {
    stage.velocity = e.velocity
    ScrollTrigger.update()
  })
  gsap.ticker.add((t) => lenis.raf(t * 1000))
  gsap.ticker.lagSmoothing(0)
  window.addEventListener('pointermove', (e) => {
    stage.mouse.x = (e.clientX / innerWidth) * 2 - 1
    stage.mouse.y = -((e.clientY / innerHeight) * 2 - 1)
  }, { passive: true })
  return lenis
}

export function scrollTo(target, opts = {}) {
  if (lenis) lenis.scrollTo(target, { duration: 1.8, easing: (t) => 1 - Math.pow(1 - t, 4), ...opts })
}

/**
 * Presenter / review shortcut: ?at=<section id>&p=<0..1> jumps to that point of a
 * tall section right after load (e.g. ?at=anatomy&p=0.6).
 */
export function jumpFromQuery() {
  const at = params.get('at')
  if (!at) return
  const el = document.getElementById(at)
  if (!el) return
  const p = Math.min(1, Math.max(0, parseFloat(params.get('p') || '0')))
  const top = el.getBoundingClientRect().top + scrollY
  const travel = Math.max(0, el.offsetHeight - innerHeight)
  lenis.scrollTo(top + travel * p, { immediate: true, force: true })
  ScrollTrigger.update()
}

/** Map x from [a,b] to [0,1], clamped. */
export const seg = (x, a, b) => Math.min(1, Math.max(0, (x - a) / (b - a)))
export const smooth = (t) => t * t * (3 - 2 * t)
export const lerp = (a, b, t) => a + (b - a) * t
