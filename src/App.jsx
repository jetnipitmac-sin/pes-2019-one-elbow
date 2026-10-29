import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Stage from './gl/Stage.jsx'
import { initScroll, jumpFromQuery, stage, STILL } from './lib/scroll.js'
import { chapterStore, glStore } from './lib/store.js'
import { Preloader, Cursor, Nav } from './components/chrome.jsx'
import { Hero, Manifesto, Anatomy, Rupture } from './sections/Story.jsx'
import Night from './sections/Night.jsx'
import Toll from './sections/Toll.jsx'
import Forensics from './sections/Forensics.jsx'
import Barriers from './sections/Barriers.jsx'
import Reach from './sections/Reach.jsx'
import Cost from './sections/Cost.jsx'
import Fixes from './sections/Fixes.jsx'
import Epilogue from './sections/Epilogue.jsx'

if (import.meta.env.DEV) window.__stage = stage

export default function App() {
  const [intro, setIntro] = useState(STILL)

  useLayoutEffect(() => { initScroll() }, [])

  useEffect(() => {
    const triggers = []
    // page colour + nav chapter follow whichever section crosses the middle of the screen
    document.querySelectorAll('main [data-theme]').forEach((el) => {
      triggers.push(ScrollTrigger.create({
        trigger: el,
        start: 'top 55%',
        end: 'bottom 55%',
        onToggle: (s) => {
          if (!s.isActive) return
          document.documentElement.dataset.theme = el.dataset.theme
          chapterStore.set(el.dataset.chapter)
        },
      }))
    })
    // the WebGL stage only runs while a chapter that shows it is on screen
    let a = true, b = false
    const sync = () => glStore.set(a || b)
    triggers.push(ScrollTrigger.create({
      trigger: '#rupture', start: 'bottom bottom', end: 'bottom bottom',
      onEnter: () => { a = false; sync() }, onLeaveBack: () => { a = true; sync() },
    }))
    triggers.push(ScrollTrigger.create({
      trigger: '#epilogue', start: 'top bottom', end: 'bottom top',
      onToggle: (s) => { b = s.isActive; sync() },
    }))
    // ScrollTrigger already refreshes on resize; only re-measure once the fonts have settled
    document.fonts.ready.then(() => {
      ScrollTrigger.refresh()
      jumpFromQuery()
    })
    return () => triggers.forEach((t) => t.kill())
  }, [])

  const done = useCallback(() => setIntro(true), [])

  return (
    <>
      <Stage />
      <Preloader onDone={done} />
      <Cursor />
      <Nav show={intro} />
      <main>
        <Hero intro={intro} />
        <Manifesto />
        <Anatomy />
        <Rupture />
        <Night />
        <Toll />
        <Forensics />
        <Barriers />
        <Reach />
        <Cost />
        <Fixes />
        <Epilogue />
      </main>
      <div className="grain" aria-hidden="true" />
    </>
  )
}
