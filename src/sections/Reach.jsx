// Chapter 07: how far it reached — hazard rings drawn to one scale.
import { useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Lines, Odometer, Src, tip, useReveal } from '../components/ui.jsx'
import { Z, fmt } from '../lib/data.js'

const S = 900, CX = S / 2, CY = S / 2
const PX_PER_M = 200 / 1000 // 1 km = 200 px
const r = (m) => m * PX_PER_M

const RINGS = [
  { m: Z.r_iso_m, k: 'iso', h: `${fmt(Z.r_iso_m, 0)} ม.`, s: 'กันพื้นที่ทันที (ERG, HF รั่วปริมาณมาก)' },
  { m: Z.r_proj_m, k: 'proj', h: `${fmt(Z.r_proj_m, 0)} ม.`, s: 'เศษถังไปไกลที่สุด 2,100 ฟุต' },
  { m: Z.r_1mi_m, k: 'mile', h: '1 ไมล์', s: `มีคนอาศัยราว ${fmt(Z.pop_1mi)} คน` },
]

function Radar() {
  const ref = useRef(null)
  useLayoutEffect(() => {
    const q = (s) => ref.current.querySelectorAll(s)
    gsap.set(q('.ring'), { scale: 0, transformOrigin: `${CX}px ${CY}px` })
    gsap.set(q('.ring-lbl'), { opacity: 0 })
    const tl = gsap.timeline({ scrollTrigger: { trigger: ref.current, start: 'top 75%', once: true } })
    tl.to(q('.ring'), { scale: 1, duration: 1.6, ease: 'expo.out', stagger: 0.25 })
      .to(q('.ring-lbl'), { opacity: 1, duration: 0.6, stagger: 0.2 }, '-=1.1')
    return () => { tl.scrollTrigger?.kill(); tl.kill() }
  }, [])
  const ergIn = r(Z.erg_day_km[0] * 1000), ergOut = r(Z.erg_day_km[2] * 1000)
  const a0 = (-70 * Math.PI) / 180, a1 = (-20 * Math.PI) / 180
  const pt = (rad, a) => `${CX + rad * Math.cos(a)},${CY + rad * Math.sin(a)}`
  const wedge = `M${pt(ergIn, a0)} A${ergIn},${ergIn} 0 0 1 ${pt(ergIn, a1)} L${pt(ergOut, a1)} A${ergOut},${ergOut} 0 0 0 ${pt(ergOut, a0)} Z`
  return (
    <svg ref={ref} className="radar" viewBox={`0 0 ${S} ${S}`} role="img" aria-label="วงรัศมีอันตรายรอบหน่วย alkylation ตามมาตราส่วนเดียวกัน">
      <defs>
        <radialGradient id="rg-core"><stop offset="0" stopColor="#ff5b1f" stopOpacity="0.55" /><stop offset="1" stopColor="#ff5b1f" stopOpacity="0" /></radialGradient>
        <linearGradient id="sweep-g" x1="0" x2="1"><stop offset="0" stopColor="#ece6da" stopOpacity="0" /><stop offset="1" stopColor="#ece6da" stopOpacity="0.14" /></linearGradient>
      </defs>
      {[0.5, 1, 1.5, 2].map((km) => <circle key={km} cx={CX} cy={CY} r={r(km * 1000)} className="rd-grid" />)}
      <line x1={CX} x2={CX} y1={20} y2={S - 20} className="rd-grid" />
      <line y1={CY} y2={CY} x1={20} x2={S - 20} className="rd-grid" />
      {[0.5, 1, 1.5, 2].map((km) => <text key={km} x={CX + 6} y={CY - r(km * 1000) - 6} className="tick">{km} กม.</text>)}
      {['N', 'E', 'S', 'W'].map((d, i) => {
        const a = (i * Math.PI) / 2 - Math.PI / 2
        return <text key={d} x={CX + (S / 2 - 14) * Math.cos(a)} y={CY + (S / 2 - 14) * Math.sin(a) + 4} className="tick" textAnchor="middle">{d}</text>
      })}
      <g className="sweep" style={{ transformOrigin: `${CX}px ${CY}px` }}>
        <path d={`M${CX},${CY} L${pt(S / 2 - 30, 0)} A${S / 2 - 30},${S / 2 - 30} 0 0 0 ${pt(S / 2 - 30, -0.6)} Z`} fill="url(#sweep-g)" />
      </g>
      <path d={wedge} className="ring ring-erg hoverable" onPointerMove={(e) => tip.show(`<b>เตือนคนใต้ลม</b><br>${fmt(Z.erg_day_km[0], 1)}–${fmt(Z.erg_day_km[2], 1)} กม. (ERG, กลางวัน)<br><span>ทิศลมในภาพเป็นตัวอย่าง</span>`, e.clientX, e.clientY)} onPointerLeave={() => tip.hide()} />
      {RINGS.slice().reverse().map((g) => (
        <circle key={g.k} cx={CX} cy={CY} r={r(g.m)} className={`ring ring-${g.k} hoverable`}
          onPointerMove={(e) => tip.show(`<b>${g.h}</b><br>${g.s}`, e.clientX, e.clientY)} onPointerLeave={() => tip.hide()} />
      ))}
      <circle cx={CX} cy={CY} r="40" fill="url(#rg-core)" />
      <circle cx={CX} cy={CY} r="5" className="rd-core" />
      {RINGS.map((g, i) => {
        const a = (-148 + i * 22) * (Math.PI / 180)
        const x = CX + r(g.m) * Math.cos(a), y = CY + r(g.m) * Math.sin(a)
        return (
          <g key={g.k} className="ring-lbl">
            <circle cx={x} cy={y} r="4" className="dt dt-bone" />
            <text x={x - 10} y={y - 8} className="lbl strong" textAnchor="end">{g.h}</text>
            <text x={x - 10} y={y + 10} className="tick" textAnchor="end">{g.s}</text>
          </g>
        )
      })}
      <g className="ring-lbl">
        <text x={CX + ergOut * Math.cos(-0.78) + 12} y={CY + ergOut * Math.sin(-0.78) - 4} className="lbl strong">เตือนใต้ลม 1.0–1.9 กม.</text>
        <text x={CX + ergOut * Math.cos(-0.78) + 12} y={CY + ergOut * Math.sin(-0.78) + 14} className="tick">ทิศลมสมมติ</text>
      </g>
    </svg>
  )
}

export default function Reach() {
  const ref = useRef(null)
  useReveal(ref)
  // the spinning SVG parts repaint every frame, so they only run while this section is on screen
  useLayoutEffect(() => {
    const t = ScrollTrigger.create({ trigger: ref.current, start: 'top bottom', end: 'bottom top', toggleClass: 'live' })
    return () => t.kill()
  }, [])
  return (
    <section id="reach" className="sec reach" ref={ref} data-theme="ink" data-chapter="reach">
      <div className="reach-grid">
        <div className="reach-copy">
          <div className="sec-num">07 — Reach</div>
          <Lines className="sec-title" lines={['A refinery', <>inside a <span className="it">city.</span></>]} />
          <p className="sec-lede reveal-up">
            โรงกลั่นอยู่กลางเมืองฟิลาเดลเฟีย วงทุกวงในภาพวาดด้วยมาตราส่วนเดียวกัน ขนาดของวงพื้นที่อันตรายจึงเทียบกันได้ตรงๆ
            แต่ถนนและอาคารจริงไม่ได้วาดไว้
          </p>
          <div className="reach-stats">
            <div className="stat reveal-up">
              <span className="kicker">People within 1 mile</span>
              <div className="stat-v"><Odometer value={fmt(Z.pop_1mi)} /><span className="unit">คน</span></div>
              <p>เมืองนับได้ {fmt(Z.pop_city)} คน CSB ใช้ตัวเลขมากกว่า 117,000</p>
              <Src k={['city', 'csbNews']} />
            </div>
            <div className="stat reveal-up">
              <span className="kicker">City watch</span>
              <div className="stat-v"><Odometer value={String(Z.days_under_control)} /><span className="unit">วัน</span></div>
              <p>เจ้าหน้าที่เมืองเฝ้าพื้นที่ 24 ชั่วโมงจนประกาศว่าควบคุมได้</p>
              <Src k="city" />
            </div>
            <div className="stat reveal-up">
              <span className="kicker">Fragment zone</span>
              <div className="stat-v"><Odometer value={fmt(Z.proj_share_site * 100, 0)} /><span className="unit">%</span></div>
              <p>วงเศษปลิว {fmt(Z.a_proj_km2, 2)} ตร.กม. เทียบกับพื้นที่โรงกลั่น {fmt(Z.site_km2, 2)} ตร.กม.</p>
              <Src k="calc" />
            </div>
          </div>
          <p className="muted small reveal-up">วง ERG เป็นคู่มือสำหรับอุบัติเหตุขนส่ง ใช้ที่นี่เพื่อเช็กขนาดคร่าวๆ เท่านั้น <Src k="erg" /></p>
        </div>
        <div className="reach-fig"><Radar /></div>
      </div>
    </section>
  )
}
