// Chapter 10: what happened afterwards, then sources and credits.
import { useLayoutEffect, useRef } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Lines, Magnetic, Marquee, Src, useReveal } from '../components/ui.jsx'
import { SRC } from '../lib/sources.js'
import { stage, scrollTo } from '../lib/scroll.js'

const AFTER = [
  ['22 มิ.ย. 2019', 'ดับไฟได้', 'ราว 08:30 หลังไฟไหม้ประมาณ 28.5 ชั่วโมง', 'csb'],
  ['26 มิ.ย. 2019', 'ประกาศปิดโรงกลั่น', 'ห้าวันหลังเกิดเหตุ บริษัทบอกว่าจะปิดโรงกลั่นที่ใหญ่ที่สุดฝั่งตะวันออก', 'witf'],
  ['22 ก.ค. 2019', 'ยื่นล้มละลาย', 'คนงานโดยตรงราว 1,100 คนต้องเผชิญการเลิกจ้าง', 'npr'],
  ['7–27 ส.ค. 2019', 'ทำให้ HF ในถัง RAD เป็นกลาง', 'กรดที่ RAD เก็บไว้ค้างอยู่ 67 วันกว่าจะจัดการเสร็จ', 'csb'],
  ['24 ก.ย. 2019', 'เมืองประกาศควบคุมได้', 'หลังส่งเจ้าหน้าที่เฝ้าพื้นที่ 24 ชั่วโมงรวม 95 วัน', 'city'],
  ['ก.พ. 2020', 'ขายพื้นที่', 'ศาลอนุมัติขายให้บริษัทพัฒนาที่ดิน (รายงานว่าราคา 225 ล้านดอลลาร์)', 'abc'],
  ['ต.ค. 2021', 'Bellwether District', 'พื้นที่ 1,300 เอเคอร์กลายเป็นเขตพัฒนาใหม่ ไม่ทำโรงกลั่นต่อ', 'abc'],
  ['11 ต.ค. 2022', 'CSB ออกรายงานฉบับสุดท้าย', 'สรุปสาเหตุและข้อเสนอแนะ เป็นแหล่งข้อเท็จจริงหลักของงานนี้', 'csbNews'],
]

export default function Epilogue() {
  const ref = useRef(null)
  useReveal(ref)
  useLayoutEffect(() => {
    const t = ScrollTrigger.create({
      trigger: '#epilogue',
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (s) => { stage.epilogue = Math.min(1, s.progress * 3) },
      onLeaveBack: () => { stage.epilogue = 0 },
    })
    return () => t.kill()
  }, [])
  return (
    <>
      <section id="epilogue" className="sec epilogue" ref={ref} data-theme="ink" data-chapter="epilogue">
        <div className="ep-copy">
          <div className="sec-num">10 — Epilogue</div>
          <Lines className="sec-title" lines={['The refinery', <span className="it">never reopened.</span>]} />
          <p className="sec-lede reveal-up">
            โรงกลั่นที่เดินเครื่องมาหลายสิบปีปิดตัวภายในหนึ่งสัปดาห์ ไม่ใช่เพราะไฟไหม้หมดทั้งโรง แต่เพราะเงินที่ต้องใช้ซ่อม
            กับเวลาที่ต้องหยุดผลิต มากเกินกว่าที่บริษัทจะรับไหว ทั้งหมดเริ่มจากข้องอชิ้นเดียวที่ไม่มีใครวัด
          </p>
        </div>
        <ol className="after">
          {AFTER.map(([w, h, p, s]) => (
            <li key={w} className="after-row reveal-up">
              <span className="after-when mono">{w}</span>
              <span className="after-h">{h}</span>
              <span className="after-p">{p} <Src k={s} /></span>
            </li>
          ))}
        </ol>
      </section>

      <footer className="footer" data-theme="ink" data-chapter="epilogue">
        <Marquee items={['One elbow', 'One refinery', '04:00:16', 'Check every piece', 'Barriers must survive the event']} />
        <div className="ft-grid">
          <div className="ft-about">
            <span className="kicker">About this case file</span>
            <p>
              งานวิเคราะห์เคสในระดับนักศึกษา จากเอกสารสาธารณะ (รายงานสอบสวน U.S. CSB, รายงานเมืองฟิลาเดลเฟีย, ข้อมูล EIA)
              ไม่มีการกล่าวหาใครเพิ่มเติมจากที่รายงานสรุปไว้ ตัวเลขทุกตัวบนหน้านี้อ่านจากไฟล์ชุดเดียวกับรายงานฉบับเต็ม
            </p>
            <p className="muted small">ภาพ 3 มิติ แผนผัง และวงรัศมี วาดเพื่ออธิบายหลักการ ไม่ใช่แบบทางวิศวกรรม</p>
            <Magnetic><button className="pill" onClick={() => scrollTo(0, { duration: 2.6 })} data-cursor="บนสุด">Back to the top ↑</button></Magnetic>
          </div>
          <div className="ft-src">
            <span className="kicker">Sources</span>
            <ul>
              {Object.entries(SRC).map(([k, s]) => (
                <li key={k}>{s.url ? <a href={s.url} target="_blank" rel="noreferrer" data-cursor="อ่าน">{s.label}</a> : <span>{s.label}</span>}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="ft-word serif" aria-hidden="true">One <span className="it">elbow.</span></div>
        <div className="ft-base">
          <span className="kicker">© 2026 Jetnipit Sinwisitsophon · Chemical Engineering, Mahidol University</span>
          <span className="kicker">Built with React · Three.js · GSAP · Lenis</span>
        </div>
      </footer>
    </>
  )
}
