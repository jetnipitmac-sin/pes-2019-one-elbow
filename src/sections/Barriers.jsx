// Chapter 06: the barriers as Swiss-cheese slices. Scroll drives a beam through
// the holes; slices that worked narrow it.
import { useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Lines, Src } from '../components/ui.jsx'
import { seg } from '../lib/scroll.js'

const SL = [
  { k: 'fail', h: ['สเปกวัสดุ', '+ ตรวจ PMI'], s: 'ไม่เคยตรวจธาตุทีละชิ้น' },
  { k: 'fail', h: ['จุดวัด', 'ความหนา'], s: 'ไม่มีบนข้องอที่แตก' },
  { k: 'fail', h: ['ทบทวนของเก่า', 'เมื่อเกณฑ์เปลี่ยน'], s: 'ไม่มีข้อบังคับ' },
  { k: 'fail', h: ['ควบคุม', 'จุดติดไฟ'], s: 'ติดไฟใน 2 นาที' },
  { k: 'fail', h: ['วาล์วตัดแยก', 'ระยะไกล'], s: 'ไม่มี ROIV ขาออก' },
  { k: 'ok', h: ['ถ่ายกรด', 'ฉุกเฉิน (RAD)'], s: 'ย้าย HF 339,000 lb' },
  { k: 'partial', h: ['ม่านน้ำ'], s: 'เปิดด้วยมือ ~04:39' },
  { k: 'fail', h: ['ปกป้อง', 'สายควบคุม'], s: 'ขาดตั้งแต่ลูกไฟแรก' },
  { k: 'fail', h: ['ตัดเชื้อเพลิง', 'ที่จ่อ V-1'], s: 'V-1 ระเบิด 04:22' },
]
const TAG = { fail: '✕ พัง / ไม่มี', partial: '~ บางส่วน', ok: '✓ ทำงาน' }

const W = 1400, H = 600, X0 = 150, DX = 118, SW = 70, TOP = 120, BOT = 430, SKEW = 46, BEAM_Y = 270
// beam half-width after each slice: holes that are smaller than the beam narrow it
const NARROW = { fail: 1, partial: 0.72, ok: 0.5 }

function slicePath(x) {
  // a thin slab seen at an angle: front face as a parallelogram
  return `M${x},${TOP + SKEW} L${x + SW},${TOP} L${x + SW},${BOT} L${x},${BOT + SKEW} Z`
}

export default function Barriers() {
  const sec = useRef(null), svg = useRef(null)
  useLayoutEffect(() => {
    const q = (s) => svg.current.querySelectorAll(s)
    const slices = q('.slice'), labels = q('.sl-label'), beam = svg.current.querySelector('.beam-clip')
    const outs = q('.bt-out')
    const st = ScrollTrigger.create({
      trigger: sec.current,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (s) => {
        const p = s.progress
        slices.forEach((el, i) => {
          const k = seg(p, 0.02 + i * 0.035, 0.1 + i * 0.035)
          el.style.opacity = k
          el.style.transform = `translate(${(1 - k) * 60}px, ${(1 - k) * -30}px)`
        })
        labels.forEach((el, i) => { el.style.opacity = seg(p, 0.06 + i * 0.035, 0.14 + i * 0.035) })
        const bx = X0 - 120 + seg(p, 0.38, 0.86) * (W - X0 + 40)
        beam.setAttribute('width', Math.max(0, bx).toFixed(1))
        outs.forEach((el, i) => { el.style.opacity = seg(p, 0.86 + i * 0.03, 0.92 + i * 0.03) })
        svg.current.style.setProperty('--bp', seg(p, 0.38, 0.86).toFixed(3))
      },
    })
    return () => st.kill()
  }, [])

  // beam polygon that narrows after ok/partial slices
  let half = 34
  const top = [[X0 - 120, BEAM_Y - half]], bot = [[X0 - 120, BEAM_Y + half]]
  SL.forEach((s, i) => {
    const x = X0 + i * DX + SW * 0.5
    top.push([x, BEAM_Y - half]); bot.push([x, BEAM_Y + half])
    half *= NARROW[s.k]
    top.push([x + 6, BEAM_Y - half]); bot.push([x + 6, BEAM_Y + half])
  })
  top.push([W - 60, BEAM_Y - half]); bot.push([W - 60, BEAM_Y + half])
  const beamD = `M${top.map((p) => p.join(',')).join(' L')} L${bot.reverse().map((p) => p.join(',')).join(' L')} Z`

  let hb = 34
  return (
    <section id="barriers" className="barriers" ref={sec} data-theme="ink" data-chapter="barriers">
      <div className="sticky">
        <div className="br-head">
          <div className="sec-num">06 — Layers</div>
          <Lines className="sec-title" lines={['Nine layers.', <span className="it">One held.</span>]} />
          <p className="sec-lede">แบบจำลองชีส (Swiss-cheese) ทุกชั้นป้องกันมีรู เหตุใหญ่เกิดเมื่อรูเรียงกันพอดี ลำแสงแทนอันตรายที่วิ่งผ่าน ชั้นที่ทำงานได้จะทำให้มันแคบลง</p>
        </div>
        <svg ref={svg} className="br-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="ชั้นป้องกัน 9 ชั้น พังหรือไม่มี 7 ชั้น ทำงานบางส่วน 1 ชั้น ทำงาน 1 ชั้น">
          <defs>
            <linearGradient id="beam-g" x1="0" x2="1">
              <stop offset="0" stopColor="#ff5b1f" stopOpacity="0.2" />
              <stop offset="0.5" stopColor="#ff5b1f" stopOpacity="0.85" />
              <stop offset="1" stopColor="#ffb071" stopOpacity="1" />
            </linearGradient>
            <clipPath id="beam-clip"><rect className="beam-clip" x="0" y="0" width="0" height={H} /></clipPath>
            {SL.map((s, i) => {
              const x = X0 + i * DX
              const hw = hb
              hb *= NARROW[s.k]
              const holeR = s.k === 'fail' ? hw + 12 : s.k === 'partial' ? hw * 0.72 + 2 : hw * 0.5 + 2
              const yOff = (BEAM_Y - TOP) / (BOT - TOP)
              const skewAt = SKEW * (1 - yOff)
              return (
                <mask id={`m${i}`} key={i}>
                  <rect x={x - 10} y={TOP - 10} width={SW + 20} height={BOT - TOP + SKEW + 20} fill="#fff" />
                  <ellipse cx={x + SW / 2} cy={BEAM_Y + skewAt * 0.5} rx={SW * 0.36} ry={holeR} fill="#000" />
                  <ellipse cx={x + SW / 2} cy={TOP + 60 + ((i * 37) % 60)} rx={SW * 0.2} ry={14 + (i % 3) * 6} fill="#000" />
                  <ellipse cx={x + SW / 2} cy={BOT - 40 - ((i * 53) % 50)} rx={SW * 0.18} ry={12 + (i % 2) * 8} fill="#000" />
                </mask>
              )
            })}
          </defs>

          {/* the gap between prevention and mitigation = the moment of release */}
          <line x1={X0 + 3 * DX - 24} x2={X0 + 3 * DX - 24} y1={TOP - 60} y2={BOT + 90} className="br-split" />
          <text x={X0 + 3 * DX - 24} y={TOP - 72} className="lbl strong" textAnchor="middle">04:00:16 · ท่อแตก</text>
          <text x={X0 + 1 * DX + SW / 2} y={TOP - 72} className="tick" textAnchor="middle">ก่อนรั่ว · ป้องกัน</text>
          <text x={X0 + 6 * DX} y={TOP - 72} className="tick" textAnchor="middle">หลังรั่ว · ลดความรุนแรง</text>

          <g clipPath="url(#beam-clip)"><path d={beamD} fill="url(#beam-g)" className="beam" /></g>

          {SL.map((s, i) => {
            const x = X0 + i * DX
            return (
              <g key={i} className={`slice sl-${s.k}`}>
                <path d={`M${x + SW},${TOP} L${x + SW + 14},${TOP + 6} L${x + SW + 14},${BOT + 6} L${x + SW},${BOT} Z`} className="sl-side" />
                <path d={slicePath(x)} mask={`url(#m${i})`} className="sl-face" />
              </g>
            )
          })}
          {SL.map((s, i) => {
            const x = X0 + i * DX + SW / 2
            return (
              <g key={i} className="sl-label">
                {s.h.map((line, j) => <text key={j} x={x} y={BOT + 84 + j * 20} className="lbl strong" textAnchor="middle">{line}</text>)}
                <text x={x} y={BOT + 108 + (s.h.length - 1) * 20} className="tick" textAnchor="middle">{s.s}</text>
                <text x={x} y={BOT + 130 + (s.h.length - 1) * 20} className={`tag-t t-${s.k}`} textAnchor="middle">{TAG[s.k]}</text>
              </g>
            )
          })}

          <g className="bt-out"><text x={W - 40} y={BEAM_Y - 64} className="lbl strong" textAnchor="end">ไฟไหม้ + ระเบิด 3 ครั้ง</text></g>
          <g className="bt-out"><text x={W - 40} y={BEAM_Y - 42} className="tick" textAnchor="end">HF ขึ้นอากาศ 3,271 lb</text></g>
          <g className="bt-out"><text x={W - 40} y={BEAM_Y - 22} className="tick" textAnchor="end">ความเสียหาย ~$750M</text></g>
        </svg>
        <div className="br-foot"><Src k="csb" /><span className="muted small">ชื่อชั้นและสถานะตามข้อสรุปของ CSB · ความกว้างของลำแสงเป็นภาพประกอบเชิงคุณภาพ ไม่ใช่ค่าคำนวณ</span></div>
      </div>
    </section>
  )
}
