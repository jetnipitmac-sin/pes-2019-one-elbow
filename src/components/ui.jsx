// Small building blocks shared by every section.
import { useEffect, useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SRC } from '../lib/sources.js'

const DIGITS = '01234567890123456789'.split('')

/**
 * Rolling-digit counter. Each digit is a column 0–9 0–9 that rolls to its value
 * the first time the number enters the viewport.
 */
export function Odometer({ value, className = '', delay = 0, stagger = 0.07, duration = 1.9 }) {
  const ref = useRef(null)
  useLayoutEffect(() => {
    const cols = ref.current.querySelectorAll('.odo-col')
    gsap.set(cols, { yPercent: 0 })
    const tw = gsap.to(cols, {
      yPercent: (i, el) => -((10 + +el.dataset.d) / 20) * 100,
      duration,
      delay,
      ease: 'expo.out',
      stagger: { each: stagger, from: 'end' },
      scrollTrigger: { trigger: ref.current, start: 'top 88%', once: true },
    })
    return () => { tw.scrollTrigger?.kill(); tw.kill() }
  }, [value, delay, stagger, duration])
  return (
    <span ref={ref} className={`odo ${className}`} aria-label={value}>
      {[...value].map((c, i) =>
        /\d/.test(c) ? (
          <span className="odo-d" key={i} aria-hidden="true">
            <span className="odo-col" data-d={c}>{DIGITS.map((d, k) => <span key={k}>{d}</span>)}</span>
          </span>
        ) : (
          <span className="odo-s" key={i} aria-hidden="true">{c}</span>
        ),
      )}
    </span>
  )
}

/** Big headline revealed line by line from behind a mask. `lines` is an array of nodes. */
export function Lines({ lines, as: Tag = 'h2', className = '', delay = 0, start = 'top 85%', play }) {
  const ref = useRef(null)
  useLayoutEffect(() => {
    const inner = ref.current.querySelectorAll('.line-inner')
    gsap.set(inner, { yPercent: 108, rotate: 2.5 })
    if (play === false) return
    const tw = gsap.to(inner, {
      yPercent: 0, rotate: 0, duration: 1.25, ease: 'expo.out', stagger: 0.09, delay,
      scrollTrigger: play === undefined ? { trigger: ref.current, start, once: true } : undefined,
    })
    return () => { tw.scrollTrigger?.kill(); tw.kill() }
  }, [play, delay, start])
  return (
    <Tag ref={ref} className={className}>
      {lines.map((l, i) => (
        <span className="line-mask" key={i}><span className="line-inner" style={{ display: 'block', transformOrigin: '0 100%' }}>{l}</span></span>
      ))}
    </Tag>
  )
}

/** Fade-up for every `.reveal-up` inside a container, batched as they scroll in. */
export function useReveal(ref) {
  useLayoutEffect(() => {
    const els = ref.current.querySelectorAll('.reveal-up')
    if (!els.length) return
    const triggers = ScrollTrigger.batch(els, {
      start: 'top 90%',
      once: true,
      onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.08 }),
    })
    return () => triggers.forEach((t) => t.kill())
  }, [ref])
}

/** Pulls its child gently toward the pointer. */
export function Magnetic({ children, strength = 0.35, className = '' }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (matchMedia('(pointer: coarse)').matches) return
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' })
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' })
    const move = (e) => {
      const r = el.getBoundingClientRect()
      xTo((e.clientX - (r.left + r.width / 2)) * strength)
      yTo((e.clientY - (r.top + r.height / 2)) * strength)
    }
    const leave = () => { xTo(0); yTo(0) }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    return () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave) }
  }, [strength])
  return <span ref={ref} className={`magnetic ${className}`}>{children}</span>
}

/** Endless band of text; skews with scroll speed. */
export function Marquee({ items, className = '' }) {
  const ref = useRef(null)
  useEffect(() => {
    const skew = gsap.quickTo(ref.current, 'skewX', { duration: 0.5, ease: 'power3' })
    const t = ScrollTrigger.create({
      onUpdate: (self) => skew(Math.max(-8, Math.min(8, self.getVelocity() / -260))),
    })
    return () => t.kill()
  }, [])
  const row = items.map((it, i) => (
    <span className="mq-item" key={i}>{it}<span className="mq-dot" aria-hidden="true" /></span>
  ))
  return (
    <div className={`marquee ${className}`} aria-label={items.join(' · ')}>
      <div className="mq-skew" ref={ref}>
        <div className="mq-track" aria-hidden="true">{row}{row}</div>
      </div>
    </div>
  )
}

const SHORT = { csb: 'CSB report', csbNews: 'CSB news', calc: 'calc.py', city: 'City report', erg: 'ERG 2024', lopa: 'CCPS LOPA', ccps: 'CCPS' }

/** Citation chip: [CSB p.25] → opens the source. */
export function Src({ k, note }) {
  const keys = Array.isArray(k) ? k : [k]
  return (
    <>
      {keys.map((key) => {
        const s = SRC[key]
        if (!s) return null
        const label = note || SHORT[key] || s.label.split(/[,(:]/)[0].trim().slice(0, 34)
        return s.url ? (
          <a key={key} className="src" href={s.url} target="_blank" rel="noreferrer" title={s.label} data-cursor="อ่าน">↗ {label}</a>
        ) : (
          <span key={key} className="src" title={s.label}>· {label}</span>
        )
      })}
    </>
  )
}

/** One floating tooltip for every chart. */
let tipEl = null
function ensureTip() {
  if (!tipEl) {
    tipEl = document.createElement('div')
    tipEl.className = 'tip'
    tipEl.setAttribute('role', 'status')
    document.body.appendChild(tipEl)
  }
  return tipEl
}
export const tip = {
  show(html, x, y) {
    const el = ensureTip()
    el.innerHTML = html
    el.classList.add('on')
    const w = el.offsetWidth, h = el.offsetHeight
    const left = Math.min(innerWidth - w - 12, x + 18)
    const top = y - h - 14 < 8 ? y + 18 : y - h - 14
    el.style.transform = `translate3d(${left}px, ${top}px, 0)`
  },
  hide() { tipEl?.classList.remove('on') },
}
