// Page chrome: preloader, custom cursor, fixed nav and the full-screen menu.
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { stage, scrollTo, lenis, STILL } from '../lib/scroll.js'
import { Magnetic } from './ui.jsx'
import { chapterStore, useStore } from '../lib/store.js'

export const CHAPTERS = [
  { id: 'hero', n: '00', en: 'One elbow', th: 'เปิดเรื่อง' },
  { id: 'anatomy', n: '01', en: 'Anatomy', th: 'ผนังที่บางลงทีละปี' },
  { id: 'rupture', n: '02', en: '04:00:16', th: 'วินาทีที่ท่อแตก' },
  { id: 'night', n: '03', en: 'The night', th: '28 ชั่วโมงครึ่ง' },
  { id: 'toll', n: '04', en: 'What got out', th: 'สิ่งที่หลุดออกมา' },
  { id: 'forensics', n: '05', en: 'Why this elbow', th: 'หลักฐานสามชิ้น' },
  { id: 'barriers', n: '06', en: 'Layers', th: 'ชั้นป้องกันที่พัง' },
  { id: 'reach', n: '07', en: 'Reach', th: 'ไปไกลแค่ไหน' },
  { id: 'cost', n: '08', en: 'The bill', th: 'เงินที่หายไป' },
  { id: 'fixes', n: '09', en: 'The fix', th: 'แก้ตรงไหนก่อน' },
  { id: 'epilogue', n: '10', en: 'Epilogue', th: 'หลังจากนั้น' },
]

// ------------------------------------------------------------------ preloader
export function Preloader({ onDone }) {
  const root = useRef(null), num = useRef(null), bar = useRef(null)
  useLayoutEffect(() => {
    if (STILL) { onDone(); return }
    lenis?.stop()
    const o = { v: 0 }
    const ready = Promise.all([document.fonts.ready, new Promise((res) => {
      const t0 = performance.now()
      const poll = () => (stage.glReady || performance.now() - t0 > 6000 ? res() : requestAnimationFrame(poll))
      poll()
    })])
    const tl = gsap.timeline()
    tl.to(o, {
      v: 88, duration: 1.9, ease: 'power2.inOut',
      onUpdate: () => {
        num.current.textContent = String(Math.round(o.v)).padStart(3, '0')
        bar.current.style.transform = `scaleX(${o.v / 100})`
      },
    })
    let alive = true
    ready.then(() => {
      if (!alive) return
      tl.to(o, {
        v: 100, duration: 0.6, ease: 'power3.out',
        onUpdate: () => {
          num.current.textContent = String(Math.round(o.v)).padStart(3, '0')
          bar.current.style.transform = `scaleX(${o.v / 100})`
        },
      })
      tl.to(root.current.querySelectorAll('.pl-fade'), { opacity: 0, y: -16, duration: 0.5, stagger: 0.04, ease: 'power2.in' }, '+=0.15')
      tl.to(root.current.querySelector('.pl-top'), { yPercent: -100, duration: 1.15, ease: 'expo.inOut' }, '-=0.1')
      tl.to(root.current.querySelector('.pl-bot'), { yPercent: 100, duration: 1.15, ease: 'expo.inOut' }, '<')
      tl.add(() => onDone(), '-=0.75')
      tl.set(root.current, { display: 'none' })
      tl.add(() => lenis?.start())
    })
    return () => { alive = false; tl.kill() }
  }, [onDone])
  if (STILL) return null
  return (
    <div className="preloader" ref={root} aria-hidden="true">
      <div className="pl-top" />
      <div className="pl-bot" />
      <div className="pl-ui">
        <div className="pl-row pl-fade">
          <span className="kicker">Case file · CSB 2019-04-I-PA</span>
          <span className="kicker">Philadelphia, PA — 21.06.2019</span>
        </div>
        <div className="pl-mid pl-fade">
          <span className="serif it">Loading the night of</span> <span className="serif">21 June 2019</span>
        </div>
        <div className="pl-bottom">
          <span className="pl-num pl-fade" ref={num}>000</span>
          <div className="pl-bar pl-fade"><i ref={bar} /></div>
        </div>
      </div>
    </div>
  )
}

// ------------------------------------------------------------------ cursor
export function Cursor() {
  const dot = useRef(null), ring = useRef(null), label = useRef(null)
  useEffect(() => {
    if (matchMedia('(pointer: coarse)').matches) return
    document.documentElement.classList.add('has-cursor')
    const dx = gsap.quickTo(dot.current, 'x', { duration: 0.12, ease: 'power3' })
    const dy = gsap.quickTo(dot.current, 'y', { duration: 0.12, ease: 'power3' })
    const rx = gsap.quickTo(ring.current, 'x', { duration: 0.55, ease: 'power3' })
    const ry = gsap.quickTo(ring.current, 'y', { duration: 0.55, ease: 'power3' })
    const move = (e) => { dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY) }
    const over = (e) => {
      const t = e.target.closest('a, button, [data-cursor], input, .hoverable')
      ring.current.classList.toggle('big', !!t)
      const txt = t?.getAttribute('data-cursor') || ''
      label.current.textContent = txt
      ring.current.classList.toggle('labelled', !!txt)
    }
    const down = () => ring.current.classList.add('press')
    const up = () => ring.current.classList.remove('press')
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerover', over, { passive: true })
    window.addEventListener('pointerdown', down)
    window.addEventListener('pointerup', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerover', over)
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
    }
  }, [])
  return (
    <>
      <div className="cur-dot" ref={dot} aria-hidden="true" />
      <div className="cur-ring" ref={ring} aria-hidden="true"><span ref={label} /></div>
    </>
  )
}

// ------------------------------------------------------------------ nav + menu
export function Nav({ show }) {
  const chapter = useStore(chapterStore)
  const [open, setOpen] = useState(false)
  const menu = useRef(null)
  const tl = useRef(null)

  useLayoutEffect(() => {
    const m = menu.current
    tl.current = gsap.timeline({ paused: true })
      .set(m, { visibility: 'visible' })
      .fromTo(m, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.9, ease: 'expo.inOut' })
      .fromTo(m.querySelectorAll('.mn-item'), { yPercent: 120 }, { yPercent: 0, duration: 0.9, stagger: 0.035, ease: 'expo.out' }, '-=0.45')
      .fromTo(m.querySelectorAll('.mn-foot > *'), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.05 }, '-=0.7')
    return () => tl.current.kill()
  }, [])
  useEffect(() => {
    if (open) { tl.current.timeScale(1).play(); lenis?.stop() }
    else { tl.current.timeScale(1.6).reverse(); lenis?.start() }
    const esc = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [open])

  const go = (id) => {
    setOpen(false)
    setTimeout(() => scrollTo(`#${id}`, { duration: 2.2 }), 380)
  }
  const cur = CHAPTERS.find((c) => c.id === chapter) || CHAPTERS[0]

  return (
    <>
      <header className={`nav${show ? ' in' : ''}${open ? ' open' : ''}`}>
        <button className="nav-mark" onClick={() => scrollTo(0, { duration: 2.4 })} data-cursor="บนสุด" aria-label="กลับขึ้นบนสุด">
          <span className="serif it">PES</span><span className="mono">/19</span>
        </button>
        <div className="nav-chapter mono" aria-live="polite">
          <span className="nav-n">{cur.n}</span>
          <span className="nav-sep" />
          <span key={cur.id} className="nav-name">{cur.en}</span>
        </div>
        <div className="nav-right">
          <span className="nav-clock mono" aria-hidden="true">PHL <b>04<i>:</i>00<i>:</i>16</b> EDT</span>
          <Magnetic>
            <button className="nav-menu" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="menu" data-cursor={open ? 'ปิด' : 'เมนู'}>
              <span className="mono">{open ? 'Close' : 'Menu'}</span>
              <span className="burger"><i /><i /></span>
            </button>
          </Magnetic>
        </div>
      </header>
      <nav id="menu" className="menu" ref={menu} aria-hidden={!open}>
        <ol className="mn-list">
          {CHAPTERS.map((c) => (
            <li key={c.id} className="mn-row">
              <button className="mn-item" onClick={() => go(c.id)} data-cursor="ไป" tabIndex={open ? 0 : -1}>
                <span className="mn-n mono">{c.n}</span>
                <span className="mn-en serif">{c.en}</span>
                <span className="mn-th">{c.th}</span>
              </button>
            </li>
          ))}
        </ol>
        <div className="mn-foot">
          <span className="kicker">One Elbow · PES 2019 HF alkylation case analysis</span>
          <span className="kicker">Jetnipit Sinwisitsophon · Chemical Engineering, Mahidol University</span>
          <span className="kicker">Facts: U.S. CSB · City of Philadelphia · EIA</span>
        </div>
      </nav>
    </>
  )
}
