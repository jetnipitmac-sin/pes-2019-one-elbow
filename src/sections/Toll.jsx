// Chapter 04: what came out of the unit, and the one barrier that worked.
import { useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { Lines, Odometer, Src, tip, useReveal } from '../components/ui.jsx'
import { REL, M, fmt } from '../lib/data.js'

function HfSplit() {
  const ref = useRef(null)
  useLayoutEffect(() => {
    const segs = ref.current.querySelectorAll('.hs-seg')
    gsap.set(segs, { scaleX: 0 })
    const tw = gsap.to(segs, { scaleX: 1, duration: 1.4, ease: 'expo.out', stagger: 0.25, scrollTrigger: { trigger: ref.current, start: 'top 85%', once: true } })
    return () => { tw.scrollTrigger?.kill(); tw.kill() }
  }, [])
  const capt = REL.hf_cont / REL.hf_tot
  const parts = [
    { k: 'water', w: capt, v: REL.hf_cont, l: 'ม่านน้ำดักไว้', c: 'var(--water)' },
    { k: 'air', w: 1 - capt, v: REL.hf_air, l: 'ขึ้นสู่อากาศ', c: 'var(--ember)' },
  ]
  const move = (p) => (e) => tip.show(`<b>${p.l}</b><br>${fmt(p.v)} lb · ${fmt(p.w * 100, 0)}% ของ HF ที่รั่ว`, e.clientX, e.clientY)
  return (
    <div className="hs" ref={ref}>
      <div className="legend">
        {parts.map((p) => <span key={p.k}><i style={{ background: p.c }} />{p.l}</span>)}
      </div>
      <div className="hs-bar">
        {parts.map((p) => (
          <div key={p.k} className="hs-seg hoverable" style={{ flexGrow: p.w, background: p.c }} onPointerMove={move(p)} onPointerLeave={() => tip.hide()}>
            <span className="hs-in">{fmt(p.v)} lb</span>
          </div>
        ))}
      </div>
      <div className="hs-axis mono"><span>0</span><span>{fmt(REL.hf_tot)} lb</span></div>
    </div>
  )
}

function RadSquares() {
  const ref = useRef(null)
  const S = 300
  const s = S / Math.sqrt(REL.rad_ratio)
  useLayoutEffect(() => {
    const big = ref.current.querySelector('.rq-big')
    gsap.set(big, { scale: 0, transformOrigin: '0% 100%' })
    const tw = gsap.to(big, { scale: 1, duration: 1.8, ease: 'expo.inOut', delay: 0.4, scrollTrigger: { trigger: ref.current, start: 'top 80%', once: true } })
    return () => { tw.scrollTrigger?.kill(); tw.kill() }
  }, [])
  return (
    <svg ref={ref} className="rq" viewBox={`0 0 ${S + 2} ${S + 2}`} role="img" aria-label={`พื้นที่สี่เหลี่ยมเทียบ HF ที่ RAD ย้ายออก ${fmt(REL.rad_lb)} ปอนด์ กับ HF ที่รั่ว ${fmt(REL.hf_tot)} ปอนด์`}>
      <rect className="rq-big hoverable" x="1" y="1" width={S} height={S} rx="4"
        onPointerMove={(e) => tip.show(`<b>RAD ย้ายไปเก็บ</b><br>${fmt(REL.rad_lb)} lb`, e.clientX, e.clientY)} onPointerLeave={() => tip.hide()} />
      <rect className="rq-small hoverable" x="1" y={S + 1 - s} width={s} height={s} rx="2"
        onPointerMove={(e) => tip.show(`<b>HF ที่รั่ว</b><br>${fmt(REL.hf_tot)} lb`, e.clientX, e.clientY)} onPointerLeave={() => tip.hide()} />
    </svg>
  )
}

export default function Toll() {
  const ref = useRef(null)
  useReveal(ref)
  return (
    <section id="toll" className="sec toll" ref={ref} data-theme="bone" data-chapter="toll">
      <div className="sec-head">
        <div>
          <div className="sec-num">04 — What got out</div>
          <Lines className="sec-title" lines={['What got', <span className="it">out.</span>]} />
        </div>
        <p className="sec-lede reveal-up">
          ตัวเลขทั้งหมดมาจากรายงาน CSB สิ่งที่น่ากลัวที่สุดของหน่วยนี้ไม่ใช่ไฟ แต่เป็นกรดไฮโดรฟลูออริก (HF)
          ที่ถ้าเป็นไอลอยไปถึงชุมชน จะทำร้ายปอดและผิวหนังของคนที่หายใจเข้าไป
        </p>
      </div>

      <div className="toll-hero">
        <div className="toll-big reveal-up">
          <span className="kicker">HF released · กรดที่รั่ว</span>
          <div className="toll-num"><Odometer value={fmt(REL.hf_tot)} /><span className="unit">lb</span></div>
          <p className="muted">ราว {fmt(REL.hf_tot_kg, 0)} กก. ม่านน้ำดักไว้ได้ {fmt((REL.hf_cont / REL.hf_tot) * 100, 0)}% หลังหัวหน้ากะเข้าไปเปิดปั๊มเองตอน 04:39 <Src k="csb" note="CSB p.25" /></p>
        </div>
        <div className="reveal-up"><HfSplit /></div>
      </div>

      <div className="toll-grid">
        {[
          { v: fmt(REL.hc_rel), u: 'lb', k: 'Hydrocarbons released', p: `ไอไฮโดรคาร์บอน (ส่วนใหญ่โพรเพน) ไหม้ไป ${fmt(REL.hc_comb)} lb ที่เหลือ ${fmt(REL.hc_unburned)} lb ลอยขึ้นอากาศ`, s: 'csb' },
          { v: fmt(REL.frag_lb), u: 'lb', k: 'Largest fragment', p: `เศษถัง V-1 ชิ้นหนึ่งหนักราว 17 ตันปลิวข้ามแม่น้ำ เศษที่ไปไกลที่สุดตกห่าง ${fmt(REL.proj_ft)} ฟุต`, s: 'csb' },
          { v: '750', pre: '$', u: 'M', k: 'Property damage', p: 'ค่าเสียหายทรัพย์สินที่ CSB อ้างอิงจาก Marsh ยังไม่รวมกำไรที่หายไปจากการหยุดผลิต', s: 'csb' },
          { v: '0', u: 'deaths', k: 'Casualties', p: 'คนงานบาดเจ็บเล็กน้อย 5 คน เมืองเรียกเหตุครั้งนี้ว่า "a close call" — เกือบร้ายแรง', s: 'city' },
        ].map((d) => (
          <div className="stat reveal-up" key={d.k}>
            <span className="kicker">{d.k}</span>
            <div className="stat-v">{d.pre && <span className="pre">{d.pre}</span>}<Odometer value={d.v} /><span className="unit">{d.u}</span></div>
            <p>{d.p}</p>
            <Src k={d.s} />
          </div>
        ))}
      </div>

      <div className="rad">
        <div className="rad-copy">
          <span className="kicker reveal-up">The barrier that worked</span>
          <Lines as="h3" className="rad-title serif" lines={[<>×{fmt(REL.rad_ratio, 0)}</>]} />
          <p className="reveal-up">
            ระบบถ่ายกรดฉุกเฉิน (RAD) ย้าย HF ราว <b>{fmt(REL.rad_lb)} ปอนด์</b> ออกจากถัง V-10 ไปเก็บในถังที่ปลอดภัยกว่า
            มากกว่าปริมาณที่รั่วออกมา {fmt(REL.rad_ratio, 0)} เท่า ถ้ากรดก้อนนี้อยู่ในถังตอนที่ไฟลุก ผลลัพธ์อาจต่างไปมาก
          </p>
          <div className="legend reveal-up">
            <span><i style={{ background: 'var(--ok)', opacity: 0.55 }} />RAD ย้ายไปเก็บ {fmt(REL.rad_lb)} lb</span>
            <span><i style={{ background: 'var(--ember)' }} />รั่วออกมา {fmt(REL.hf_tot)} lb</span>
          </div>
          <p className="muted small reveal-up">พื้นที่สี่เหลี่ยมเป็นสัดส่วนกับน้ำหนัก <Src k="csb" note="CSB p.20" /></p>
        </div>
        <div className="reveal-up"><RadSquares /></div>
      </div>
      <p className="toll-foot muted reveal-up">ราคาความเสียหาย ${fmt(M.prop_loss / 1e6, 0)}M คือเฉพาะเครื่องจักรและอาคาร บทที่ 08 จะนับเงินที่หายจากการหยุดกลั่นเพิ่มเข้าไป</p>
    </section>
  )
}
