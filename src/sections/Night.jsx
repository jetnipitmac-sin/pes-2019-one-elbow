// Chapter 03: the night, as a horizontal track you scroll through.
import { useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Lines, Src } from '../components/ui.jsx'

const STATUS = {
  fail: { tag: '✕ พัง / ไม่มี', cls: 'st-fail' },
  partial: { tag: '~ ได้บางส่วน', cls: 'st-partial' },
  ok: { tag: '✓ ทำงาน', cls: 'st-ok' },
  info: { tag: '', cls: 'st-info' },
}

// times and wording follow the CSB timeline (same events as the report)
const EVENTS = [
  { t: '03:34', h: 'กะดึกปรับกระบวนการตามปกติ', p: 'โอเปอเรเตอร์เพิ่มอัตราป้อนเข้าหอ T-7 ทีละขั้น ทุกอย่างดูปกติ', s: 'info', heat: 0 },
  { t: '04:00:16', h: 'ข้องอแตก', p: 'ประมาณ 3 วินาทีหลังเพิ่มอัตราป้อนครั้งสุดท้าย โพรเพนที่มี HF ปนพุ่งออกมาเป็นกลุ่มไอ', s: 'fail', heat: 0.25 },
  { t: '04:02:06', h: 'กลุ่มไอติดไฟ', p: 'ลูกไฟลุกขึ้นทั้งพื้นที่ สัญญาณควบคุมไปยังปั๊มฉีดน้ำขาดทันที อีก 9 วินาทีไฟสำรองดับตาม', s: 'fail', heat: 0.85 },
  { t: '04:02:37', h: 'กดระบบถ่ายกรดฉุกเฉิน (RAD)', p: 'หลังรั่ว 2 นาที 21 วินาที HF ราว 339,000 ปอนด์เริ่มไหลจากถัง V-10 ไปถังเก็บที่ปลอดภัยกว่า', s: 'ok', heat: 0.8 },
  { t: '04:12', h: 'สั่งเปิดน้ำจากห้องควบคุมไม่ติด', p: 'คนเดินไปเปิดเองก็ไม่ได้เพราะร้อนเกินไป ม่านน้ำที่ควรดัก HF จึงยังไม่ทำงาน', s: 'partial', heat: 0.8 },
  { t: '04:15', t2: '04:19', h: 'ระเบิดอีกสองครั้ง', p: 'ไฮโดรคาร์บอนจากหอ T-6 และ T-7 ไหลย้อนมาเติมไฟ เพราะไม่มีวาล์วตัดด้านขาออก', s: 'fail', heat: 0.95 },
  { t: '04:22', h: 'ถัง V-1 ระเบิด ครั้งใหญ่ที่สุด', p: 'ไฟที่จ่อก้นถังทำให้ถังแตก เศษชิ้นหนึ่งหนักราว 17 ตันปลิวข้ามแม่น้ำ เศษที่ไปไกลที่สุดตกห่างออกไป 2,100 ฟุต', s: 'fail', heat: 1 },
  { t: '04:39', pre: '~', h: 'หัวหน้ากะเข้าไปเปิดน้ำด้วยมือ', p: 'ใส่ชุดดับเพลิงเดินเข้าไปเปิดปั๊มเอง ม่านน้ำดัก HF ได้ 1,968 ปอนด์ หรือ 38% ของที่รั่ว', s: 'partial', heat: 0.7 },
  { t: '08:30', d: '+1 วัน · 22 มิ.ย.', h: 'ดับไฟได้ หลังไหม้ราว 28.5 ชั่วโมง', p: 'ไม่มีผู้เสียชีวิต คนงานบาดเจ็บเล็กน้อย 5 คน ห้าวันต่อมาบริษัทประกาศปิดโรงกลั่น', s: 'info', heat: 0.15 },
]

export default function Night() {
  const sec = useRef(null), track = useRef(null), bar = useRef(null)
  useLayoutEffect(() => {
    const cards = [...track.current.querySelectorAll('.nt-card')]
    const ticks = [...bar.current.querySelectorAll('.nt-tick')]
    const dist = () => Math.max(0, track.current.scrollWidth - innerWidth)
    // card reading points along the track, measured once per refresh instead of every scroll tick
    let marks = []
    const measure = () => {
      sec.current.style.height = `${dist() + innerHeight * 1.15}px`
      marks = cards.map((c) => c.offsetLeft + c.offsetWidth * 0.3)
    }
    measure()
    let last = -1
    const st = ScrollTrigger.create({
      trigger: sec.current,
      start: 'top top',
      end: 'bottom bottom',
      invalidateOnRefresh: true,
      onRefreshInit: measure,
      onUpdate: (s) => {
        const p = s.progress
        const x = dist() * p
        gsap.set(track.current, { x: -x })
        bar.current.style.setProperty('--np', p.toFixed(4))
        // the card nearest the reading line (40% across the screen)
        const line = x + innerWidth * 0.4
        let best = 0, bd = Infinity
        marks.forEach((m, i) => { const d = Math.abs(m - line); if (d < bd) { bd = d; best = i } })
        if (best !== last) {
          last = best
          cards.forEach((c, i) => c.classList.toggle('on', i === best))
          ticks.forEach((t, i) => t.classList.toggle('on', i <= best))
          sec.current.style.setProperty('--heat', EVENTS[best].heat)
        }
      },
    })
    return () => st.kill()
  }, [])

  return (
    <section id="night" className="night" ref={sec} data-theme="ink" data-chapter="night">
      <div className="sticky">
        <div className="nt-glow" aria-hidden="true" />
        <div className="nt-head">
          <div className="sec-num">03 — The night</div>
          <Lines className="nt-title serif" lines={[<>Twenty-eight</>, <span className="it">and a half hours.</span>]} />
        </div>
        <div className="nt-track" ref={track}>
          <div className="nt-intro">
            <p>ลำดับเหตุการณ์ตามรายงาน CSB ตั้งแต่กะดึกตอนตีสามครึ่ง จนดับไฟได้ในเช้าวันรุ่งขึ้น</p>
            <p className="muted">แต่ละใบบอกว่าระบบป้องกันตัวไหนทำงาน และตัวไหนพังไปพร้อมกับเหตุ</p>
            <Src k="csb" />
          </div>
          {EVENTS.map((e, i) => {
            const st = STATUS[e.s]
            return (
              <article className="nt-card" key={i}>
                <div className="nt-idx mono">{String(i + 1).padStart(2, '0')} / {String(EVENTS.length).padStart(2, '0')}</div>
                <div className="nt-time">
                  {e.pre && <span className="nt-pre">{e.pre}</span>}{e.t}
                  {e.t2 && <span className="nt-t2"> & {e.t2}</span>}
                </div>
                {e.d && <div className="kicker nt-day">{e.d}</div>}
                <h3>{e.h}</h3>
                <p>{e.p}</p>
                {st.tag && <span className={`chip ${st.cls}`}>{st.tag}</span>}
              </article>
            )
          })}
          <div className="nt-end serif it">Five days later, the refinery announced it would close.</div>
        </div>
        <div className="nt-bar" ref={bar} aria-hidden="true">
          <span className="mono">03:34</span>
          <div className="nt-rail">
            <i className="nt-fill" />
            {EVENTS.map((e, i) => <span key={i} className={`nt-tick ${STATUS[e.s].cls}`} style={{ left: `${(i / (EVENTS.length - 1)) * 100}%` }} />)}
          </div>
          <span className="mono">08:30 <span className="muted">+1d</span></span>
        </div>
      </div>
    </section>
  )
}
