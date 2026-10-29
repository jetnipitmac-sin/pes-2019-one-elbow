// The four chapters that play over the WebGL stage: hero, manifesto, the
// thinning wall (anatomy) and the rupture. Each one only reports its scroll
// progress into `stage`; the 3D director does the rest.
import { useLayoutEffect, useMemo, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { stage, seg } from '../lib/scroll.js'
import { C, elbowT, adjT, fmt, IN_TO_MM } from '../lib/data.js'
import { Lines, Src } from '../components/ui.jsx'

function useProgress(id, key, opts = {}) {
  useLayoutEffect(() => {
    const t = ScrollTrigger.create({
      trigger: `#${id}`,
      start: opts.start || 'top top',
      end: opts.end || 'bottom bottom',
      onUpdate: (s) => { stage[key] = s.progress; opts.onUpdate?.(s.progress) },
      onRefresh: (s) => { stage[key] = s.progress; opts.onUpdate?.(s.progress) },
    })
    return () => t.kill()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

// ------------------------------------------------------------------ hero
export function Hero({ intro }) {
  const ref = useRef(null), meta = useRef(null), bottom = useRef(null)
  useProgress('hero', 'hero', {
    end: 'bottom top',
    onUpdate: (p) => {
      // written straight to the two blocks (a custom property would restyle the whole hero)
      if (!meta.current) return
      meta.current.style.opacity = Math.max(0, 1 - p * 2).toFixed(3)
      bottom.current.style.opacity = Math.max(0, 1 - p * 1.6).toFixed(3)
      bottom.current.style.transform = `translate3d(0, ${(-120 * p).toFixed(1)}px, 0)`
    },
  })
  useLayoutEffect(() => {
    if (!intro) return
    const els = ref.current.querySelectorAll('.hero-in')
    gsap.fromTo(els, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out', stagger: 0.07, delay: 0.5 })
  }, [intro])
  return (
    <section id="hero" ref={ref} className="hero" data-theme="ink" data-chapter="hero">
      <div className="hero-meta" ref={meta}>
        {[
          ['Location', 'Philadelphia, PA'],
          ['Unit', 'HF alkylation'],
          ['Capacity', '335,000 bbl/d'],
          ['Outcome', 'Closed for good'],
        ].map(([k, v]) => (
          <div className="hero-in" key={k}><span className="kicker">{k}</span><span className="hero-v">{v}</span></div>
        ))}
      </div>
      <div className="hero-bottom" ref={bottom}>
        <div className="hero-titlewrap">
          <span className="kicker hero-in">Case file · U.S. CSB No. 2019-04-I-PA</span>
          <Lines as="h1" className="hero-title serif" play={intro} delay={0.15}
            lines={['One elbow.', <>One <span className="it">refinery.</span></>]} />
        </div>
        <div className="hero-side">
          <p className="hero-th hero-in">
            เช้ามืด 21 มิถุนายน 2019 ข้องอเหล็กอายุ 46 ปีในหน่วย HF alkylation ของโรงกลั่น PES แตกออก
            โรงกลั่นที่ใหญ่ที่สุดฝั่งตะวันออกของสหรัฐฯ ไม่เคยเปิดอีกเลย
          </p>
          <div className="scroll-cue hero-in"><span className="mono">Scroll</span><span className="cue-line" /></div>
        </div>
      </div>
    </section>
  )
}

// ------------------------------------------------------------------ manifesto
const MANIFESTO =
  'เวลา *04:00:16* ของวันที่ 21 มิถุนายน 2019 ข้องอเหล็กขนาด 8 นิ้วชิ้นหนึ่งในโรงกลั่นที่ฟิลาเดลเฟียแตกออก ' +
  'ผนังของมันเหลือบางแค่ *0.28 มิลลิเมตร* จากเดิม 8.2 มิลลิเมตร โพรเพนที่มีกรดไฮโดรฟลูออริกปนพุ่งออกมา ติดไฟ แล้วระเบิดตามมาอีกสามครั้ง ' +
  'ห้าวันต่อมา โรงกลั่นที่ใหญ่ที่สุดฝั่งตะวันออกของสหรัฐฯ ประกาศปิด *ถาวร*'

function words(text) {
  const seg = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter('th', { granularity: 'word' }) : null
  const out = []
  text.split('*').forEach((part, i) => {
    const em = i % 2 === 1
    if (em) { out.push({ w: part, em }); return }
    if (seg) for (const s of seg.segment(part)) out.push({ w: s.segment, em })
    else part.split(/(\s+)/).forEach((w) => out.push({ w, em }))
  })
  return out
}

export function Manifesto() {
  const box = useRef(null), veil = useRef(null)
  const spans = useRef(null), lit = useRef(0)
  const list = useMemo(() => words(MANIFESTO), [])
  useProgress('manifesto', 'manifesto', {
    onUpdate: (p) => {
      if (!box.current) return
      spans.current ||= [...box.current.querySelectorAll('.w')]
      const all = spans.current
      const n = Math.round(seg(p, 0.08, 0.78) * all.length)
      // only touch the words whose state actually changed since the last tick
      for (let i = Math.min(n, lit.current); i < Math.max(n, lit.current); i++) all[i].classList.toggle('on', i < n)
      lit.current = n
      veil.current.style.opacity = Math.min(1, p * 6).toFixed(3)
    },
  })
  return (
    <section id="manifesto" className="manifesto" data-theme="ink" data-chapter="hero">
      <div className="sticky">
        <div className="mf-veil" ref={veil} />
        <div className="mf-inner" ref={box}>
          <span className="kicker">The short version — เรื่องย่อ</span>
          <p className="mf-text">
            {list.map((t, i) => (/^\s+$/.test(t.w) ? ' ' : <span key={i} className={`w${t.em ? ' w-em' : ''}`}>{t.w}</span>))}
          </p>
        </div>
      </div>
    </section>
  )
}

// ------------------------------------------------------------------ anatomy
const ERAS = [
  { from: 1973, h: '1973 · ติดตั้ง', p: 'ข้องอ 8 นิ้วถูกเชื่อมเข้ากับท่อในหน่วย alkylation หน้าตาเหมือนข้อต่อทั่วไป มีตราประทับ WPB เหมือนกันทุกตัว' },
  { from: 1981, h: 'เหล็กคนละแบบ', p: `เนื้อเหล็กมีนิกเกิลกับทองแดงปนรวม ${C.cuni}% HF จึงกัดข้องอเฉลี่ย ${fmt(C.rate_mpy, 1)} mpy เร็วกว่าท่อข้างๆ ${fmt(C.ratio[0], 0)}–${fmt(C.ratio[1], 0)} เท่า` },
  { from: 1994, h: '1994 · บางกว่าเกณฑ์แล้ว', p: 'ผนังบางกว่า 0.180 นิ้ว ความหนาต่ำสุดที่ยอมรับได้ ควรถูกเปลี่ยนตั้งแต่ปีนี้ แต่ไม่มีใครรู้ เพราะไม่มีจุดวัดความหนาบนข้องอชิ้นนี้' },
  { from: 2003, h: '2003 · มีเกณฑ์ใหม่', p: 'งานวิจัยกำหนดว่าเหล็กสำหรับงาน HF ควรมี Cu + Ni ไม่เกิน 0.15% แต่ไม่มีข้อไหนบังคับให้ย้อนไปตรวจท่อที่ติดตั้งไปแล้ว' },
  { from: 2012, h: '2019 · เหลือ 0.011 นิ้ว', p: 'บางกว่าบัตรเครดิตเกือบสามเท่า ส่วนท่อที่ต่ออยู่ข้างๆ ยังหนา 0.29–0.31 นิ้ว จุดวัดทุกจุดบอกว่าปกติ' },
]

// mini chart geometry
const CW = 300, CH = 150, PAD = { l: 34, r: 10, t: 12, b: 22 }
const cx = (y) => PAD.l + ((y - C.install) / (C.fail - C.install)) * (CW - PAD.l - PAD.r)
const cy = (t) => PAD.t + (1 - t / 0.35) * (CH - PAD.t - PAD.b)
const pathOf = (fn) => {
  let d = ''
  for (let y = C.install; y <= C.fail + 0.001; y += 0.5) d += `${d ? 'L' : 'M'}${cx(y).toFixed(1)},${cy(fn(y)).toFixed(1)}`
  return d
}

export function Anatomy() {
  const r = useRef({})
  const set = (k) => (el) => { r.current[k] = el }
  const lastEra = useRef(-1)
  const ePath = useMemo(() => pathOf(elbowT), [])
  const aPath = useMemo(() => pathOf(adjT), [])

  useLayoutEffect(() => {
    stage.anchors.hot = r.current.aHot
    stage.anchors.pipe = r.current.aPipe
    stage.anchors.weld = r.current.aWeld
    return () => { delete stage.anchors.hot; delete stage.anchors.pipe; delete stage.anchors.weld }
  }, [])

  useProgress('anatomy', 'anatomy', {
    onUpdate: (p) => {
      const $ = r.current
      if (!$.year) return
      const yr = C.install + (C.fail - C.install) * seg(p, 0.1, 0.84)
      const t = elbowT(yr), a = adjT(yr)
      $.year.textContent = Math.floor(yr)
      $.tIn.textContent = t.toFixed(3)
      $.tMm.textContent = `${(t * IN_TO_MM).toFixed(2)} mm`
      $.tPct.textContent = `${Math.round((t / C.t0) * 100)}%`
      $.tBar.style.transform = `scaleX(${t / C.t0})`
      $.aIn.textContent = a.toFixed(3)
      $.aBar.style.transform = `scaleX(${a / C.t0})`
      $.svc.textContent = Math.floor(yr - C.install)
      const below = t < C.tret
      $.flag.classList.toggle('on', below)
      $.clip.setAttribute('width', Math.max(0, cx(yr) - PAD.l + 1).toFixed(1))
      $.dot.setAttribute('cx', cx(yr).toFixed(1))
      $.dot.setAttribute('cy', cy(t).toFixed(1))
      $.dotA.setAttribute('cx', cx(yr).toFixed(1))
      $.dotA.setAttribute('cy', cy(a).toFixed(1))
      let era = 0
      ERAS.forEach((e, i) => { if (yr >= e.from) era = i })
      if (era !== lastEra.current) {
        lastEra.current = era
        $.cap.querySelectorAll('.cap').forEach((c, i) => c.classList.toggle('on', i === era))
        $.ticks.querySelectorAll('i').forEach((c, i) => c.classList.toggle('on', i <= era))
      }
      // HUD in/out with the chapter
      const vis = seg(p, 0.02, 0.08) * (1 - seg(p, 0.95, 1))
      $.hud.style.opacity = vis.toFixed(3)
      $.anchors.style.opacity = (seg(p, 0.12, 0.2) * (1 - seg(p, 0.8, 0.88))).toFixed(3)
    },
  })

  return (
    <section id="anatomy" className="anatomy" data-theme="ink" data-chapter="anatomy">
      <div className="sticky">
        <div className="an-hud" ref={set('hud')}>
          <div className="an-head">
            <div className="sec-num">01 — Anatomy</div>
            <h2 className="an-title serif">Forty-six years, <span className="it">one wall.</span></h2>
            <p className="an-sub">ผ่าข้องอตามยาวเพื่อดูผนังด้านใน เลื่อนลงเพื่อเดินเวลาจากวันติดตั้งถึงวันที่แตก</p>
          </div>

          <div className="an-year">
            <span className="kicker">Year in service · <b ref={set('svc')}>0</b> ปี</span>
            <span className="an-yr" ref={set('year')}>1973</span>
            <div className="an-ticks" ref={set('ticks')}>{ERAS.map((e) => <i key={e.from} />)}</div>
          </div>

          <aside className="an-panel">
            <div className="an-read">
              <div className="an-lbl"><span className="sw sw-ember" />ผนังข้องอ <span className="mono muted">elbow</span></div>
              <div className="an-val"><span ref={set('tIn')}>0.322</span><small> in</small></div>
              <div className="an-meta mono"><span ref={set('tMm')}>8.18 mm</span><span ref={set('tPct')}>100%</span></div>
              <div className="an-bar"><i ref={set('tBar')} className="ember" /><span className="an-ret" style={{ left: `${(C.tret / C.t0) * 100}%` }} /></div>
            </div>
            <div className="an-read">
              <div className="an-lbl"><span className="sw sw-steel" />ท่อข้างๆ <span className="mono muted">adjacent pipe</span></div>
              <div className="an-val small"><span ref={set('aIn')}>0.322</span><small> in</small></div>
              <div className="an-bar"><i ref={set('aBar')} className="steel" /><span className="an-ret" style={{ left: `${(C.tret / C.t0) * 100}%` }} /></div>
            </div>
            <div className="an-flag mono" ref={set('flag')}>▲ บางกว่าเกณฑ์ปลดระวาง 0.180 in</div>
            <svg className="an-chart" viewBox={`0 0 ${CW} ${CH}`} role="img" aria-label="ความหนาผนังข้องอเทียบท่อข้างๆ ตั้งแต่ 1973 ถึง 2019">
              <defs><clipPath id="an-clip"><rect ref={set('clip')} x={PAD.l} y="0" width="0" height={CH} /></clipPath></defs>
              {[0, 0.1, 0.2, 0.3].map((v) => (
                <g key={v}>
                  <line x1={PAD.l} x2={CW - PAD.r} y1={cy(v)} y2={cy(v)} className="grid" />
                  <text x={PAD.l - 6} y={cy(v) + 3} className="tick" textAnchor="end">{v.toFixed(1)}</text>
                </g>
              ))}
              {[1973, 1994, 2019].map((y) => <text key={y} x={cx(y)} y={CH - 6} className="tick" textAnchor="middle">{y}</text>)}
              <line x1={PAD.l} x2={CW - PAD.r} y1={cy(C.tret)} y2={cy(C.tret)} className="ref" />
              <text x={CW - PAD.r} y={cy(C.tret) - 5} className="tick" textAnchor="end">เกณฑ์ปลดระวาง 0.180</text>
              <path d={aPath} className="ln ln-steel" clipPath="url(#an-clip)" />
              <path d={ePath} className="ln ln-ember" clipPath="url(#an-clip)" />
              <circle ref={set('dotA')} r="4" className="dt dt-steel" cx={cx(C.install)} cy={cy(C.t0)} />
              <circle ref={set('dot')} r="4.5" className="dt dt-ember" cx={cx(C.install)} cy={cy(C.t0)} />
            </svg>
            <p className="an-note">สีบนรอยผ่า: <span className="em">ส้ม</span> = บางกว่าเกณฑ์ ขาวร้อน = บางที่สุด · ผนังในภาพวาดหนากว่าจริง 3 เท่า สัดส่วนระหว่างชิ้นตามจริง · ใช้อัตรากัดเฉลี่ยคงที่ <Src k={['csb', 'calc']} /></p>
          </aside>

          <div className="an-captions" ref={set('cap')}>
            {ERAS.map((e) => (
              <div className="cap" key={e.from}><h3>{e.h}</h3><p>{e.p}</p></div>
            ))}
          </div>
        </div>

        <div className="an-anchors" ref={set('anchors')} aria-hidden="true">
          <div className="anchor" ref={set('aPipe')}><span className="tag tag-l"><b>Adjacent pipe</b><span>ท่อข้างๆ บางลงแค่ 0.26–0.70 mpy</span></span></div>
          <div className="anchor" ref={set('aWeld')}><span className="tag tag-l"><b>Weld</b><span>รอยเชื่อม เหล็กเปลี่ยนชนิดตรงนี้</span></span></div>
          <div className="anchor" ref={set('aHot')}><span className="tag tag-r"><b>Elbow · Ni + Cu {C.cuni}%</b><span>จุดที่บางที่สุด</span></span></div>
        </div>
      </div>
    </section>
  )
}

// ------------------------------------------------------------------ rupture
const pad = (n) => String(n).padStart(2, '0')
const clock = (s) => `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(Math.floor(s % 60))}`
const T0 = 4 * 3600 + 13, T_REL = 4 * 3600 + 16, T_IGN = 4 * 3600 + 2 * 60 + 6, T_RAD = 4 * 3600 + 2 * 60 + 37

const RCAPS = [
  { at: 0, k: 'ข้างในท่อ', h: 'ความดันราว 380 psig', p: 'โพรเพนที่มีกรด HF ปนราว 2.5% ไหลผ่านข้องอที่ผนังเหลือ 0.28 มม. โอเปอเรเตอร์กะดึกกำลังเพิ่มอัตราป้อนทีละขั้นตามปกติ' },
  { at: 0.3, k: '04:00:16', h: 'ข้องอแตก', p: 'ราว 3 วินาทีหลังเพิ่มอัตราป้อนครั้งสุดท้าย ไอโพรเพนที่มี HF ปนพุ่งออกมาเป็นกลุ่มไอขนาดใหญ่' },
  { at: 0.56, k: '04:02:06', h: 'กลุ่มไอติดไฟ', p: 'ลูกไฟลุกขึ้นทั่วหน่วยผลิต สายควบคุมปั๊มฉีดน้ำขาดทันที อีก 31 วินาทีต่อมา โอเปอเรเตอร์กดระบบถ่ายกรดฉุกเฉิน (RAD)' },
  { at: 0.86, k: '', h: 'และนั่นเพิ่งเป็นสองนาทีแรก', p: 'ไฟยังไหม้ต่อไปอีกราว 28 ชั่วโมงครึ่ง' },
]

export function Rupture() {
  const r = useRef({})
  const set = (k) => (el) => { r.current[k] = el }
  const last = useRef(-1)
  useProgress('rupture', 'rupture', {
    onUpdate: (p) => {
      const $ = r.current
      if (!$.clock) return
      const s = p < 0.3 ? T0 + (T_REL - T0) * seg(p, 0.05, 0.3)
        : p < 0.56 ? T_REL + (T_IGN - T_REL) * seg(p, 0.36, 0.56) ** 2
          : T_IGN + (T_RAD - T_IGN) * seg(p, 0.6, 0.84)
      $.clock.textContent = clock(s)
      $.clock.classList.toggle('hot', p > 0.3)
      let i = 0
      RCAPS.forEach((c, k) => { if (p >= c.at) i = k })
      if (i !== last.current) {
        last.current = i
        $.caps.querySelectorAll('.rcap').forEach((c, k) => c.classList.toggle('on', k === i))
      }
      const b = (c, w) => Math.exp(-(((p - c) / w) ** 2))
      $.flash.style.opacity = Math.min(1, 0.95 * b(0.305, 0.012) + 0.55 * b(0.6, 0.025)).toFixed(3)
      $.flash.style.background = p > 0.45 ? '#ffb071' : '#f4f1ea'
      $.black.style.opacity = seg(p, 0.86, 0.99).toFixed(3)
      $.hud.style.opacity = (seg(p, 0.0, 0.06)).toFixed(3)
    },
  })
  return (
    <section id="rupture" className="rupture" data-theme="ink" data-chapter="rupture">
      <div className="sticky">
        <div className="ru-hud" ref={set('hud')}>
          <div className="sec-num">02 — Rupture</div>
          <div className="ru-clock mono" ref={set('clock')}>04:00:13</div>
          <div className="ru-caps" ref={set('caps')}>
            {RCAPS.map((c, i) => (
              <div className="rcap" key={i}>
                {c.k && <span className="kicker">{c.k}</span>}
                <h3 className={i === 3 ? 'serif' : ''}>{c.h}</h3>
                <p>{c.p}</p>
              </div>
            ))}
          </div>
          <div className="ru-src"><Src k="csb" note="CSB timeline" /></div>
        </div>
        <div className="ru-flash" ref={set('flash')} />
        <div className="ru-black" ref={set('black')} />
      </div>
    </section>
  )
}
