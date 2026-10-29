// Chapter 08: the bill — lost margin per day, how long a restart takes, what
// moves the answer most, and what the East Coast market did afterwards.
import { useLayoutEffect, useMemo, useRef } from 'react'
import { gsap } from 'gsap'
import { scaleLinear } from 'd3-scale'
import { line as d3line } from 'd3-shape'
import { Lines, Odometer, Src, tip, useReveal } from '../components/ui.jsx'
import { M, EIA, CMP, fmt } from '../lib/data.js'

const CASES_SHORT = ['Tesoro Anacortes', 'Chevron Richmond', 'ExxonMobil Torrance', 'Husky Superior']

// ---------------------------------------------------------------- cumulative loss
function Cumulative() {
  const ref = useRef(null), hair = useRef(null)
  const W = 1100, H = 440, P = { l: 70, r: 30, t: 24, b: 46 }
  const DAYS = 800
  const x = scaleLinear().domain([0, DAYS]).range([P.l, W - P.r])
  const y = scaleLinear().domain([0, 3.2e9]).range([H - P.b, P.t])
  const be = M.breakeven_days
  useLayoutEffect(() => {
    const ln = ref.current.querySelector('.cu-line')
    const len = ln.getTotalLength()
    gsap.set(ln, { strokeDasharray: len, strokeDashoffset: len })
    const q = (s) => ref.current.querySelectorAll(s)
    gsap.set(q('.cu-late'), { opacity: 0 })
    const tl = gsap.timeline({ scrollTrigger: { trigger: ref.current, start: 'top 70%', end: 'bottom 60%', scrub: 1 } })
    tl.to(ln, { strokeDashoffset: 0, ease: 'none', duration: 1 })
      .to(q('.cu-late'), { opacity: 1, stagger: 0.05, duration: 0.2 }, 0.25)
    return () => { tl.scrollTrigger?.kill(); tl.kill() }
  }, [])
  const move = (e) => {
    const svg = ref.current
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY
    const p = pt.matrixTransform(svg.getScreenCTM().inverse())
    const d = Math.max(0, Math.min(DAYS, x.invert(p.x)))
    hair.current.setAttribute('transform', `translate(${x(d)},0)`)
    hair.current.style.opacity = 1
    hair.current.querySelector('circle').setAttribute('cy', y(M.gm_day * d))
    tip.show(`<b>วันที่ ${fmt(d, 0)}</b><br>กำไรขั้นต้นที่หาย $${fmt((M.gm_day * d) / 1e9, 2)}B`, e.clientX, e.clientY)
  }
  return (
    <svg ref={ref} className="chart cu" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="กำไรขั้นต้นที่หายสะสมตามจำนวนวันที่หยุดกลั่น เทียบค่าเสียหายทรัพย์สิน">
      {[0, 1e9, 2e9, 3e9].map((v) => (
        <g key={v}><line className="grid" x1={P.l} x2={W - P.r} y1={y(v)} y2={y(v)} /><text className="tick" x={P.l - 10} y={y(v) + 4} textAnchor="end">${v / 1e9}B</text></g>
      ))}
      {[0, 200, 400, 600, 800].map((d) => <text key={d} className="tick" x={x(d)} y={H - P.b + 22} textAnchor="middle">{d}</text>)}
      <text className="tick" x={W - P.r} y={H - 8} textAnchor="end">วันที่หยุดกลั่น</text>

      {/* property loss reference */}
      <line className="ref-strong" x1={P.l} x2={W - P.r} y1={y(M.prop_loss)} y2={y(M.prop_loss)} />
      <text className="lbl strong" x={W - P.r} y={y(M.prop_loss) - 8} textAnchor="end">ค่าเสียหายทรัพย์สิน $750M</text>

      {/* restart reference class */}
      {M.cases.map((c, i) => c.days <= DAYS && (
        <g key={c.name} className="cu-late hoverable" onPointerMove={(e) => tip.show(`<b>${CASES_SHORT[i]}</b><br>กลับมาเดินเครื่องหลัง ${fmt(c.days)} วัน`, e.clientX, e.clientY)} onPointerLeave={() => tip.hide()}>
          <line className="case-ln" x1={x(c.days)} x2={x(c.days)} y1={P.t + 30} y2={H - P.b} />
          <rect x={x(c.days) - 8} y={P.t} width="16" height={H - P.t - P.b} fill="transparent" />
          <text className="tick" x={x(c.days) + 6} y={P.t + 26 + i * 16}>{CASES_SHORT[i]} · {c.days} วัน</text>
        </g>
      ))}
      <g className="cu-late">
        <text className="tick" x={W - P.r} y={P.t + 74} textAnchor="end">Husky Superior · {fmt(M.cases[3].days)} วัน →</text>
      </g>

      <path className="cu-line" d={`M${x(0)},${y(0)} L${x(DAYS)},${y(M.gm_day * DAYS)}`} />

      {/* break-even and the median case */}
      <g className="cu-late">
        <circle className="dt dt-ember" cx={x(be)} cy={y(M.prop_loss)} r="6" />
        <text className="lbl strong" x={x(be) + 14} y={y(M.prop_loss) + 28}>วันที่ {fmt(be, 0)}: กำไรที่หาย = ค่าซ่อม</text>
        <circle className="dt dt-ink" cx={x(M.dt_median)} cy={y(M.loss_median)} r="6" />
        <text className="lbl strong" x={x(M.dt_median) + 12} y={y(M.loss_median) + 4}>มัธยฐาน {M.dt_median} วัน → ${fmt(M.loss_median / 1e9, 2)}B</text>
      </g>

      <g ref={hair} className="hair" style={{ opacity: 0 }}>
        <line y1={P.t} y2={H - P.b} />
        <circle r="5" cx="0" cy="0" className="dt dt-ember" />
      </g>
      <rect x={P.l} y={P.t} width={W - P.l - P.r} height={H - P.t - P.b} fill="transparent" onPointerMove={move}
        onPointerLeave={() => { hair.current.style.opacity = 0; tip.hide() }} />
    </svg>
  )
}

// ---------------------------------------------------------------- tornado
function Tornado() {
  const ref = useRef(null)
  const W = 640, H = 220, P = { l: 150, r: 30, t: 30, b: 34 }
  const x = scaleLinear().domain([0.5e9, 7.2e9]).range([P.l, W - P.r])
  const base = M.sens_base
  const rows = [
    { k: 'เวลาซ่อม', d: M.sens.days, lo: `${M.sens.days[2]} วัน`, hi: `${fmt(M.sens.days[3])} วัน` },
    { k: 'crack spread', d: M.sens.crack, lo: `$${fmt(M.sens.crack[2], 1)}`, hi: `$${fmt(M.sens.crack[3], 1)}/bbl` },
    { k: 'อัตราการเดินเครื่อง', d: M.sens.util, lo: `${fmt(M.sens.util[2] * 100, 0)}%`, hi: '100%' },
  ]
  useLayoutEffect(() => {
    const bars = ref.current.querySelectorAll('.bar')
    gsap.set(bars, { scaleX: 0 })
    const tw = gsap.to(bars, { scaleX: 1, duration: 1.2, ease: 'expo.out', stagger: 0.1, scrollTrigger: { trigger: ref.current, start: 'top 80%', once: true } })
    return () => { tw.scrollTrigger?.kill(); tw.kill() }
  }, [])
  return (
    <svg ref={ref} className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="ตัวแปรที่มีผลต่อกำไรที่หายมากที่สุด">
      {[1e9, 3e9, 5e9, 7e9].map((v) => (
        <g key={v}><line className="grid" x1={x(v)} x2={x(v)} y1={P.t - 6} y2={H - P.b} /><text className="tick" x={x(v)} y={H - P.b + 20} textAnchor="middle">${v / 1e9}B</text></g>
      ))}
      {rows.map((r, i) => {
        const yy = P.t + i * 52
        return (
          <g key={r.k} className="hoverable" onPointerMove={(e) => tip.show(`<b>${r.k}</b><br>${r.lo} → $${fmt(r.d[0] / 1e9, 2)}B<br>${r.hi} → $${fmt(r.d[1] / 1e9, 2)}B`, e.clientX, e.clientY)} onPointerLeave={() => tip.hide()}>
            <text className="lbl" x={P.l - 12} y={yy + 16} textAnchor="end">{r.k}</text>
            <rect className="bar bar-steel" x={x(r.d[0])} y={yy} width={Math.max(2, x(base) - x(r.d[0]) - 1)} height="22" rx="4" style={{ transformOrigin: `${x(base)}px 0` }} />
            {r.d[1] > base && <rect className="bar bar-ember" x={x(base) + 1} y={yy} width={x(r.d[1]) - x(base) - 1} height="22" rx="4" style={{ transformOrigin: `${x(base)}px 0` }} />}
          </g>
        )
      })}
      <line className="ref-strong" x1={x(base)} x2={x(base)} y1={P.t - 14} y2={H - P.b} />
      <text className="tick strong" x={x(base) + 6} y={P.t - 16}>กรณีกลาง ${fmt(base / 1e9, 2)}B</text>
    </svg>
  )
}

// ---------------------------------------------------------------- EIA small multiples
function Market({ k, title, unit, cmp }) {
  const ref = useRef(null), hair = useRef(null)
  const W = 520, H = 220, P = { l: 46, r: 14, t: 18, b: 30 }
  const data = EIA
  const x = scaleLinear().domain([0, data.length - 1]).range([P.l, W - P.r])
  const vals = data.map((d) => d[k])
  const lo = Math.min(...vals), hi = Math.max(...vals)
  const y = scaleLinear().domain([Math.floor((lo * 0.9) / 100) * 100, Math.ceil((hi * 1.05) / 100) * 100]).range([H - P.b, P.t]).nice()
  const d = useMemo(() => d3line().x((_, i) => x(i)).y((v) => y(v))(vals), [vals, x, y])
  const iJun = data.findIndex((m) => m.m === '2019-06')
  const iH2a = data.findIndex((m) => m.m === '2018-07'), iH2b = data.findIndex((m) => m.m === '2019-07')
  useLayoutEffect(() => {
    const ln = ref.current.querySelector('.mk-line')
    const len = ln.getTotalLength()
    gsap.set(ln, { strokeDasharray: len, strokeDashoffset: len })
    const tw = gsap.to(ln, { strokeDashoffset: 0, duration: 2, ease: 'power2.inOut', scrollTrigger: { trigger: ref.current, start: 'top 82%', once: true } })
    return () => { tw.scrollTrigger?.kill(); tw.kill() }
  }, [])
  const move = (e) => {
    const svg = ref.current
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY
    const p = pt.matrixTransform(svg.getScreenCTM().inverse())
    const i = Math.max(0, Math.min(data.length - 1, Math.round(x.invert(p.x))))
    hair.current.setAttribute('transform', `translate(${x(i)},0)`)
    hair.current.querySelector('circle').setAttribute('cy', y(vals[i]))
    hair.current.style.opacity = 1
    tip.show(`<b>${data[i].m}</b><br>${fmt(vals[i])} ${unit}`, e.clientX, e.clientY)
  }
  const up = cmp.pct > 0
  return (
    <figure className="mk">
      <figcaption>
        <span className="kicker">{title}</span>
        <span className={`mk-delta ${up ? 'up' : 'down'}`}>{up ? '+' : '−'}{fmt(Math.abs(cmp.pct), 0)}%</span>
        <span className="muted small">ก.ค.–ธ.ค. 2019 เทียบ 2018</span>
      </figcaption>
      <svg ref={ref} className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${title} รายเดือน 2018–2020`}>
        <rect x={x(iH2a)} width={x(iH2a + 5) - x(iH2a)} y={P.t} height={H - P.t - P.b} className="band" />
        <rect x={x(iH2b)} width={x(iH2b + 5) - x(iH2b)} y={P.t} height={H - P.t - P.b} className="band band-ember" />
        {y.ticks(4).map((v) => (
          <g key={v}><line className="grid" x1={P.l} x2={W - P.r} y1={y(v)} y2={y(v)} /><text className="tick" x={P.l - 8} y={y(v) + 4} textAnchor="end">{fmt(v)}</text></g>
        ))}
        {[0, 12, 24].map((i) => <text key={i} className="tick" x={x(i)} y={H - 8} textAnchor="start">{data[i].m.slice(0, 4)}</text>)}
        <line className="ref-strong" x1={x(iJun)} x2={x(iJun)} y1={P.t} y2={H - P.b} />
        <text className="tick strong" x={x(iJun) + 5} y={P.t + 10}>มิ.ย. 2019</text>
        <path d={d} className="mk-line" />
        <g ref={hair} className="hair" style={{ opacity: 0 }}><line y1={P.t} y2={H - P.b} /><circle r="4.5" cx="0" cy="0" className="dt dt-ink" /></g>
        <rect x={P.l} y={P.t} width={W - P.l - P.r} height={H - P.t - P.b} fill="transparent" onPointerMove={move} onPointerLeave={() => { hair.current.style.opacity = 0; tip.hide() }} />
      </svg>
    </figure>
  )
}

export default function Cost() {
  const ref = useRef(null)
  useReveal(ref)
  return (
    <section id="cost" className="sec cost" ref={ref} data-theme="bone" data-chapter="cost">
      <div className="sec-head">
        <div>
          <div className="sec-num">08 — The bill</div>
          <Lines className="sec-title" lines={['The repair', <>was the <span className="it">cheap part.</span></>]} />
        </div>
        <p className="sec-lede reveal-up">
          ค่าซ่อม $750M ฟังดูเยอะ แต่โรงกลั่นที่หยุดเดินเครื่องเสียกำไรขั้นต้นทุกวัน ใช้ crack spread เฉลี่ยปี 2019 ($
          {fmt(M.crack_2019, 2)}/bbl) คูณกำลังกลั่น {fmt(M.cap)} บาร์เรลต่อวัน
        </p>
      </div>

      <div className="cost-kpis">
        <div className="stat big reveal-up">
          <span className="kicker">Gross margin lost / day</span>
          <div className="stat-v"><span className="pre">$</span><Odometer value={fmt(M.gm_day / 1e6, 1)} /><span className="unit">M</span></div>
          <p>รายได้จากการขายหายไปวันละราว ${fmt(M.rev_day / 1e6, 1)}M</p>
        </div>
        <div className="stat big reveal-up">
          <span className="kicker">Break-even vs repair</span>
          <div className="stat-v"><Odometer value={fmt(M.breakeven_days, 0)} /><span className="unit">วัน</span></div>
          <p>หลังจากนี้ เงินที่หายจากการหยุดกลั่นมากกว่าค่าซ่อมแล้ว</p>
        </div>
        <div className="stat big reveal-up">
          <span className="kicker">Median restart case</span>
          <div className="stat-v"><span className="pre">$</span><Odometer value={fmt(M.loss_median / 1e9, 2)} /><span className="unit">B</span></div>
          <p>ถ้าซ่อม {M.dt_median} วันแบบกรณีกลาง เกือบสองเท่าของค่าซ่อม</p>
        </div>
      </div>

      <figure className="cost-fig reveal-up">
        <figcaption className="fig-cap">
          <span className="kicker">Cumulative lost gross margin</span>
          <span className="muted small">เส้นแนวตั้ง = เวลาที่โรงกลั่นอื่นใช้กลับมาเดินเครื่องหลังเหตุคล้ายกัน · ชี้ที่กราฟเพื่อดูรายวัน</span>
        </figcaption>
        <Cumulative />
        <div className="fig-src"><Src k={['calc', 'tesoro', 'richmond', 'torrance', 'superior']} /></div>
      </figure>

      <div className="cost-row">
        <div className="reveal-up">
          <span className="kicker">What moves the number</span>
          <h3 className="serif sub-title">Time beats <span className="it">price.</span></h3>
          <p>เปลี่ยนสมมติฐานทีละตัว เวลาซ่อมกว้างกว่าราคาน้ำมันมาก ถ้าจะลดความไม่แน่นอน ต้องรู้เวลากลับมาเดินเครื่องให้แม่นก่อน</p>
          <div className="legend"><span><i style={{ background: 'var(--steel)' }} />ค่าต่ำ</span><span><i style={{ background: 'var(--ember)' }} />ค่าสูง</span></div>
          <Tornado />
          <Src k="calc" />
        </div>
        <div className="reveal-up">
          <span className="kicker">The market moved on</span>
          <h3 className="serif sub-title">Ships filled <span className="it">the gap.</span></h3>
          <p>ครึ่งปีหลัง 2019 ฝั่งตะวันออกกลั่นน้อยลง {fmt(-CMP.runs.diff, 0)} พันบาร์เรล/วัน และนำเข้าเบนซินเพิ่ม {fmt(CMP.gimp.diff, 0)} พันบาร์เรล/วัน แถบส้มคือช่วงที่เทียบ</p>
          <div className="mk-grid">
            <Market k="runs" title="East Coast crude runs · kb/d" unit="kb/d" cmp={CMP.runs} />
            <Market k="gimp" title="Gasoline imports · kb/d" unit="kb/d" cmp={CMP.gimp} />
          </div>
          <Src k={['eiaRuns', 'eiaImp', 'eia2019']} />
        </div>
      </div>
    </section>
  )
}
