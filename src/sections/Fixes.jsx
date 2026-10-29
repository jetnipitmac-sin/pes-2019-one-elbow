// Chapter 09: what to fix first, what prevention is worth, and the lessons.
import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { Lines, Src, useReveal } from '../components/ui.jsx'
import { M, fmt, annuity } from '../lib/data.js'

const TIERS = [
  { n: '01', lv: 'กำจัดอันตราย', en: 'Eliminate', h: 'วิเคราะห์ทางเลือกที่ปลอดภัยกว่า (STAA) และอาจเลิกใช้ HF', p: 'ทางเดียวที่ทำให้อันตรายจากไอพิษหายไปจริง แต่ต้องลงทุนและใช้เวลา 2–5 ปี CSB แนะนำให้ทำ STAA ทุก 5 ปี', when: '2–5 ปี', src: ['csb', 'tce', 'ogjIso'] },
  { n: '02', lv: 'ป้องกันไม่ให้รั่ว', en: 'Prevent', h: 'ตรวจวัสดุ (PMI) และวัดความหนาทุกชิ้นในส่วน HF', p: 'จับชิ้นที่ผิดปกติให้ได้ก่อนมันจะแตก ทำได้ภายในไม่กี่สัปดาห์ถึงเดือน ตรงกับ API RP 751 ฉบับปี 2021', when: '0–3 เดือน', src: ['csb', 'api578'] },
  { n: '03', lv: 'ลดความรุนแรง', en: 'Mitigate', h: 'ROIV ที่แหล่งไฮโดรคาร์บอน · ม่านน้ำที่รอดจากไฟ · เก็บ RAD ไว้', p: 'ถ้ารั่วแล้ว ต้องตัดแยกได้จากที่ปลอดภัย และระบบป้องกันต้องยังทำงานได้แม้สายไฟโดนไฟ', when: '6–18 เดือน', src: ['csb', 'hse'] },
  { n: '04', lv: 'การบริหาร', en: 'Manage', h: 'เช็กมาตรฐานใหม่ทุกปี · ถามว่า "ระบบนี้รอดจากเหตุไหม" ใน PHA · แผนพื้นที่ฉุกเฉิน', p: 'ปิดช่องที่ทำให้ความรู้ปี 2003 เดินทางไม่ถึงท่อที่ติดตั้งปี 1973', when: 'ทุกปี', src: ['csb', 'osha'] },
]

function Hierarchy() {
  const [open, setOpen] = useState(1)
  return (
    <ol className="tiers">
      {TIERS.map((t, i) => (
        <li key={t.n} className={`tier${open === i ? ' open' : ''}`} style={{ '--w': `${100 - i * 6}%` }}>
          <button className="tier-head" onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i} data-cursor={open === i ? 'ปิด' : 'เปิด'}>
            <span className="tier-n mono">{t.n}</span>
            <span className="tier-en serif">{t.en}</span>
            <span className="tier-lv">{t.lv}</span>
            <span className="tier-when mono">{t.when}</span>
            <span className="tier-plus" aria-hidden="true" />
          </button>
          <div className="tier-body">
            <div>
              <h4>{t.h}</h4>
              <p>{t.p}</p>
              <Src k={t.src} />
            </div>
          </div>
        </li>
      ))}
    </ol>
  )
}

// defined at module level so React keeps the same <input> while dragging
function Range({ label, value, show, min, max, step, onChange }) {
  return (
    <label className="rng">
      <span className="rng-top"><span>{label}</span><output className="mono">{show}</output></span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)}
        style={{ '--fill': `${((value - min) / (max - min)) * 100}%` }} data-cursor="ลาก" />
    </label>
  )
}

function Calculator() {
  const [f, setF] = useState(1e-2)
  const [cut, setCut] = useState(0.9)
  const [rate, setRate] = useState(0.08)
  const [yrs, setYrs] = useState(20)
  const out = useMemo(() => {
    const eal = f * M.c_total
    const avoided = cut * eal
    return { eal, avoided, ann: annuity(rate, yrs), pv: avoided * annuity(rate, yrs) }
  }, [f, cut, rate, yrs])
  const big = useRef(null)
  const shown = useRef({ v: out.pv })
  useLayoutEffect(() => {
    const tw = gsap.to(shown.current, {
      v: out.pv, duration: 0.8, ease: 'expo.out',
      onUpdate: () => { if (big.current) big.current.textContent = fmt(shown.current.v / 1e6, 1) },
    })
    return () => tw.kill()
  }, [out.pv])
  return (
    <div className="calc">
      <div className="calc-in">
        <span className="kicker">Prevention budget · ลองเปลี่ยนสมมติฐานเอง</span>
        <p className="muted">ความเสียหายถ้าเกิด = ทรัพย์สิน $0.75B + กำไรที่หายกรณีกลาง ${fmt(M.loss_median / 1e9, 2)}B ≈ <b className="fg">${fmt(M.c_total / 1e9, 2)}B</b></p>
        <div className="seg" role="radiogroup" aria-label="โอกาสเกิดเหตุใหญ่">
          {[[1e-2, '1 ใน 100 ปี'], [1e-3, '1 ใน 1,000 ปี'], [1e-4, '1 ใน 10,000 ปี']].map(([v, l]) => (
            <button key={v} role="radio" aria-checked={f === v} className={f === v ? 'on' : ''} onClick={() => setF(v)}>{l}</button>
          ))}
        </div>
        <Range label="มาตรการลดความเสียหายได้" value={cut} show={`${fmt(cut * 100, 0)}%`} min={0.5} max={0.99} step={0.01} onChange={setCut} />
        <Range label="อัตราคิดลด" value={rate} show={`${fmt(rate * 100, 0)}%`} min={0.03} max={0.15} step={0.01} onChange={setRate} />
        <Range label="อายุโครงการ" value={yrs} show={`${yrs} ปี`} min={5} max={40} step={1} onChange={setYrs} />
        <dl className="calc-rows">
          <div><dt>ความเสียหายที่คาดต่อปี</dt><dd className="mono">${fmt(out.eal / 1e6, 1)}M</dd></div>
          <div><dt>ลดได้ต่อปี</dt><dd className="mono">${fmt(out.avoided / 1e6, 1)}M</dd></div>
          <div><dt>ตัวคูณมูลค่าปัจจุบัน</dt><dd className="mono">×{fmt(out.ann, 2)}</dd></div>
        </dl>
      </div>
      <div className="calc-out">
        <span className="kicker">Worth spending up to</span>
        <div className="calc-big"><span className="pre">$</span><span ref={big}>{fmt(out.pv / 1e6, 1)}</span><span className="unit">M</span></div>
        <p>มาตรการชุดไหนราคาต่ำกว่านี้ ถือว่าคุ้มในเชิงเศรษฐศาสตร์</p>
        <p className="muted small">ค่าเริ่มต้น (90%, 8%, 20 ปี) ตรงกับตารางในรายงาน ตามหลัก LOPA ชั้นป้องกันหนึ่งชั้นต้องลดโอกาสเกิดได้อย่างน้อย 10 เท่า <Src k={['calc', 'lopa']} /></p>
      </div>
    </div>
  )
}

const LESSONS = [
  ['ดูตัวที่ผิดปกติ ไม่ใช่แค่ค่าเฉลี่ย', 'การสุ่มตรวจใช้ได้เมื่อทุกชิ้นเหมือนกัน ถ้าชิ้นเดียวทำให้เกิดเหตุใหญ่ได้ ต้องตรวจทุกชิ้นอย่างน้อยหนึ่งครั้ง'],
  ['มาตรฐานเปลี่ยน ให้ถือว่าโรงงานเปลี่ยน', 'มาตรฐานใหม่ออกมาแล้ว แต่อุปกรณ์ที่สร้างตามฉบับเก่ายังเป็นของเก่าอยู่ ต้องมีคนตัดสินว่ายังปลอดภัยไหม'],
  ['ระบบป้องกันที่พังไปพร้อมเหตุ ไม่นับ', 'ต้องเช็กไฟฟ้า สายสัญญาณ และทางเข้าถึงของทุกระบบ เทียบกับไฟหรือการระเบิดที่มันต้องรับมือ'],
  ['การตัดแยกกำหนดว่าเหตุจะใหญ่แค่ไหน', 'การรั่วเริ่มจากข้องอชิ้นเดียว แต่ไฮโดรคาร์บอนก้อนใหญ่ที่ตัดไม่ได้ ทำให้กลายเป็นระเบิดสามครั้ง'],
  ['นับต้นทุนทางธุรกิจด้วย', 'เงินที่หายจากการหยุดผลิตอาจมากกว่าค่าเสียหายของเครื่องจักรหลายเท่า การลงทุนป้องกันจึงมีเหตุผลรองรับ'],
  ['ให้เครดิตสิ่งที่ทำงานได้ดี', 'RAD แสดงให้เห็นว่าระบบป้องกันที่ออกแบบดีและสั่งงานได้เร็ว เปลี่ยนผลลัพธ์ได้จริง'],
]

export default function Fixes() {
  const ref = useRef(null)
  useReveal(ref)
  return (
    <section id="fixes" className="sec fixes" ref={ref} data-theme="ink" data-chapter="fixes">
      <div className="sec-head">
        <div>
          <div className="sec-num">09 — The fix</div>
          <Lines className="sec-title" lines={['Fix the hazard,', <>then the <span className="it">holes.</span></>]} />
        </div>
        <p className="sec-lede reveal-up">
          ลำดับชั้นของการควบคุม: วิธีที่เชื่อถือได้ที่สุดคือทำให้อันตรายหายไป รองลงมาคือระบบวิศวกรรมที่กันไม่ให้รั่วหรือลดความรุนแรง ท้ายสุดคือการบริหาร
          กดแต่ละชั้นเพื่อดูว่าในเคสนี้หมายถึงอะไร
        </p>
      </div>
      <div className="reveal-up"><Hierarchy /></div>

      <div className="reveal-up"><Calculator /></div>

      <div className="lessons">
        <div className="lessons-head">
          <span className="kicker reveal-up">Six lessons · บทเรียนหกข้อ</span>
          <Lines as="h3" className="serif lessons-title" lines={['What any plant', <>can <span className="it">take from this.</span></>]} />
        </div>
        <ol className="lesson-list">
          {LESSONS.map(([h, p], i) => (
            <li key={h} className="lesson reveal-up">
              <span className="ls-n mono">0{i + 1}</span>
              <h4>{h}</h4>
              <p>{p}</p>
            </li>
          ))}
        </ol>
        <p className="muted small reveal-up thai-note">
          บริบทไทย: ประกาศกระทรวงอุตสาหกรรม (พ.ศ. 2542, 2565, 2566) และข้อบังคับ กนอ. เรื่อง PSM ใช้แนวคิดเดียวกัน
          ช่องว่างแบบเคสนี้ปิดได้ด้วยการเช็กมาตรฐานทุกปีแล้วป้อนเข้ารอบทบทวน 5 ปี สรุประดับนักศึกษา ไม่ใช่ความเห็นทางกฎหมาย
          <Src k={['moi2542', 'moi2565', 'moi2566', 'ieat']} />
        </p>
      </div>
    </section>
  )
}
