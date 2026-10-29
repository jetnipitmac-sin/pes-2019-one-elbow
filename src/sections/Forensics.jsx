// Chapter 05: why this one elbow — three pieces of evidence plus the standards gap.
import { useLayoutEffect, useMemo, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Lines, Odometer, Src, tip, useReveal } from '../components/ui.jsx'
import { C, fmt } from '../lib/data.js'

function useGrow(ref, sel, from = { scaleX: 0 }) {
  useLayoutEffect(() => {
    const els = ref.current.querySelectorAll(sel)
    gsap.set(els, from)
    const tw = gsap.to(els, { scaleX: 1, scaleY: 1, opacity: 1, duration: 1.3, ease: 'expo.out', stagger: 0.12, scrollTrigger: { trigger: ref.current, start: 'top 82%', once: true } })
    return () => { tw.scrollTrigger?.kill(); tw.kill() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

const hover = (html) => ({
  onPointerMove: (e) => tip.show(html, e.clientX, e.clientY),
  onPointerLeave: () => tip.hide(),
  className: 'hoverable',
})

// ---------------------------------------------------------------- exhibit A: chemistry
function Chem() {
  const ref = useRef(null)
  useGrow(ref, '.bar')
  const W = 520, L = 110, R = 64, max = 2.8
  const x = (v) => L + (v / max) * (W - L - R)
  const rows = [['นิกเกิล (Ni)', C.ni], ['ทองแดง (Cu)', C.cu], ['Ni + Cu', C.cuni]]
  return (
    <svg ref={ref} viewBox={`0 0 ${W} 170`} className="chart" role="img" aria-label="ธาตุปนในข้องอเทียบเกณฑ์">
      {[0, 1, 2].map((v) => (
        <g key={v}><line className="grid" x1={x(v)} x2={x(v)} y1="8" y2="136" /><text className="tick" x={x(v)} y="154" textAnchor="middle">{v}%</text></g>
      ))}
      {rows.map(([k, v], i) => {
        const y = 22 + i * 40
        return (
          <g key={k} {...hover(`<b>${k}</b><br>${v}% โดยน้ำหนัก`)}>
            <rect x={L} y={y - 4} width={W - L - R} height="32" fill="transparent" />
            <text className="lbl" x={L - 12} y={y + 15} textAnchor="end">{k}</text>
            <rect className="bar bar-ember" x={L} y={y} width={x(v) - L} height="22" rx="4" style={{ transformOrigin: `${L}px 0` }} />
            <text className="val" x={x(v) + 8} y={y + 16}>{v}%</text>
          </g>
        )
      })}
      <line className="ref-strong" x1={x(C.cuni_limit)} x2={x(C.cuni_limit)} y1="4" y2="140" />
      <text className="tick strong" x={x(C.cuni_limit) + 6} y="12">เกณฑ์ Cu + Ni &lt; {C.cuni_limit}%</text>
    </svg>
  )
}

// ---------------------------------------------------------------- exhibit B: corrosion rate
function Rate() {
  const ref = useRef(null)
  useGrow(ref, '.bar')
  const W = 520, L = 110, R = 72, max = 7.5
  const x = (v) => L + (v / max) * (W - L - R)
  return (
    <svg ref={ref} viewBox={`0 0 ${W} 130`} className="chart" role="img" aria-label="อัตราการกัดกร่อน ข้องอ เทียบ ท่อข้างๆ">
      {[0, 2, 4, 6].map((v) => (
        <g key={v}><line className="grid" x1={x(v)} x2={x(v)} y1="8" y2="96" /><text className="tick" x={x(v)} y="114" textAnchor="middle">{v}</text></g>
      ))}
      <text className="tick" x={W - R + 8} y="114">mpy</text>
      <g {...hover(`<b>ข้องอที่แตก</b><br>${fmt(C.rate_mpy, 2)} mpy (เฉลี่ย 1973–2019)`)}>
        <text className="lbl" x={L - 12} y="38" textAnchor="end">ข้องอ</text>
        <rect className="bar bar-ember" x={L} y="22" width={x(C.rate_mpy) - L} height="22" rx="4" style={{ transformOrigin: `${L}px 0` }} />
        <text className="val" x={x(C.rate_mpy) + 8} y="38">{fmt(C.rate_mpy, 1)}</text>
      </g>
      <g {...hover(`<b>ท่อที่ต่ออยู่ข้างๆ</b><br>${fmt(C.adj_mpy[0], 2)}–${fmt(C.adj_mpy[1], 2)} mpy`)}>
        <text className="lbl" x={L - 12} y="78" textAnchor="end">ท่อข้างๆ</text>
        <rect className="bar bar-steel" x={x(C.adj_mpy[0])} y="62" width={x(C.adj_mpy[1]) - x(C.adj_mpy[0])} height="22" rx="4" style={{ transformOrigin: `${x(C.adj_mpy[0])}px 0` }} />
        <text className="val" x={x(C.adj_mpy[1]) + 8} y="78">{fmt(C.adj_mpy[0], 2)}–{fmt(C.adj_mpy[1], 2)}</text>
      </g>
    </svg>
  )
}

// ---------------------------------------------------------------- exhibit C: where they measured
const ROUTE = [[24, 236], [160, 236], [160, 132], [318, 132], [318, 236], [452, 236], [452, 64], [560, 64]]
const FAILED = 3 // index of the corner that failed (318,132)
function cmlDots(n) {
  const segs = []
  let total = 0
  for (let i = 0; i < ROUTE.length - 1; i++) {
    const [a, b] = [ROUTE[i], ROUTE[i + 1]]
    const len = Math.hypot(b[0] - a[0], b[1] - a[1])
    segs.push({ a, b, len, s0: total })
    total += len
  }
  const [fx, fy] = ROUTE[FAILED]
  for (let k = n; k < n * 2; k++) {
    const pts = []
    for (let j = 0; j < k; j++) {
      const s = ((j + 0.5) / k) * total
      const sg = segs.find((g) => s <= g.s0 + g.len) || segs[segs.length - 1]
      const f = (s - sg.s0) / sg.len
      const p = [sg.a[0] + (sg.b[0] - sg.a[0]) * f, sg.a[1] + (sg.b[1] - sg.a[1]) * f]
      if (Math.hypot(p[0] - fx, p[1] - fy) > 26) pts.push(p)
    }
    if (pts.length >= n) return pts.slice(0, n)
  }
  return []
}
function Coverage() {
  const ref = useRef(null)
  const dots = useMemo(() => cmlDots(C.cml_2019), [])
  useLayoutEffect(() => {
    const ds = ref.current.querySelectorAll('.cml')
    gsap.set(ds, { scale: 0, transformOrigin: 'center', transformBox: 'fill-box' })
    const tw = gsap.to(ds, { scale: 1, duration: 0.5, ease: 'back.out(3)', stagger: 0.012, scrollTrigger: { trigger: ref.current, start: 'top 80%', once: true } })
    return () => { tw.scrollTrigger?.kill(); tw.kill() }
  }, [])
  const d = ROUTE.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join('')
  const [fx, fy] = ROUTE[FAILED]
  return (
    <svg ref={ref} viewBox="0 0 584 280" className="chart" role="img" aria-label={`จุดวัดความหนา ${C.cml_2019} จุดในวงจรท่อ ไม่มีจุดใดอยู่บนข้องอที่แตก`}>
      <path d={d} className="route" />
      <path d={d} className="route-core" />
      {dots.map(([x, y], i) => <circle key={i} className="cml" cx={x} cy={y} r="3.4" />)}
      <g {...hover('<b>ข้องอที่แตก</b><br>ไม่มีจุดวัดความหนา (CML) เลย')}>
        <circle cx={fx} cy={fy} r="24" className="miss-ring" />
        <circle cx={fx} cy={fy} r="7" className="miss-core" />
      </g>
      <line x1={fx - 18} y1={fy - 18} x2={fx - 52} y2={fy - 70} className="leader ember" />
      <text x={fx - 56} y={fy - 78} className="lbl strong" textAnchor="end">ข้องอที่แตก · 0 จุด</text>
      <g className="legend-svg" transform="translate(24 30)">
        <circle cx="6" cy="0" r="3.4" className="cml" /><text x="16" y="4" className="tick">จุดวัดความหนา (CML)</text>
      </g>
    </svg>
  )
}

// ---------------------------------------------------------------- the standards gap
const STD = [
  { y: 1973, h: 'ติดตั้งข้องอ', s: 'ยังไม่มีเกณฑ์ Cu/Ni', up: true },
  { y: 1994, h: 'บางกว่าเกณฑ์', s: 'คำนวณจากอัตราเฉลี่ย', up: false, ember: true },
  { y: 2003, h: 'งานวิจัย NACE', s: 'Cu + Ni < 0.15%', up: true },
  { y: 2007, h: 'API RP 751', s: 'ใส่เรื่องนี้ครั้งแรก', up: false },
  { y: 2013, h: 'API RP 751', s: 'เพิ่มรายละเอียด', up: true },
  { y: 2019, h: 'ข้องอแตก', s: '21 มิ.ย.', up: false, ember: true },
  { y: 2021, h: 'API RP 751', s: 'บังคับ PMI ทุกชิ้นส่วน HF', up: true },
]
function Standards() {
  const ref = useRef(null)
  const W = 1100, L = 30, R = 30
  const x = (y) => L + ((y - 1970) / (2024 - 1970)) * (W - L - R)
  useLayoutEffect(() => {
    const q = (s) => ref.current.querySelectorAll(s)
    gsap.set(q('.std-axis'), { scaleX: 0, transformOrigin: '0 0' })
    gsap.set(q('.std-ev'), { opacity: 0, y: 10 })
    gsap.set(q('.std-gap'), { scaleX: 0, transformOrigin: `${x(2003)}px 0` })
    const tl = gsap.timeline({ scrollTrigger: { trigger: ref.current, start: 'top 80%', once: true } })
    tl.to(q('.std-axis'), { scaleX: 1, duration: 1.4, ease: 'expo.inOut' })
      .to(q('.std-ev'), { opacity: 1, y: 0, duration: 0.7, stagger: 0.12, ease: 'expo.out' }, '-=0.6')
      .to(q('.std-gap'), { scaleX: 1, duration: 1.2, ease: 'expo.inOut' }, '-=0.4')
    return () => { tl.scrollTrigger?.kill(); tl.kill() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const mid = 120
  return (
    <svg ref={ref} viewBox={`0 0 ${W} 250`} className="chart std" role="img" aria-label="เส้นเวลามาตรฐานเรื่องธาตุปนในเหล็กสำหรับงาน HF">
      <rect className="std-gap" x={x(2003)} y={mid - 8} width={x(2019) - x(2003)} height="44" rx="4" />
      <text className="lbl strong std-ev" x={(x(2003) + x(2019)) / 2} y={mid + 26} textAnchor="middle">16 ปีที่มีเกณฑ์ แต่ไม่ย้อนตรวจของเก่า</text>
      <line className="std-axis" x1={L} x2={W - R} y1={mid} y2={mid} />
      {[1970, 1980, 1990, 2000, 2010].map((y) => <text key={y} className="tick" x={x(y)} y={mid - 10} textAnchor="middle">{y}</text>)}
      {STD.map((e) => {
        const ty = e.up ? mid - 66 : mid + 80
        return (
          <g key={e.y + e.h} className="std-ev">
            <line className={e.ember ? 'leader ember' : 'leader'} x1={x(e.y)} x2={x(e.y)} y1={e.up ? mid - 44 : mid + 40} y2={e.up ? mid - 18 : mid + 60} />
            <circle className={e.ember ? 'dt dt-ember' : 'dt dt-ink'} cx={x(e.y)} cy={mid} r="5" />
            <text className="lbl strong" x={x(e.y)} y={ty} textAnchor="middle">{e.y} · {e.h}</text>
            <text className="tick" x={x(e.y)} y={ty + 18} textAnchor="middle">{e.s}</text>
          </g>
        )
      })}
    </svg>
  )
}

export default function Forensics() {
  const ref = useRef(null)
  useReveal(ref)
  // the spinning SVG parts repaint every frame, so they only run while this section is on screen
  useLayoutEffect(() => {
    const t = ScrollTrigger.create({ trigger: ref.current, start: 'top bottom', end: 'bottom top', toggleClass: 'live' })
    return () => t.kill()
  }, [])
  return (
    <section id="forensics" className="sec forensics" ref={ref} data-theme="bone" data-chapter="forensics">
      <div className="sec-head">
        <div>
          <div className="sec-num">05 — Why this elbow</div>
          <Lines className="sec-title" lines={['Three pieces', <>of <span className="it">evidence.</span></>]} />
        </div>
        <p className="sec-lede reveal-up">
          ท่อในหน่วยเดียวกันอายุเท่ากัน สัมผัสกรดตัวเดียวกัน แต่มีชิ้นเดียวที่บางจนแตก CSB ผ่าข้องอชิ้นนั้นออกมาวิเคราะห์ และพบคำตอบสามข้อที่ต่อกันเป็นโซ่
        </p>
      </div>

      <div className="exhibits">
        <article className="exhibit reveal-up">
          <header><span className="ex-tag mono">Exhibit A</span><span className="kicker">Chemistry</span></header>
          <h3 className="serif">Wrong steel, <span className="it">same stamp.</span></h3>
          <p>ข้องอมีนิกเกิลกับทองแดงปนรวม <b>{C.cuni}%</b> เกินเกณฑ์ที่งานวิจัยปี 2003 แนะนำราว 17 เท่า จากข้างนอกดูไม่ออกเลย เพราะมีตราประทับ WPB เหมือนข้อต่อปกติทุกตัว</p>
          <Chem />
          <Src k="csb" note="CSB p.36" />
        </article>
        <article className="exhibit reveal-up">
          <header><span className="ex-tag mono">Exhibit B</span><span className="kicker">Corrosion rate</span></header>
          <h3 className="serif">{fmt(C.ratio[0], 0)}–{fmt(C.ratio[1], 0)}× <span className="it">faster.</span></h3>
          <p>ปกติเหล็กที่โดน HF จะมีชั้นฟลูออไรด์บางๆ เคลือบไว้ ธาตุสองตัวนี้ทำให้ชั้นนั้นไม่ทำงาน ข้องอจึงบางลงเฉลี่ย <b>{fmt(C.rate_mpy, 1)} mpy</b> (มิลลินิ้วต่อปี)</p>
          <Rate />
          <p className="muted small">คำนวณจาก (0.322 − 0.011) ÷ 46 ปี <Src k={['csb', 'calc']} /></p>
        </article>
        <article className="exhibit exhibit-wide reveal-up">
          <header><span className="ex-tag mono">Exhibit C</span><span className="kicker">Inspection coverage</span></header>
          <div className="ex-split">
            <div>
              <h3 className="serif">Measured everywhere, <span className="it">except there.</span></h3>
              <p>โรงกลั่นวัดความหนาท่อที่จุดที่กำหนดไว้ (CML) ในวงจรนี้จุดวัดเพิ่มจาก</p>
              <div className="cml-count">
                <Odometer value={String(C.cml_2002)} /><span className="mono muted">2002</span>
                <span className="arrow">→</span>
                <Odometer value={String(C.cml_2019)} delay={0.4} /><span className="mono muted">2019</span>
              </div>
              <p>ทุกจุดบอกว่าปกติ เพราะไม่มีจุดไหนอยู่บนข้องอที่แตก การวัดจุดเดิมให้ถี่ขึ้นจึงไม่มีวันเจอ ปัญหาคือ<b>ครอบคลุมไม่ครบ</b> ไม่ใช่ตรวจไม่บ่อย</p>
              <Src k="csb" />
            </div>
            <div className="ex-fig">
              <Coverage />
              <p className="muted small">แผนผังจำลอง ตำแหน่งจุดไม่ตรงกับของจริง จำนวนจุดตามรายงาน</p>
            </div>
          </div>
        </article>
      </div>

      <div className="std-block">
        <div className="std-head">
          <span className="kicker reveal-up">The gap · ช่องว่างของมาตรฐาน</span>
          <p className="reveal-up">ข้องอชิ้นนี้ไม่ได้ผิดสเปกในวันที่ติดตั้ง เกณฑ์มาทีหลัง แต่ไม่มีข้อไหนบังคับให้ย้อนกลับไปตรวจของที่ใช้อยู่แล้ว</p>
        </div>
        <div className="reveal-up"><Standards /></div>
        <Src k="csb" />
      </div>
    </section>
  )
}
